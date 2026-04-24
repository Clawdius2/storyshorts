export function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `~${minutes} min`;
}

export function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function splitGenres(genre: string) {
  return genre
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
}
