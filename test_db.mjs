import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VzpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:35500/railway'
});

try {
  const books = await prisma.book.findMany({ take: 2 });
  console.log('✅ DB connected! Books found:', books.length);
  books.forEach(b => console.log(' -', b.title));
} catch (err) {
  console.error('❌ DB connection failed:', err.message);
} finally {
  await prisma.$disconnect();
}
