import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});

const deleted = await prisma.book.delete({
  where: { id: 'premium-a-sound-of-thunder' }
});
console.log('Deleted:', deleted.title, '| ID:', deleted.id);
await prisma.$disconnect();
