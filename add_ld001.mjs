import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const book = await prisma.book.create({
    data: {
      gutenbergId: 'LD001',
      title: 'The Loaded Dog',
      author: 'Henry Lawson',
      narrator: 'Jack Breaker Sullivan',
      genre: 'Short Story',
      audioUrl: 'https://audio-streamer.gusf.workers.dev/books/LD001/audio/jack_breaker_sullivan.the_loaded_dog.mp3',
      status: 'pending'
    }
  });
  console.log('Created:', book.id, book.gutenbergId, book.title);
}

main().finally(() => prisma.$disconnect());
