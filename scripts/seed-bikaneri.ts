import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "bikaneri-special" },
    update: {
      name: "Bikaneri Special",
      image:
        "https://res.cloudinary.com/dcfy6kgn3/image/upload/v1789894659/products/bikaneri-special/peni-masala.webp",
      isActive: true,
      displayOrder: 6,
    },
    create: {
      name: "Bikaneri Special",
      slug: "bikaneri-special",
      image:
        "https://res.cloudinary.com/dcfy6kgn3/image/upload/v1789894659/products/bikaneri-special/peni-masala.webp",
      isActive: true,
      displayOrder: 6,
    },
  });

  const products = [
    {
      name: "Fangama Masala",
      slug: "fangama-masala",
      shortDescription: "Crunchy masala snack with a classic savory profile.",
      image:
        "https://res.cloudinary.com/dcfy6kgn3/image/upload/v1789894656/products/bikaneri-special/fangama-masala.webp",
      displayOrder: 1,
    },
    {
      name: "Tanatan Masala",
      slug: "tanatan-masala",
      shortDescription: "Light and crisp bite with a distinct masala kick.",
      image:
        "https://res.cloudinary.com/dcfy6kgn3/image/upload/v1789894657/products/bikaneri-special/tanatan-masala.webp",
      displayOrder: 2,
    },
    {
      name: "Katori Masala",
      slug: "katori-masala",
      shortDescription:
        "Crunchy, bowl-shaped snack with a fun texture and rich masala.",
      image:
        "https://res.cloudinary.com/dcfy6kgn3/image/upload/v1789894659/products/bikaneri-special/katori-masala.webp",
      displayOrder: 3,
    },
    {
      name: "Peni Masala",
      slug: "peni-masala",
      shortDescription:
        "Traditional Bikaneri savory snack with a satisfying crunch.",
      image:
        "https://res.cloudinary.com/dcfy6kgn3/image/upload/v1789894658/products/bikaneri-special/peni-masala.webp",
      displayOrder: 4,
    },
    {
      name: "Maida Kaju",
      slug: "maida-kaju",
      shortDescription: "A rich, buttery snack with a nutty finish.",
      image:
        "https://res.cloudinary.com/dcfy6kgn3/image/upload/v1789894660/products/bikaneri-special/maida-kaju.webp",
      displayOrder: 5,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        shortDescription: product.shortDescription,
        image: product.image,
        price: 0,
        stock: 0,
        isActive: true,
        displayOrder: product.displayOrder,
      },
      create: {
        categoryId: category.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        image: product.image,
        price: 0,
        stock: 0,
        isActive: true,
        displayOrder: product.displayOrder,
      },
    });
  }

  console.log("Bikaneri Special category seeded");
  console.log("5 Bikaneri products seeded");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });