import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import {
  categoryStatusSchema,
  createCategorySchema,
  reorderCategoriesSchema,
  updateCategorySchema,
} from "../../validators/admin.validators.js";

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  image: true,
  isActive: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
} as const;

export const listCategories = async (req: Request, res: Response) => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status =
      typeof req.query.status === "string" ? req.query.status.toLowerCase() : "";

    const where: Prisma.CategoryWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const categories = await prisma.category.findMany({
      where,
      select: CATEGORY_SELECT,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return res.status(200).json({
      success: true,
      data: categories.map(({ _count, ...cat }) => ({
        ...cat,
        productCount: _count.products,
      })),
    });
  } catch (error) {
    console.error("Error listing categories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const data = parsed.data;

    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
    }

    let displayOrder = data.displayOrder;
    if (displayOrder === undefined) {
      const max = await prisma.category.aggregate({
        _max: { displayOrder: true },
      });
      displayOrder = (max._max.displayOrder ?? -1) + 1;
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        image: data.image ?? null,
        isActive: data.isActive ?? true,
        displayOrder,
      },
      select: CATEGORY_SELECT,
    });

    const { _count, ...rest } = category;

    return res.status(201).json({
      success: true,
      data: { ...rest, productCount: _count.products },
      message: "Category created successfully",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
    }
    console.error("Error creating category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid category id is required",
      });
    }

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const slugTaken = await prisma.category.findUnique({
        where: { slug: parsed.data.slug },
        select: { id: true },
      });
      if (slugTaken) {
        return res.status(409).json({
          success: false,
          message: "A category with this slug already exists",
        });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.slug !== undefined && { slug: parsed.data.slug }),
        ...(parsed.data.image !== undefined && { image: parsed.data.image }),
        ...(parsed.data.displayOrder !== undefined && {
          displayOrder: parsed.data.displayOrder,
        }),
        ...(parsed.data.isActive !== undefined && {
          isActive: parsed.data.isActive,
        }),
      },
      select: CATEGORY_SELECT,
    });

    const { _count, ...rest } = category;

    return res.status(200).json({
      success: true,
      data: { ...rest, productCount: _count.products },
      message: "Category updated successfully",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
    }
    console.error("Error updating category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateCategoryStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid category id is required",
      });
    }

    const parsed = categoryStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: CATEGORY_SELECT,
    });

    const { _count, ...rest } = category;

    return res.status(200).json({
      success: true,
      data: { ...rest, productCount: _count.products },
      message: `Category ${parsed.data.isActive ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    console.error("Error updating category status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid category id is required",
      });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { products: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // FR-C11: block delete if products exist
    if (existing._count.products > 0) {
      return res.status(409).json({
        success: false,
        message: `This category has ${existing._count.products} product(s). Reassign or remove them before deleting. Consider deactivating instead.`,
        productCount: existing._count.products,
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const reorderCategories = async (req: Request, res: Response) => {
  try {
    const parsed = reorderCategoriesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      });
    }

    await prisma.$transaction(
      parsed.data.items.map((item) =>
        prisma.category.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    const categories = await prisma.category.findMany({
      select: CATEGORY_SELECT,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return res.status(200).json({
      success: true,
      data: categories.map(({ _count, ...cat }) => ({
        ...cat,
        productCount: _count.products,
      })),
      message: "Categories reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering categories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
