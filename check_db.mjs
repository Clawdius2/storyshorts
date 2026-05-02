import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VzpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});

try {
  const books = await prisma.book.findMany({ 
    select: { id: true, title: true, coverImageKey: true, audioKey: true, isFree: true } 
  });
  console.log('Books in DB:', JSON.stringify(books, null, 2));
} finally {
  await prisma.$disconnect();
}
