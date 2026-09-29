import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting database seed...");

  const categories = [
    {
      name: "Coin Khakhra",
      slug: "coin-khakhra",
      displayOrder: 1,
    },
    {
      name: "Regular Khakhra",
      slug: "regular-khakhra",
      displayOrder: 2,
    },
    {
      name: "Falahari Khakhra",
      slug: "falahari-khakhra",
      displayOrder: 3,
    },
    {
      name: "Falahari Special",
      slug: "falahari-special",
      displayOrder: 4,
    },
    {
      name: "Gujarati Farsan",
      slug: "gujarati-farsan",
      displayOrder: 5,
    },
    {
      name: "Bikaneri Special",
      slug: "bikaneri-special",
      displayOrder: 6,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        displayOrder: category.displayOrder,
      },
      create: category,
    });
  }

  console.log("Categories seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });