
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:aLBxNrJHRoiBIPvqWuvy@roundhouse.proxy.rlwy.net:52118/railway'
});
const books = await prisma.book.findMany({ where: { title: { contains: 'Open Window' } } });
const output = JSON.stringify(books, null, 2);
console.log(output);
await prisma.$disconnect();
