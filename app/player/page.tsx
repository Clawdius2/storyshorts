import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { AudioPlayer } from "@/components/AudioPlayer";
import type { PlayerBook } from "@/components/player/PlayerProvider";
import { buildAudioUrl, buildCoverUrl } from "@/lib/audio";
import { getBookById } from "@/lib/books";
import { getBookProgress } from "@/lib/progress";
import { hasActiveSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string }>;
}) {
  const [{ bookId }, { userId }] = await Promise.all([searchParams, auth()]);

  if (!bookId) {
    return <AudioPlayer book={null} />;
  }

  const book = await getBookById(bookId);

  if (!book) {
    notFound();
  }

  const subscribed = await hasActiveSubscription(userId);

  if (!book.isFree && !subscribed) {
    redirect(`/book/${book.id}`);
  }

  const progress = userId ? await getBookProgress(userId, book.id) : null;
  const playerBook: PlayerBook = {
    id: book.id,
    title: book.title,
    author: book.author,
    narrator: book.narrator,
    genre: book.genre,
    durationSeconds: book.durationSeconds,
    coverImageUrl: buildCoverUrl(book.coverImageKey),
    audioUrl: buildAudioUrl(book.audioKey),
    isFree: book.isFree,
    progressSeconds: progress?.progressSeconds ?? 0,
  };

  return <AudioPlayer book={playerBook} />;
}
