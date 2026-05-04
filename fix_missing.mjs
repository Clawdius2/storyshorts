import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});

// Fix Owl Creek Bridge audioKey (actual file is at books/375/, not 33127)
const owl = await prisma.book.update({
  where: { id: 'premium-occurrence-at-owl-creek' },
  data: { audioKey: 'books/375/audio/Ambrose_Bierce.An_Occurrence_at_Owl_Creek_Bridge.mp3' }
});
console.log('Owl Creek:', owl.audioKey);

// Fix Sleepy Hollow audioKey (correct path, just mark pending)
const hollow = await prisma.book.update({
  where: { id: 'premium-legend-of-sleepy-hollow' },
  data: { audioKey: 'books/41/audio/Washington_Irving.The_Legend_of_Sleepy_Hollow.mp3' }
});
console.log('Sleepy Hollow:', hollow.audioKey);

await prisma.$disconnect();
