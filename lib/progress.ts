import "server-only";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/subscriptions";

export async function getBookProgress(clerkUserId: string | null, bookId: string) {
  if (!clerkUserId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    return null;
  }

  return prisma.listeningProgress.findUnique({
    where: {
      userId_bookId: {
        userId: user.id,
        bookId,
      },
    },
  });
}

export async function saveBookProgress(input: {
  clerkUserId: string;
  bookId: string;
  progressSeconds: number;
}) {
  const user = await getOrCreateUser(input.clerkUserId);

  return prisma.listeningProgress.upsert({
    where: {
      userId_bookId: {
        userId: user.id,
        bookId: input.bookId,
      },
    },
    update: {
      progressSeconds: input.progressSeconds,
    },
    create: {
      userId: user.id,
      bookId: input.bookId,
      progressSeconds: input.progressSeconds,
    },
  });
}
