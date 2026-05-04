import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd@roundhouse.proxy.rlwy.net:52118/railway'
});

const updates = [
  { id: 'free-gift-of-the-magi',      audioKey: 'books/17257/audio/O._Henry.The_Gift_of_the_Magi.mp3',       status: 'ready' },
  { id: 'free-the-last-question',     audioKey: 'books/47875/audio/Isaac_Asimov.The_Last_Question.mp3',      status: 'ready' },
  { id: 'free-the-monkeys-paw',       audioKey: 'books/62129/audio/W.W._Jacobs.The_Monkeys_Paw.mp3',         status: 'ready' },
  { id: 'free-the-necklace',          audioKey: 'books/19555/audio/Guy_de_Maupassant.The_Necklace.mp3',      status: 'ready' },
  { id: 'free-tell-tale-heart',       audioKey: 'books/2148/audio/Edgar_Allan_Poe.The_Tell-Tale_Heart.mp3',  status: 'ready' },
  { id: 'premium-the-yellow-wallpaper', audioKey: 'books/1952/audio/Charlotte_Perkins_Gilman.The_Yellow_Wallpaper.mp3', status: 'ready' },
  { id: 'premium-the-open-window',    audioKey: 'books/38369/audio/Saki.The_Open_Window.mp3',                 status: 'ready' },
  { id: 'premium-the-machine-stops',  audioKey: 'books/47394/audio/Silas_Vale.The_Machine_Stops.mp3',        status: 'ready' },
  // These two still missing audio — keep as pending
  // { id: 'premium-occurrence-at-owl-creek', audioKey: 'books/33127/audio/...', status: 'pending' }
  // { id: 'premium-legend-of-sleepy-hollow', audioKey: 'books/41/audio/...', status: 'pending' }
];

for (const u of updates) {
  const book = await prisma.book.update({
    where: { id: u.id },
    data: { audioKey: u.audioKey, status: u.status }
  });
  console.log(`${u.id}: ${book.audioKey.split('/').pop()} → ${book.status}`);
}

await prisma.$disconnect();
