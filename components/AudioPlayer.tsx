"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CoverArt } from "@/components/CoverArt";
import { formatClock, formatDuration, splitGenres } from "@/lib/format";
import { usePlayer, type PlayerBook } from "@/components/player/PlayerProvider";
import styles from "./AudioPlayer.module.css";

export function AudioPlayer({ book }: { book: PlayerBook | null }) {
  const { activeBook, currentTime, duration, error, isHydrated, isPlaying, loadBook } = usePlayer();

  useEffect(() => {
    if (!book) {
      return;
    }

    if (activeBook?.id !== book.id) {
      loadBook(book, {
        autoplay: true,
        startAt: book.progressSeconds,
      });
    }
  }, [activeBook?.id, book, loadBook]);

  const displayBook = book || activeBook;

  if (!isHydrated && !displayBook) {
    return null;
  }

  if (!displayBook) {
    return (
      <div className={styles.empty}>
        <h2>No story loaded</h2>
        <p>Select any title from the catalog or free shelf to start listening.</p>
        <Link href="/catalog" className="buttonPrimary">
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <section className={styles.shell}>
      <div className={styles.cover}>
        <CoverArt
          alt={`Cover for ${displayBook.title}`}
          src={displayBook.coverImageUrl}
          title={displayBook.title}
        />
      </div>
      <div className={styles.body}>
        <p className="eyebrow">{displayBook.isFree ? "Free shelf" : "Subscriber title"}</p>
        <h1>{displayBook.title}</h1>
        <p className={styles.byline}>
          {displayBook.author} · Narrated by {displayBook.narrator}
        </p>
        <div className={styles.tagRow}>
          {splitGenres(displayBook.genre).map((genre) => (
            <span key={genre}>{genre}</span>
          ))}
          <span>{formatDuration(displayBook.durationSeconds)}</span>
        </div>
        <div className={styles.panel}>
          <div className={styles.statusRow}>
            <strong>{isPlaying ? "Now playing" : "Paused"}</strong>
            <span>
              {formatClock(currentTime)} / {formatClock(duration || displayBook.durationSeconds)}
            </span>
          </div>
          <p className={styles.note}>
            Use the persistent player docked at the bottom to play, pause, and scrub.
          </p>
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
        <div className={styles.actions}>
          <Link href={`/book/${displayBook.id}`} className="buttonSecondary">
            View details
          </Link>
        </div>
      </div>
    </section>
  );
}
