import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
export const getHomeData = async (_req, res) => {
    try {
        const [categories, bestSellers, videos] = await Promise.all([
            prisma.category.findMany({
                where: { isActive: true },
                select: {
                    name: true,
                    slug: true,
                    image: true,
                },
                orderBy: { displayOrder: "asc" },
            }),
            prisma.product.findMany({
                where: {
                    isActive: true,
                    isBestSeller: true,
                },
                select: {
                    name: true,
                    slug: true,
                    image: true,
                    weight: true,
                },
                orderBy: { displayOrder: "asc" },
            }),
            prisma.video.findMany({
                where: { isActive: true },
                select: { videoUrl: true, publicId: true },
                orderBy: { displayOrder: "asc" },
            }),
        ]);
        return res.status(200).json({
            success: true,
            data: {
                categories,
                bestSellers,
                videos,
            },
        });
    }
    catch (error) {
        console.error("Error fetching home data:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
