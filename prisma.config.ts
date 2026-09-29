import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/** Neon migrations need the direct (non-pooler) URL. Runtime uses DATABASE_URL. */
const migrateUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },

  datasource: {
    url: migrateUrl ?? env("DATABASE_URL"),
  },
});
