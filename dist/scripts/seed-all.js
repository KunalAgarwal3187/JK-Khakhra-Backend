import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import cloudinary from "../src/config/cloudinary.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coinAssetsDir = path.resolve(__dirname, "..", "..", "JK Khakhra Showcase", "src", "assets", "coin khakhra");
const categoryAssetsDir = path.resolve(__dirname, "..", "..", "JK Khakhra Showcase", "src", "assets");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const asset = (fileName) => path.join(coinAssetsDir, fileName);
const categoryAsset = (fileName) => path.join(categoryAssetsDir, fileName);
const catalog = [
    {
        slug: "coin-khakhra",
        name: "Coin Khakhra",
        description: "Bite-sized crispy khakhra coins packed with bold flavors.",
        image: asset("image copy 37.webp"),
        products: [
            ["Masala Coin", "Spicy, tangy, irresistible.", "image copy 48.webp"],
            ["Tangy Tomato Coin", "Bold tomato flavor with a zesty kick.", "image copy 47.webp"],
            ["Achaari Coin", "Pickle-inspired flavor, savory and punchy.", "image copy 52.webp"],
            ["Pizza Coin", "Italian-inspired cheesy, herbaceous twist.", "image copy 53.webp"],
            ["Pani Puri Coin", "Street-style chaat flavor in every bite.", "image copy 54.webp"],
            ["Chat Pata Coin", "Classic spicy chat flavor.", "image copy 55.webp"],
            ["Methi Coin", "Crunchy, bold, and savory.", "image copy 56.webp"],
            ["Jeera Coin", "Classic cumin-infused crisp.", "image copy 61.webp"],
            ["Plain Coin", "Simple, clean, and crisp.", "image copy 59.webp"],
            ["Ajwain Coin", "Distinct ajwain flavor with a gentle savory finish.", "image copy 62.webp"],
        ],
    },
    {
        slug: "regular-khakhra",
        name: "Regular Khakhra",
        description: "The classic Gujarati khakhra, thin, crisp, and packed with traditional flavor.",
        image: asset("image copy 38.webp"),
        products: [
            ["Methi Khakhra", "Aromatic fenugreek flavor in a crisp bite.", "image copy 82.webp"],
            ["Jeera Khakhra", "Roasted cumin warmth in every bite.", "image copy 86.webp"],
            ["Ajwain Khakhra", "Carom seed spice with a bold finish.", "image copy 90.webp"],
            ["Plain Khakhra", "The original, pure and simple.", "image copy 92.webp"],
            ["Masala Khakhra", "Bold spice blend, full-bodied flavor.", "image copy 60-png.webp"],
            ["Chat Pata Khakhra", "Classic tangy chat flavor in a crunchy bite.", "image copy 91.webp"],
            ["Punjabi Khakhra", "Rich, hearty, and satisfying.", "image copy 62-png.webp"],
            ["Pani Puri Khakhra", "Street-style chaat flavor in every crunch.", "image copy 59-png.webp"],
            ["Manchurian Khakhra", "Fusion flavor with a spicy, savory kick.", "image copy 88.webp"],
            ["Pizza Khakhra", "Cheesy, herbaceous flavor with a snackable twist.", "image copy 95.webp"],
            ["Peri Peri Khakhra", "Fiery, zesty, and full of flavor.", "image copy 94.webp"],
            ["Khata Mitha Khakhra", "Sweet and tangy flavor in one crisp bite.", "image copy 93.webp"],
            ["Achaari Khakhra", "Pickle-inspired flavor with a punchy bite.", "image copy 61-png.webp"],
            ["Maggi Khakhra", "Comforting noodle flavor with a crunchy khakhra finish.", "image copy 63.webp"],
            ["Chanajor Khakhra", "Classic savory chana flavor in a crisp bite.", "image copy 96.webp"],
            ["Pav Bhaji Khakhra", "Iconic spicy pav bhaji flavor in every crunch.", "image copy 58-png.webp"],
        ],
    },
    {
        slug: "falahari-khakhra",
        name: "Falahari Khakhra",
        description: "Specially crafted fasting-day snacks made with fasting-friendly ingredients.",
        image: asset("image copy 40.webp"),
        products: [
            ["Red Chilli Falahari", "Spicy, bold, and fasting-friendly.", "image copy 40.webp"],
            ["Black Pepper Falahari", "Peppery warmth with a crisp finish.", "image copy 49.webp"],
            ["Pudina Falahari", "Refreshing mint flavor for a light bite.", "image copy 50.webp"],
            ["Plain Falahari", "Simple and traditional, perfect for fasting.", "image copy 83.webp"],
        ],
    },
    {
        slug: "falahari-special",
        name: "Falahari Special",
        description: "A complete range of fasting-day snacks, pure, sattvik, and made for vrat.",
        image: asset("image copy 44.webp"),
        products: [
            ["Aloo Wafer", "Crispy potato wafers for a classic crunch.", "image copy 66.webp"],
            ["Banana Wafer", "Banana wafer with a light, crisp bite.", "image copy 65.webp"],
            ["Masala Mixture", "A savory blend with bold spice and crunch.", "image copy 68.webp"],
            ["Black Pepper Mixture", "Peppery, savory, and perfectly crunchy.", "image copy 67.webp"],
            ["Coconut Falahari Biscuit", "A coconut-infused biscuit with a light texture.", "image copy 69.webp"],
            ["Ajwain Falahari Biscuit", "Carom seed flavor in a crisp fasting biscuit.", "image copy 72.webp"],
            ["Jeera Falahari Biscuit", "Cumin-spiced biscuit with a warm flavor.", "image copy 71.webp"],
            ["Plain Falahari Biscuit", "Simple and classic, made for everyday snacking.", "image copy 70.webp"],
        ],
    },
    {
        slug: "gujarati-farsan",
        name: "Gujarati Farsan",
        description: "Authentic Gujarati farsan, crunchy, savory, and made the traditional way.",
        image: asset("image copy 43.webp"),
        products: [
            ["Masala Chanajor", "Crunchy, spiced, and full of traditional flavor.", "image copy 81.webp"],
            ["Bingo Chips", "Crisp chips with a savory snack appeal.", "image copy 80.webp"],
            ["Gujrati Chakli", "Spiral crunch with a spicy kick.", "image copy 43.webp"],
            ["Gujrati Bhakharvadi", "Classic Gujarati savory bite with a hearty crunch.", "image copy 79.webp"],
            ["Gujrati Mini Bhakharvadi", "Mini-sized version of the traditional favorite.", "image copy 78.webp"],
        ],
    },
    {
        slug: "bikaneri-special",
        name: "Bikaneri Special",
        description: "Authentic Bikaneri snacks with bold spices, rich flavors, and traditional recipes.",
        image: asset("image copy 45.webp"),
        products: [
            ["Fangama Masala", "Crunchy masala snack with a classic savory profile.", "image copy 74.webp"],
            ["Tanatan Masala", "Light and crisp bite with a distinct masala kick.", "image copy 75.webp"],
            ["Katori Masala", "Crunchy, bowl-shaped snack with a fun texture and rich masala.", "image copy 76.webp"],
            ["Peni Masala", "Traditional Bikaneri savory snack with a satisfying crunch.", "image copy 73.webp"],
            ["Maida Kaju", "A rich, buttery snack with a nutty finish.", "image copy 77.webp"],
        ],
    },
];
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
async function uploadImage(filePath, folder, publicId) {
    const result = await cloudinary.uploader.upload(filePath, {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        invalidate: true,
    });
    return result.secure_url;
}
async function main() {
    let productCount = 0;
    for (const [categoryIndex, categoryInput] of catalog.entries()) {
        const categoryImage = await uploadImage(categoryInput.image, "categories", categoryInput.slug);
        const category = await prisma.category.upsert({
            where: { slug: categoryInput.slug },
            update: {
                name: categoryInput.name,
                image: categoryImage,
                isActive: true,
                displayOrder: categoryIndex + 1,
            },
            create: {
                name: categoryInput.name,
                slug: categoryInput.slug,
                image: categoryImage,
                isActive: true,
                displayOrder: categoryIndex + 1,
            },
        });
        for (const [productIndex, [name, description, fileName]] of categoryInput.products.entries()) {
            const productSlug = slugify(name);
            const imageUrl = await uploadImage(asset(fileName), `products/${categoryInput.slug}`, productSlug);
            await prisma.product.upsert({
                where: { slug: productSlug },
                update: {
                    categoryId: category.id,
                    name,
                    shortDescription: description,
                    image: imageUrl,
                    price: 0,
                    stock: 0,
                    isActive: true,
                    displayOrder: productIndex + 1,
                },
                create: {
                    categoryId: category.id,
                    name,
                    slug: productSlug,
                    shortDescription: description,
                    image: imageUrl,
                    price: 0,
                    stock: 0,
                    isActive: true,
                    displayOrder: productIndex + 1,
                },
            });
            productCount += 1;
        }
        console.log(`${categoryInput.name}: ${categoryInput.products.length} products seeded`);
    }
    console.log(`Seed complete: ${catalog.length} categories, ${productCount} products`);
}
main()
    .catch((error) => {
    console.error("Full catalog seed failed:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
