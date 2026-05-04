import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});
const books = await prisma.book.findMany({ where: { gutenbergId: "41" } });
console.log('Sleepy Hollow in DB:', JSON.stringify(books, null, 2));
await prisma.$disconnect();
