import { PrismaClient } from "@prisma/client";
import { seedBooks } from "../lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  // Delete all existing books so updated genres/descriptions are applied on re-seed
  await prisma.book.deleteMany();
  await prisma.book.createMany({
    data: seedBooks,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
