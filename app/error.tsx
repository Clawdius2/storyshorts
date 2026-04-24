"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pageWrap">
      <div className="emptyState">
        <h2>Something broke.</h2>
        <p>{error.message || "The page could not be loaded."}</p>
        <button type="button" className="buttonPrimary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
