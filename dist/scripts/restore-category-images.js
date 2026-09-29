import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import cloudinary from "../src/config/cloudinary.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, "..", "..", "JK Khakhra Showcase", "src", "assets", "coin khakhra");
const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const categories = [
    { slug: "gujarati-farsan", file: "image copy 43.webp" },
    { slug: "falahari-special", file: "image copy 44.webp" },
    { slug: "bikaneri-special", file: "image copy 45.webp" },
];
async function main() {
    for (const category of categories) {
        const result = await cloudinary.uploader.upload(path.join(assetsDir, category.file), {
            folder: "categories",
            public_id: category.slug,
            resource_type: "image",
            overwrite: true,
            invalidate: true,
        });
        await prisma.category.update({
            where: { slug: category.slug },
            data: { image: result.secure_url },
        });
        console.log(`${category.slug}: ${result.secure_url}`);
    }
}
main()
    .catch((error) => {
    console.error("Category image restore failed:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
