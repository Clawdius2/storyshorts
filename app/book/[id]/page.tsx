import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { CoverArt } from "@/components/CoverArt";
import { StreamButton } from "@/components/StreamButton";
import { buildCoverUrl } from "@/lib/audio";
import { getBookById } from "@/lib/books";
import { getBookProgress } from "@/lib/progress";
import { formatDuration, splitGenres } from "@/lib/format";
import { hasActiveSubscription } from "@/lib/subscriptions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { userId }] = await Promise.all([params, auth()]);
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  const [subscribed, progress] = await Promise.all([
    hasActiveSubscription(userId),
    getBookProgress(userId, book.id),
  ]);

  const canAccess = book.isFree || subscribed;

  return (
    <article className={styles.page}>
      <div className={styles.coverColumn}>
        <CoverArt
          alt={`Cover for ${book.title}`}
          src={buildCoverUrl(book.coverImageKey)}
          title={book.title}
        />
      </div>

      <div className={styles.body}>
        <p className="eyebrow">{book.isFree ? "Free shelf" : "Catalog title"}</p>
        <h1>{book.title}</h1>
        <p className={styles.byline}>
          {book.author} · Narrated by {book.narrator}
        </p>
        <div className={styles.tagRow}>
          {splitGenres(book.genre).map((genre) => (
            <span key={genre}>{genre}</span>
          ))}
          <span>{formatDuration(book.durationSeconds)}</span>
        </div>
        <p className={styles.synopsis}>{book.description}</p>
        <div className={styles.actions}>
          <StreamButton
            bookId={book.id}
            canAccess={canAccess}
            progressSeconds={progress?.progressSeconds ?? 0}
          />
        </div>

        {!canAccess ? (
          <div className={styles.lockedCard}>
            <strong>Unlock the full catalog</strong>
            <p>
              Membership gives you unlimited streaming, persistent resume points, and access to
              every premium StoryShorts title.
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
