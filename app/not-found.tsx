import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pageWrap">
      <div className="emptyState">
        <h2>Page not found</h2>
        <p>The title or page you requested could not be found.</p>
        <Link href="/" className="buttonPrimary">
          Back home
        </Link>
      </div>
    </div>
  );
}
