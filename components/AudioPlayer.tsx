"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { CoverArt } from "@/components/CoverArt";
import { formatClock, formatDuration, splitGenres } from "@/lib/format";
import { usePlayer, type PlayerBook } from "@/components/player/PlayerProvider";
import styles from "./AudioPlayer.module.css";

export function AudioPlayer({ book }: { book: PlayerBook | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrubberRef = useRef<HTMLInputElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const { activeBook, loadBook, setPlaybackTime } = usePlayer();

  const displayBook = book || activeBook;

  // Load book into player context when visiting with a book
  useEffect(() => {
    if (!book) return;
    if (activeBook?.id !== book.id) {
      loadBook(book, { autoplay: false, startAt: book.progressSeconds });
    }
  }, [book, activeBook?.id, loadBook]);

  // Sync audio src when activeBook changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeBook) return;

    // Only update src if it changed
    if (audio.src !== activeBook.audioUrl) {
      audio.src = activeBook.audioUrl;
      audio.load();
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [activeBook]);

  // Set initial playback time from book progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !displayBook || displayBook.progressSeconds === 0) return;

    const handleLoadedMetadata = () => {
      if (audio.readyState >= 1 && displayBook.progressSeconds > 0) {
        audio.currentTime = displayBook.progressSeconds;
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [displayBook]);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
      setError(null);
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === "NotAllowedError" || e.name === "AbortError") {
        setError("Tap the play button again to start audio.");
      } else {
        setError("Audio playback failed. Please try again.");
      }
    }
  }, [isPlaying]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const nextTime = Number(e.target.value);
    setCurrentTime(nextTime);
    if (audio) audio.currentTime = nextTime;
  };

  const handleScrubEnd = () => {
    setIsSeeking(false);
  };

  const handleScrubStart = () => {
    setIsSeeking(true);
  };

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

  const safeDuration = duration || displayBook.durationSeconds;
  const progressPercent = safeDuration > 0 ? (Math.min(currentTime, safeDuration) / safeDuration) * 100 : 0;

  return (
    <section className={styles.shell}>
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (!audio) return;
          const d = Number.isFinite(audio.duration) ? audio.duration : displayBook.durationSeconds;
          setDuration(d);
        }}
        onTimeUpdate={() => {
          if (!isSeeking) {
            setCurrentTime(audioRef.current?.currentTime ?? 0);
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          setError(null);
        }}
        onPause={() => {
          setIsPlaying(false);
          if (audioRef.current) {
            setPlaybackTime(audioRef.current.currentTime);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          setPlaybackTime(0);
        }}
        onError={() => {
          setIsPlaying(false);
          setError("Audio is not available yet for this title.");
        }}
      />

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

        {/* Playback controls */}
        <div className={styles.playerControls}>
          <div className={styles.timeRow}>
            <span className={styles.time}>{formatClock(currentTime)}</span>
            <div className={styles.scrubberWrapper}>
              <div
                className={styles.scrubberFill}
                style={{ width: `${progressPercent}%` }}
              />
              <input
                ref={scrubberRef}
                type="range"
                min={0}
                max={Math.max(1, safeDuration)}
                value={Math.min(currentTime, safeDuration)}
                className={styles.scrubber}
                onChange={handleScrub}
                onMouseDown={handleScrubStart}
                onTouchStart={handleScrubStart}
                onMouseUp={handleScrubEnd}
                onTouchEnd={handleScrubEnd}
              />
            </div>
            <span className={styles.time}>{formatClock(safeDuration)}</span>
          </div>

          <button
            type="button"
            className={styles.playButton}
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

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
