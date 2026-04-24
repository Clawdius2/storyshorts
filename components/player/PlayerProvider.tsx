"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const PLAYER_STORAGE_KEY = "storyshorts-player-state";
const PROGRESS_STORAGE_KEY = "storyshorts-player-progress";

export type PlayerBook = {
  id: string;
  title: string;
  author: string;
  narrator: string;
  genre: string;
  durationSeconds: number;
  coverImageUrl: string;
  audioUrl: string;
  isFree: boolean;
  progressSeconds: number;
};

type LoadBookOptions = {
  autoplay?: boolean;
  startAt?: number;
};

type StoredPlayerState = {
  activeBook: PlayerBook | null;
  currentTime: number;
};

type PlayerContextValue = {
  activeBook: PlayerBook | null;
  currentTime: number;
  duration: number;
  error: string | null;
  isHydrated: boolean;
  isPlaying: boolean;
  requestedStartTime: number;
  shouldAutoplay: boolean;
  closePlayer: () => void;
  getLocalProgress: (bookId: string) => number;
  loadBook: (book: PlayerBook, options?: LoadBookOptions) => void;
  seek: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setError: (message: string | null) => void;
  setIsPlaying: (value: boolean) => void;
  setPlaybackTime: (seconds: number) => void;
  setRequestedStartTime: (seconds: number) => void;
  setShouldAutoplay: (value: boolean) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function readStoredProgress() {
  if (typeof window === "undefined") {
    return {} as Record<string, number>;
  }

  try {
    const value = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    return value ? (JSON.parse(value) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeStoredProgress(progressMap: Record<string, number>) {
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
}

function writeStoredPlayerState(state: StoredPlayerState) {
  window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(state));
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeBook, setActiveBook] = useState<PlayerBook | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestedStartTime, setRequestedStartTime] = useState(0);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(PLAYER_STORAGE_KEY);

      if (storedValue) {
        const parsed = JSON.parse(storedValue) as StoredPlayerState;
        setActiveBook(parsed.activeBook);
        setCurrentTime(parsed.currentTime ?? 0);
        setRequestedStartTime(parsed.currentTime ?? parsed.activeBook?.progressSeconds ?? 0);
        setDuration(parsed.activeBook?.durationSeconds ?? 0);
      }
    } catch {
      window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    writeStoredPlayerState({
      activeBook,
      currentTime,
    });
  }, [activeBook, currentTime, isHydrated]);

  const getLocalProgress = useCallback((bookId: string) => {
    return readStoredProgress()[bookId] ?? 0;
  }, []);

  const loadBook = useCallback((book: PlayerBook, options?: LoadBookOptions) => {
    const localProgress = getLocalProgress(book.id);
    const startAt = Math.max(options?.startAt ?? book.progressSeconds ?? 0, localProgress);

    setActiveBook(book);
    setCurrentTime(startAt);
    setDuration(book.durationSeconds);
    setRequestedStartTime(startAt);
    setShouldAutoplay(options?.autoplay ?? true);
    setError(null);
  }, [getLocalProgress]);

  const setPlaybackTime = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    setCurrentTime(safeSeconds);
    setActiveBook((currentBook) => {
      if (currentBook) {
        writeStoredProgress({
          ...readStoredProgress(),
          [currentBook.id]: safeSeconds,
        });
      }
      return currentBook;
    });
  }, []);

  const seek = useCallback((seconds: number) => {
    setCurrentTime(Math.max(0, Math.floor(seconds)));
  }, []);

  const closePlayer = useCallback(() => {
    setActiveBook(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setShouldAutoplay(false);
    setRequestedStartTime(0);
    setError(null);
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      activeBook,
      closePlayer,
      currentTime,
      duration,
      error,
      getLocalProgress,
      isHydrated,
      isPlaying,
      loadBook,
      requestedStartTime,
      seek,
      setDuration,
      setError,
      setIsPlaying,
      setPlaybackTime,
      setRequestedStartTime,
      setShouldAutoplay,
      shouldAutoplay,
    }),
    [
      activeBook,
      closePlayer,
      currentTime,
      duration,
      error,
      getLocalProgress,
      isHydrated,
      isPlaying,
      loadBook,
      requestedStartTime,
      seek,
      setPlaybackTime,
      shouldAutoplay,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }

  return context;
}
