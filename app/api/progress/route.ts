import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBookById } from "@/lib/books";
import { getBookProgress, saveBookProgress } from "@/lib/progress";
import { hasActiveSubscription } from "@/lib/subscriptions";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) {
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  }

  const progress = await getBookProgress(userId, bookId);

  return NextResponse.json({
    progressSeconds: progress?.progressSeconds ?? 0,
    updatedAt: progress?.updatedAt ?? null,
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    bookId?: string;
    progressSeconds?: number;
  };

  if (!body.bookId || typeof body.progressSeconds !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const book = await getBookById(body.bookId);

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const allowed = book.isFree || (await hasActiveSubscription(userId));

  if (!allowed) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  await saveBookProgress({
    clerkUserId: userId,
    bookId: body.bookId,
    progressSeconds: Math.max(0, Math.floor(body.progressSeconds)),
  });

  return NextResponse.json({ ok: true });
}
