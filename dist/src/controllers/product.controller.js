import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
export const getBestSellers = async (_req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching best sellers:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getProductBySlug = async (req, res) => {
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
        const product = await prisma.product.findUnique({
            where: { slug },
            include: { category: { select: { name: true, slug: true, image: true } } },
        });
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        const { category, ...productWithoutCategory } = product;
        const [relatedProducts, relatedCategories] = await Promise.all([
            prisma.product.findMany({
                where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
                select: { name: true, slug: true, image: true, weight: true },
            }),
            prisma.category.findMany({
                where: { isActive: true, slug: { not: category.slug } },
                select: { name: true, slug: true, image: true },
            }),
        ]);
        const randomItems = (items, count) => items.sort(() => Math.random() - 0.5).slice(0, count);
        return res.status(200).json({
            success: true,
            data: {
                product: productWithoutCategory,
                category,
                relatedProducts: randomItems(relatedProducts, 4),
                relatedCategories: randomItems(relatedCategories, 5),
            },
        });
    }
    catch (error) {
        console.error("Error fetching product:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
