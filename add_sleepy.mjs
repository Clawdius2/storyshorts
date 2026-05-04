import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});
const book = await prisma.book.create({
  data: {
    id: 'premium-legend-of-sleepy-hollow',
    gutenbergId: '41',
    title: 'The Legend of Sleepy Hollow',
    author: 'Washington Irving',
    narrator: 'Silas Vale',
    genre: 'Gothic Horror',
    description: 'A superstitious schoolmaster in a secluded Dutch settlement encounters a legendary headless horseman on a desolate road near the old Dutch churchyard.',
    durationSeconds: 5400,
    coverImageKey: 'books/41/audio/cover.jpg',
    audioKey: 'books/41/audio/Washington_Irving.The_Legend_of_Sleepy_Hollow.mp3',
    isFree: false,
    status: 'pending'
  }
});
console.log('Created:', book.title, '|', book.narrator, '|', book.status);
await prisma.$disconnect();
