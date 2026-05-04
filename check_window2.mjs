import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});
const books = await prisma.book.findMany({ where: { title: { contains: 'Open Window' } } });
console.log('Open Window books:', JSON.stringify(books, null, 2));
await prisma.$disconnect();
