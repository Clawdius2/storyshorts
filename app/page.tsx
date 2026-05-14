import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { BookCard } from "@/components/BookCard";
import { FeaturedPlayerCard } from "@/components/FeaturedPlayerCard";
import { GenreRow } from "@/components/GenreRow";
import { ValueStrip } from "@/components/ValueStrip";
import { getFeaturedCatalogBooks, getFreeShelfBooks } from "@/lib/books";
import { hasActiveSubscription } from "@/lib/subscriptions";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId } = await auth();
  const [freeShelfBooks, featuredBooks, subscribed] = await Promise.all([
    getFreeShelfBooks(),
    getFeaturedCatalogBooks(),
    hasActiveSubscription(userId),
  ]);

  // Use the first featured book as the hero card
  const heroBook = featuredBooks[0] ?? null;
  // Remaining featured books for the grid
  const gridBooks = featuredBooks.slice(1, 7);

  return (
    <div className="pageWrap">
      {/* ─── Hero ─────────────────────────────────────── */}
      <section className={styles.hero}>
        {/* Left: copy + CTA */}
        <div className={styles.heroCopy}>
          <p className="eyebrow">Great stories. Anytime. Anywhere.</p>
          <h1 className={styles.heroHeading}>
            Cinematic audio fiction for the modern listener.
          </h1>
          <p className={styles.heroBody}>
            StoryShorts brings premium-narrated short stories to your ears — no subscription required
            for the free shelf, $0.99 per title for everyone else. Discover by genre, stream
            instantly, resume anywhere.
          </p>
          <div className={styles.heroActions}>
            <Link href="/catalog" className="buttonPrimary">
              Browse the catalog
            </Link>
            <Link href="/catalog?genre=Mystery" className="buttonGhost">
              Explore Mystery
            </Link>
          </div>

          {/* Feature icons */}
          <div className={styles.featureIcons}>
            <div className={styles.featureIcon}>
              <span>▶</span>
              <span>Instant streaming</span>
            </div>
            <div className={styles.featureIcon}>
              <span>✦</span>
              <span>Premium voices</span>
            </div>
            <div className={styles.featureIcon}>
              <span>★</span>
              <span>Resume anywhere</span>
            </div>
          </div>
        </div>

        {/* Right: featured player card */}
        {heroBook && <FeaturedPlayerCard book={heroBook} />}
      </section>

      {/* ─── Browse by Genre ───────────────────────────── */}
      <GenreRow />

      {/* ─── Free shelf ──────────────────────────────── */}
      {freeShelfBooks.length > 0 && (
        <section className={styles.section}>
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">Free titles</p>
              <h2>Start here — no account needed.</h2>
            </div>
            <Link href="/catalog?isFree=true" className="buttonGhost">
              View all free
            </Link>
          </div>
          <div className="grid3">
            {freeShelfBooks.map((book) => (
              <BookCard key={book.id} book={book} hasSubscription={subscribed} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Popular / featured row ───────────────────── */}
      {gridBooks.length > 0 && (
        <section className={styles.section}>
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">Featured</p>
              <h2>Popular titles to explore.</h2>
            </div>
            <Link href="/catalog" className="buttonGhost">
              Full catalog
            </Link>
          </div>
          <div className="grid3">
            {gridBooks.map((book) => (
              <BookCard key={book.id} book={book} hasSubscription={subscribed} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Value strip ──────────────────────────────── */}
      <ValueStrip />
    </div>
  );
}