import "dotenv/config";
import pg from "pg";

const TABLES = [
  "User",
  "Category",
  "Video",
  "Coupon",
  "Address",
  "Product",
  "Cart",
  "CartItem",
  "Inquiry",
  "Order",
  "OrderItem",
  "Payment",
] as const;

const cleanUrl = (raw: string) => {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  url.searchParams.set("sslmode", "require");
  return url.toString();
};

const pool = (raw: string) =>
  new pg.Pool({
    connectionString: cleanUrl(raw),
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 20_000,
  });

const quoteIdent = (name: string) => `"${name.replaceAll('"', '""')}"`;

async function copyTable(source: pg.Pool, dest: pg.Pool, table: string) {
  const { rows } = await source.query(`SELECT * FROM ${quoteIdent(table)}`);
  if (rows.length === 0) {
    console.log(`${table}: 0 rows`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const colSql = columns.map(quoteIdent).join(", ");

  for (const row of rows) {
    const values = columns.map((column) => row[column]);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    await dest.query(
      `INSERT INTO ${quoteIdent(table)} (${colSql}) VALUES (${placeholders})`,
      values
    );
  }

  await dest.query(
    `SELECT setval(pg_get_serial_sequence('${quoteIdent(table)}', 'id'), COALESCE((SELECT MAX(id) FROM ${quoteIdent(table)}), 1))`
  );

  console.log(`${table}: ${rows.length} rows`);
}

async function main() {
  const oldUrl = process.env.OLD_DATABASE_URL;
  const newUrl =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL;

  if (!oldUrl || !newUrl) {
    throw new Error("OLD_DATABASE_URL and DIRECT_URL/DATABASE_URL are required");
  }

  const source = pool(oldUrl);
  const dest = pool(newUrl);

  try {
    await dest.query("SELECT 1");
    await dest.query(
      `TRUNCATE ${["User", "Category", "Video", "Coupon"].map(quoteIdent).join(", ")} RESTART IDENTITY CASCADE`
    );

    for (const table of TABLES) {
      await copyTable(source, dest, table);
    }

    console.log("Copy complete");
  } finally {
    await source.end();
    await dest.end();
  }
}

main().catch((error) => {
  console.error("Copy failed:", error);
  process.exitCode = 1;
});
