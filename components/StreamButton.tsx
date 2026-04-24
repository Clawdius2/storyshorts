import Link from "next/link";
import { formatClock } from "@/lib/format";

type StreamButtonProps = {
  bookId: string;
  canAccess: boolean;
  progressSeconds?: number;
};

export function StreamButton({ bookId, canAccess, progressSeconds = 0 }: StreamButtonProps) {
  if (!canAccess) {
    return (
      <Link href={`/subscribe?bookId=${bookId}`} className="buttonPrimary">
        Subscribe to unlock
      </Link>
    );
  }

  return (
    <Link href={`/player?bookId=${bookId}`} className="buttonPrimary">
      {progressSeconds > 0 ? `Resume at ${formatClock(progressSeconds)}` : "Start listening"}
    </Link>
  );
}
