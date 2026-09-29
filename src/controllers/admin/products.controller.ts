import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import {
  createProductSchema,
  productBestSellerSchema,
  productStatusSchema,
  updateProductSchema,
} from "../../validators/admin.validators.js";

const PRODUCT_LIST_SELECT = {
  id: true,
  categoryId: true,
  name: true,
  slug: true,
  shortDescription: true,
  image: true,
  price: true,
  stock: true,
  isBestSeller: true,
  isActive: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true, isActive: true } },
} as const;

const PRODUCT_DETAIL_SELECT = {
  id: true,
  categoryId: true,
  name: true,
  slug: true,
  shortDescription: true,
  tagline: true,
  description: true,
  image: true,
  ingredients: true,
  weight: true,
  foodType: true,
  shelfLife: true,
  benefits: true,
  nutrition: true,
  price: true,
  stock: true,
  isBestSeller: true,
  isActive: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true, isActive: true } },
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

const parseOptionalBool = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return undefined;
};

export const listProducts = async (req: Request, res: Response) => {
  try {
    const page = parsePage(req.query.page);
    const pageSize = parsePageSize(req.query.pageSize);
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const categoryIdsRaw = [req.query.categoryIds, req.query.categoryId]
      .flatMap((value) =>
        typeof value === "string"
          ? value.split(",")
          : Array.isArray(value)
            ? value
            : []
      )
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
    const categoryIds = [...new Set(categoryIdsRaw)];
    const status =
      typeof req.query.status === "string" ? req.query.status.toLowerCase() : "";
    const isBestSeller = parseOptionalBool(req.query.isBestSeller);
    const sortBy =
      typeof req.query.sortBy === "string" ? req.query.sortBy : "createdAt";
    const sortOrder =
      typeof req.query.sortOrder === "string" &&
      req.query.sortOrder.toLowerCase() === "asc"
        ? "asc"
        : "desc";

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      const searchOr: Prisma.ProductWhereInput[] = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
      ];
      const asId = Number(search);
      if (Number.isInteger(asId) && asId > 0) {
        searchOr.push({ id: asId });
      }
      where.OR = searchOr;
    }
    if (categoryIds.length === 1) {
      where.categoryId = categoryIds[0];
    } else if (categoryIds.length > 1) {
      where.categoryId = { in: categoryIds };
    }
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (isBestSeller !== undefined) where.isBestSeller = isBestSeller;

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sortBy === "name"
        ? { name: sortOrder }
        : sortBy === "price"
          ? { price: sortOrder }
          : sortBy === "stock"
            ? { stock: sortOrder }
            : { createdAt: sortOrder };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        select: PRODUCT_LIST_SELECT,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items: products,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      },
    });
  } catch (error) {
    console.error("Error listing products:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid product id is required",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: PRODUCT_DETAIL_SELECT,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const data = parsed.data;

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true, isActive: true },
    });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Selected category does not exist",
      });
    }

    const slugTaken = await prisma.product.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (slugTaken) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists",
      });
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        categoryId: data.categoryId,
        shortDescription: data.shortDescription ?? null,
        tagline: data.tagline ?? null,
        description: data.description ?? null,
        image: data.image ?? null,
        ingredients: data.ingredients ?? null,
        weight: data.weight ?? null,
        foodType: data.foodType ?? null,
        shelfLife: data.shelfLife ?? null,
        benefits:
          data.benefits === null
            ? Prisma.JsonNull
            : data.benefits === undefined
              ? undefined
              : data.benefits,
        nutrition:
          data.nutrition === null
            ? Prisma.JsonNull
            : data.nutrition === undefined
              ? undefined
              : data.nutrition,
        price: data.price,
        stock: data.stock ?? 100,
        isBestSeller: data.isBestSeller ?? false,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
      select: PRODUCT_DETAIL_SELECT,
    });

    return res.status(201).json({
      success: true,
      data: product,
      message: category.isActive
        ? "Product created successfully"
        : "Product created successfully. Warning: the selected category is currently hidden from the public site.",
      warning: category.isActive
        ? undefined
        : "This category is currently hidden from the public site",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists",
      });
    }
    console.error("Error creating product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid product id is required",
      });
    }

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const data = parsed.data;

    if (data.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true, isActive: true },
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Selected category does not exist",
        });
      }
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.product.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });
      if (slugTaken) {
        return res.status(409).json({
          success: false,
          message: "A product with this slug already exists",
        });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.shortDescription !== undefined && {
          shortDescription: data.shortDescription,
        }),
        ...(data.tagline !== undefined && { tagline: data.tagline }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.ingredients !== undefined && { ingredients: data.ingredients }),
        ...(data.weight !== undefined && { weight: data.weight }),
        ...(data.foodType !== undefined && { foodType: data.foodType }),
        ...(data.shelfLife !== undefined && { shelfLife: data.shelfLife }),
        ...(data.benefits !== undefined && {
          benefits:
            data.benefits === null ? Prisma.JsonNull : data.benefits,
        }),
        ...(data.nutrition !== undefined && {
          nutrition:
            data.nutrition === null ? Prisma.JsonNull : data.nutrition,
        }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.isBestSeller !== undefined && {
          isBestSeller: data.isBestSeller,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.displayOrder !== undefined && {
          displayOrder: data.displayOrder,
        }),
      },
      select: PRODUCT_DETAIL_SELECT,
    });

    return res.status(200).json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists",
      });
    }
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProductStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid product id is required",
      });
    }

    const parsed = productStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: PRODUCT_LIST_SELECT,
    });

    return res.status(200).json({
      success: true,
      data: product,
      message: `Product ${parsed.data.isActive ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProductBestSeller = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid product id is required",
      });
    }

    const parsed = productBestSellerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isBestSeller: parsed.data.isBestSeller },
      select: PRODUCT_LIST_SELECT,
    });

    let warning: string | undefined;
    if (parsed.data.isBestSeller) {
      const bestSellerCount = await prisma.product.count({
        where: { isBestSeller: true, isActive: true },
      });
      if (bestSellerCount > 10) {
        warning = `There are now ${bestSellerCount} active best sellers. Consider keeping this under 8–10 for the homepage section.`;
      }
    }

    return res.status(200).json({
      success: true,
      data: product,
      message: `Product ${parsed.data.isBestSeller ? "marked" : "unmarked"} as best seller`,
      warning,
    });
  } catch (error) {
    console.error("Error updating product best seller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid product id is required",
      });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            cartItems: true,
            orderItems: true,
            inquiries: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // FR-D12: block delete if referenced
    const { cartItems, orderItems, inquiries } = existing._count;
    const totalRefs = cartItems + orderItems + inquiries;
    if (totalRefs > 0) {
      return res.status(409).json({
        success: false,
        message: `This product cannot be deleted because it has existing references (${orderItems} order item(s), ${cartItems} cart item(s), ${inquiries} inquiry/inquiries). Deactivate it instead to hide it from the public catalog.`,
        references: { cartItems, orderItems, inquiries },
      });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
