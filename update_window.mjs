import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});

const book = await prisma.book.update({
  where: { id: 'premium-the-open-window' },
  data: {
    status: 'ready',
    byteSize: 7696365,
  }
});
console.log('Updated book:', JSON.stringify(book, null, 2));
await prisma.$disconnect();
