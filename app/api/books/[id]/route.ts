import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildAudioUrl, buildCoverUrl } from "@/lib/audio";
import { getBookById } from "@/lib/books";
import { splitGenres } from "@/lib/format";
import { getBookProgress } from "@/lib/progress";
import { hasActiveSubscription } from "@/lib/subscriptions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, { userId }] = await Promise.all([params, auth()]);
  const book = await getBookById(id);

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const subscribed = await hasActiveSubscription(userId);
  const canAccess = book.isFree || subscribed;
  const progress = userId ? await getBookProgress(userId, book.id) : null;

  return NextResponse.json({
    id: book.id,
    title: book.title,
    author: book.author,
    narrator: book.narrator,
    genre: book.genre,
    description: book.description,
    durationSeconds: book.durationSeconds,
    isFree: book.isFree,
    genres: splitGenres(book.genre),
    coverImageUrl: buildCoverUrl(book.coverImageKey),
    audioUrl: canAccess ? buildAudioUrl(book.audioKey) : null,
    canAccess,
    progressSeconds: progress?.progressSeconds ?? 0,
  });
}
