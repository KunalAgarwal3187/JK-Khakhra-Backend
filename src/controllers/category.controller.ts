import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        name: true,
        slug: true,
        image: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCategoryBySlug = async (
  req: Request,
  res: Response
) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Category slug is required",
      });
    }

    const category = await prisma.category.findUnique({
      where: {
        slug,
      },
      include: {
        products: {
          where: {
            isActive: true,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
        inquiries: true,
      },
    });

    // Public storefront must only expose active categories (BRD §12 Consistency)
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const relatedCategories = await prisma.category.findMany({
      where: { isActive: true, slug: { not: category.slug } },
      select: { name: true, slug: true, image: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...category,
        relatedCategories: relatedCategories
          .sort(() => Math.random() - 0.5)
          .slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Error fetching category:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};