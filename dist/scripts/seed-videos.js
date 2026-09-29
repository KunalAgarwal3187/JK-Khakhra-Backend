import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import cloudinary from "../src/config/cloudinary.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const videosDir = path.resolve(__dirname, "..", "..", "JK Khakhra Showcase", "src", "assets", "coin khakhra videos");
const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const videos = [
    "8766ac0e188a4ad9923431b7d440035d.HD-720p-1.6Mbps-79271186.mp4",
    "quick-easy-khakhra-chaat.mp4",
    "healthy-breakfast-khakhra.mp4",
];
async function main() {
    for (const [displayOrder, fileName] of videos.entries()) {
        const publicId = path.basename(fileName, path.extname(fileName));
        const result = await cloudinary.uploader.upload(path.join(videosDir, fileName), {
            folder: "videos/snack-shorts",
            public_id: publicId,
            resource_type: "video",
            overwrite: true,
            invalidate: true,
        });
        await prisma.video.upsert({
            where: { publicId },
            update: { videoUrl: result.secure_url, displayOrder, isActive: true },
            create: {
                publicId,
                videoUrl: result.secure_url,
                displayOrder,
                isActive: true,
            },
        });
        console.log(`${fileName}: ${result.secure_url}`);
    }
}
main()
    .catch((error) => {
    console.error("Video seed failed:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
