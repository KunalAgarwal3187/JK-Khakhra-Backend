import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/**
 * Long-lived Express: keep a shared pg.Pool (pass the Pool instance into PrismaPg).
 * If we only pass a config object, Prisma creates a pool per query and then
 * `end()`s it — every request pays a new TLS handshake to Neon (~2–3s from India).
 *
 * Vercel: use the pooled Neon URL. Local/dev: prefer the direct URL so the
 * session stays open.
 */
function connectionUrl() {
  const serverless = Boolean(process.env.VERCEL);
  const raw = serverless
    ? process.env.DATABASE_URL
    : process.env.DIRECT_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.DATABASE_URL;

  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = new URL(raw);
  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "::1" ||
    url.hostname === "127.0.0.1";
  const isNeon =
    url.hostname.includes("neon.tech") || url.hostname.includes("neon.build");

  if (isLocal) {
    url.hostname = "127.0.0.1";
  }

  url.searchParams.delete("channel_binding");
  url.searchParams.delete("sslmode");

  return { url, isLocal, isNeon, serverless };
}

function postgresConfig() {
  const { url, isLocal, isNeon, serverless } = connectionUrl();

  return {
    connectionString: url.toString(),
    ...(isLocal
      ? {
          host: "127.0.0.1",
          port: Number(url.port || 5432),
          user: decodeURIComponent(url.username),
          password: decodeURIComponent(url.password),
          database: url.pathname.replace(/^\//, "").split("?")[0],
        }
      : {}),
    ssl: isNeon ? { rejectUnauthorized: false } : undefined,
    keepAlive: true,
    max: serverless ? 1 : 5,
    idleTimeoutMillis: 5 * 60 * 1000,
    connectionTimeoutMillis: isNeon ? 15_000 : 3_000,
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: pg.Pool;
  prismaHost?: string;
};

function getPool() {
  const { url } = connectionUrl();
  const host = url.hostname;

  if (globalForPrisma.pool && globalForPrisma.prismaHost === host) {
    return globalForPrisma.pool;
  }

  if (globalForPrisma.pool) {
    void globalForPrisma.pool.end().catch(() => undefined);
  }

  const pool = new pg.Pool(postgresConfig());
  pool.on("error", (err) => {
    console.error("Postgres pool error:", err.message);
  });

  globalForPrisma.pool = pool;
  globalForPrisma.prismaHost = host;
  return pool;
}

const pool = getPool();
if (!(pool instanceof pg.Pool)) {
  throw new Error("pg.Pool instance check failed; check for duplicate pg packages");
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

globalForPrisma.prisma = prisma;

export const warmupDatabase = async () => {
  const started = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(
    `Prisma pool ready on ${globalForPrisma.prismaHost} (${Math.round(performance.now() - started)}ms)`
  );
};
