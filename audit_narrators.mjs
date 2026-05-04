import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});
const books = await prisma.book.findMany({
  select: { id: true, title: true, narrator: true, status: true },
  orderBy: { title: 'asc' }
});
console.log(JSON.stringify(books, null, 2));
await prisma.$disconnect();
