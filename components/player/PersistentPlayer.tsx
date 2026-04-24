"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { formatClock } from "@/lib/format";
import { usePlayer } from "./PlayerProvider";
import styles from "./PersistentPlayer.module.css";

export function PersistentPlayer() {
  const { userId } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSyncedProgressRef = useRef(0);
  const {
    activeBook,
    closePlayer,
    currentTime,
    duration,
    error,
    getLocalProgress,
    isHydrated,
    isPlaying,
    requestedStartTime,
    seek,
    setDuration,
    setError,
    setIsPlaying,
    setPlaybackTime,
    setRequestedStartTime,
    setShouldAutoplay,
    shouldAutoplay,
  } = usePlayer();

  async function syncProgress(seconds: number) {
    if (!activeBook || !userId) {
      return;
    }

    if (Math.abs(seconds - lastSyncedProgressRef.current) < 10 && seconds !== 0) {
      return;
    }

    lastSyncedProgressRef.current = seconds;

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: activeBook.id,
          progressSeconds: seconds,
        }),
      });
    } catch {
      // Keep local progress even if sync fails.
    }
  }

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !activeBook) {
      return;
    }

    audio.currentTime = Math.max(requestedStartTime, getLocalProgress(activeBook.id));
    setPlaybackTime(audio.currentTime);
  }, [activeBook, getLocalProgress, requestedStartTime, setPlaybackTime]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !activeBook) {
      return;
    }

    if (shouldAutoplay) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setShouldAutoplay(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setShouldAutoplay(false);
          setError("Tap play to begin playback.");
        });
    }
  }, [activeBook, setError, setIsPlaying, setShouldAutoplay, shouldAutoplay]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      void syncProgress(currentTime);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentTime]);

  if (!isHydrated || !activeBook) {
    return null;
  }

  const safeDuration = duration || activeBook.durationSeconds;

  return (
    <aside className={styles.player}>
      <audio
        key={activeBook.id}
        ref={audioRef}
        preload="metadata"
        src={activeBook.audioUrl}
        onEnded={() => {
          setIsPlaying(false);
          setPlaybackTime(0);
          void syncProgress(0);
        }}
        onError={() => {
          setError("Audio is not available yet for this title.");
          setIsPlaying(false);
        }}
        onLoadedMetadata={() => {
          const audio = audioRef.current;

          if (!audio) {
            return;
          }

          const nextDuration = Number.isFinite(audio.duration) ? audio.duration : activeBook.durationSeconds;
          setDuration(nextDuration);

          if (requestedStartTime > 0) {
            audio.currentTime = requestedStartTime;
            setRequestedStartTime(0);
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          void syncProgress(Math.floor(audioRef.current?.currentTime ?? currentTime));
        }}
        onPlay={() => {
          setIsPlaying(true);
          setError(null);
        }}
        onTimeUpdate={() => {
          const nextTime = Math.floor(audioRef.current?.currentTime ?? 0);
          setPlaybackTime(nextTime);
          void syncProgress(nextTime);
        }}
      />
      <div className={styles.inner}>
        <div className={styles.summary}>
          <div>
            <strong>{activeBook.title}</strong>
            <p>
              {activeBook.author} · {activeBook.narrator}
            </p>
          </div>
          <div className={styles.times}>
            <span>{formatClock(currentTime)}</span>
            <span>{formatClock(safeDuration)}</span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(1, safeDuration)}
          value={Math.min(currentTime, safeDuration)}
          className={styles.scrubber}
          onChange={(event) => {
            const nextTime = Number(event.target.value);
            seek(nextTime);
            if (audioRef.current) {
              audioRef.current.currentTime = nextTime;
            }
            void syncProgress(nextTime);
          }}
        />

        <div className={styles.controls}>
          <button
            type="button"
            className="buttonPrimary"
            onClick={() => {
              const audio = audioRef.current;

              if (!audio) {
                return;
              }

              if (isPlaying) {
                audio.pause();
                return;
              }

              void audio.play().catch(() => {
                setError("Playback requires a user interaction on this device.");
              });
            }}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <Link href={`/player?bookId=${activeBook.id}`} className="buttonSecondary">
            Full player
          </Link>
          <button type="button" className="buttonGhost" onClick={closePlayer}>
            Close
          </button>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </aside>
  );
}
