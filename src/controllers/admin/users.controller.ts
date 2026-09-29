import { Request, Response } from "express";
import { Prisma, UserRole } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const parsePage = (value: unknown, fallback = 1) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
};

const parsePageSize = (value: unknown, fallback = 20) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), 100);
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const page = parsePage(req.query.page);
    const pageSize = parsePageSize(req.query.pageSize);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role.toUpperCase() : "";
    const status = typeof req.query.status === "string" ? req.query.status.toLowerCase() : "";
    const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "createdAt";
    const sortOrder =
      typeof req.query.sortOrder === "string" &&
      req.query.sortOrder.toLowerCase() === "asc"
        ? "asc"
        : "desc";

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && Object.values(UserRole).includes(role as UserRole)) {
      where.role = role as UserRole;
    }

    if (status === "active") where.isActive = true;
    if (status === "blocked") where.isActive = false;

    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === "name"
        ? { name: sortOrder }
        : { createdAt: sortOrder };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: USER_SAFE_SELECT,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items: users,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      },
    });
  } catch (error) {
    console.error("Error listing users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid user id is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SAFE_SELECT,
        _count: { select: { addresses: true } },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { _count, ...profile } = user;

    return res.status(200).json({
      success: true,
      data: {
        ...profile,
        addressCount: _count.addresses,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const blockUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid user id is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SAFE_SELECT,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // FR-B12: cannot block another Admin
    if (user.role === UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be blocked through this panel",
      });
    }

    if (!user.isActive) {
      return res.status(200).json({
        success: true,
        data: user,
        message: "User is already blocked",
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SAFE_SELECT,
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: "User blocked successfully",
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const unblockUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid user id is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SAFE_SELECT,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isActive) {
      return res.status(200).json({
        success: true,
        data: user,
        message: "User is already active",
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: USER_SAFE_SELECT,
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
