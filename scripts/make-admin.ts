import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/make-admin.ts you@email.com");
  process.exit(1);
}

try {
  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { role: "ADMIN" },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log("Updated to ADMIN:", user);
} catch {
  console.error("No user found with that email. Sign up first, then run this again.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
