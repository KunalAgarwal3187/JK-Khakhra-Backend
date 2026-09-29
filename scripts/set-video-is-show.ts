import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const videos = await prisma.video.findMany({
    orderBy: { displayOrder: "asc" },
    take: 6,
  });

  for (const v of videos) {
    await prisma.video.update({
      where: { id: v.id },
      data: { isShow: true },
    });
  }

  console.log(`Set isShow=true for ${videos.length} videos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
