import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

type StaticProduct = {
  name: string;
  desc: string;
  about: string;
  benefits: string[];
  nutrition: { label: string; value: string }[];
};

type StaticCatalogModule = {
  categories: { products: StaticProduct[] }[];
  resolveProduct: (product: StaticProduct) => StaticProduct;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..", "..", "JK Khakhra Showcase");
const staticCatalogPath = path.join(frontendRoot, "src", "data", "categories.ts");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function loadStaticCatalog(): Promise<StaticCatalogModule> {
  const result = await build({
    entryPoints: [staticCatalogPath],
    absWorkingDir: frontendRoot,
    bundle: true,
    format: "cjs",
    platform: "node",
    write: false,
    alias: { "@": path.join(frontendRoot, "src") },
    loader: {
      ".webp": "text",
      ".mp4": "text",
    },
  });

  const module = { exports: {} as StaticCatalogModule };
  const execute = new Function("module", "exports", result.outputFiles[0].text);
  execute(module, module.exports);
  return module.exports;
}

async function main() {
  const staticCatalog = await loadStaticCatalog();
  const products = staticCatalog.categories.flatMap((category) => category.products);

  for (const product of products) {
    const slug = slugify(product.name);
    const resolvedProduct = staticCatalog.resolveProduct(product);
    const result = await prisma.product.updateMany({
      where: { slug },
      data: {
        shortDescription: product.desc,
        description: resolvedProduct.about,
        benefits: resolvedProduct.benefits,
        nutrition: resolvedProduct.nutrition,
      },
    });

    if (result.count !== 1) {
      throw new Error(`Expected one product for ${slug}, updated ${result.count}`);
    }
  }

  console.log(`Updated content for ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error("Product content sync failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
