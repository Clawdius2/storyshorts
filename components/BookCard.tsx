import Link from "next/link";
import type { Book } from "@prisma/client";
import { buildCoverUrl } from "@/lib/audio";
import { formatDuration } from "@/lib/format";
import { CoverArt } from "@/components/CoverArt";
import styles from "./BookCard.module.css";

type BookCardProps = {
  book: Book;
  hasSubscription: boolean;
};

export function BookCard({ book, hasSubscription }: BookCardProps) {
  const canAccess = book.isFree || hasSubscription;

  return (
    <article className={styles.card}>
      <Link href={`/book/${book.id}`} className={styles.coverLink}>
        <CoverArt
          alt={`Cover for ${book.title}`}
          src={buildCoverUrl(book.coverImageKey)}
          title={book.title}
        />
      </Link>
      <div className={styles.body}>
        <div className={styles.metaRow}>
          <span className={styles.genre}>{book.genre}</span>
          <span className={styles.duration}>{formatDuration(book.durationSeconds)}</span>
        </div>
        <div className={styles.copy}>
          <h3>
            <Link href={`/book/${book.id}`}>{book.title}</Link>
          </h3>
          <p className={styles.byline}>
            {book.author} · {book.narrator}
          </p>
          <p className={styles.description}>{book.description}</p>
        </div>
        <div className={styles.footer}>
          {book.isFree ? (
            <span className="badge badgeFree">Free</span>
          ) : (
            <span className="badge badgePrice">$0.99</span>
          )}
          <Link href={`/book/${book.id}`} className="buttonSecondary">
            {canAccess ? "Listen" : "Unlock"}
          </Link>
        </div>
      </div>
    </article>
  );
}