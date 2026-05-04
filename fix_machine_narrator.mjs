import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});
const updated = await prisma.book.update({
  where: { id: 'premium-the-machine-stops' },
  data: { narrator: 'Silas Vale' }
});
console.log('Updated:', updated.title, '->', updated.narrator);
await prisma.$disconnect();
