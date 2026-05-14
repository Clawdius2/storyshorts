import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
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
        <div className={styles.priceTag}>
          {book.isFree ? (
            <span className="badge badgeFree">Free</span>
          ) : (
            <span className="badge badgePrice">$0.99</span>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <p className="eyebrow">{book.genre}</p>
        <h1>{book.title}</h1>
        <p className={styles.byline}>
          {book.author} · Narrated by {book.narrator}
        </p>
        <div className={styles.tagRow}>
          {splitGenres(book.genre).map((g) => (
            <Link key={g} href={`/catalog?genre=${encodeURIComponent(g)}`} className="genreChip">
              {g}
            </Link>
          ))}
          <span className={styles.duration}>{formatDuration(book.durationSeconds)}</span>
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
            <strong>Want to unlock this title?</strong>
            <p>
              Browse the catalog, pick your stories, and listen for $0.99 each. No subscription
              required.
            </p>
            <Link href="/catalog" className="buttonSecondary">
              Browse catalog
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}