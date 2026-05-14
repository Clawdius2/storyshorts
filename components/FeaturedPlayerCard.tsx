"use client";

import Link from "next/link";
import type { Book } from "@prisma/client";
import { buildCoverUrl } from "@/lib/audio";
import { formatDuration } from "@/lib/format";
import styles from "./FeaturedPlayerCard.module.css";

type FeaturedPlayerCardProps = {
  book: Book;
};

export function FeaturedPlayerCard({ book }: FeaturedPlayerCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cover}>
        {book.coverImageKey ? (
          <img
            src={buildCoverUrl(book.coverImageKey)}
            alt={`Cover for ${book.title}`}
            className={styles.coverImg}
          />
        ) : (
          <div className={styles.coverFallback}>
            <span>{book.title.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
        <div className={styles.coverOverlay} />
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.genre}>{book.genre}</span>
          <span className={styles.duration}>{formatDuration(book.durationSeconds)}</span>
        </div>
        <h3 className={styles.title}>{book.title}</h3>
        <p className={styles.author}>{book.author}</p>
        <p className={styles.narrator}>Narrated by {book.narrator}</p>

        <div className={styles.actions}>
          <Link href={`/book/${book.id}`} className="buttonPrimary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Listen now
          </Link>
          <span className="badge badgePrice">$0.99</span>
        </div>
      </div>
    </div>
  );
}