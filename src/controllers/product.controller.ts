import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getBestSellers = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isBestSeller: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching best sellers:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
    }

    const started = performance.now();
    const product = await prisma.product.findUnique({
      where: { slug },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const [category, relatedProducts, relatedCategories] = await Promise.all([
      prisma.category.findUnique({
        where: { id: product.categoryId },
        select: { name: true, slug: true, image: true },
      }),
      prisma.product.findMany({
        where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
        select: { name: true, slug: true, image: true, weight: true },
      }),
      prisma.category.findMany({
        where: { isActive: true, id: { not: product.categoryId } },
        select: { name: true, slug: true, image: true },
      }),
    ]);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    const randomItems = <T,>(items: T[], count: number) =>
      items.sort(() => Math.random() - 0.5).slice(0, count);

    console.log(
      `[product/${slug}] db=${Math.round(performance.now() - started)}ms`
    );

    return res.status(200).json({
      success: true,
      data: {
        product,
        category,
        relatedProducts: randomItems(relatedProducts, 4),
        relatedCategories: randomItems(relatedCategories, 5),
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};