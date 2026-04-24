import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { BookCard } from "@/components/BookCard";
import { FreeShelf } from "@/components/FreeShelf";
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

  return (
    <div className="pageWrap">
      <section className={styles.hero}>
        <div className={styles.heroCard}>
          <p className="eyebrow">Nocturnal fiction for one sitting</p>
          <h1>Short stories, premium narration, and a player built to resume instantly.</h1>
          <p className={styles.heroCopy}>
            StoryShorts is a modern listening library for people who want literary depth without
            committing to a twelve-hour audiobook. Start with the free shelf, then unlock the full
            catalog for $7.95 per month.
          </p>
          <div className={styles.heroActions}>
            <Link href="/catalog" className="buttonPrimary">
              Browse the catalog
            </Link>
            <Link href="/subscribe" className="buttonSecondary">
              View membership
            </Link>
          </div>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <span>Free stories</span>
            <strong>5 classics available without a subscription</strong>
          </div>
          <div className={styles.statCard}>
            <span>Persistent listening</span>
            <strong>Your progress follows you across sessions and devices</strong>
          </div>
          <div className={styles.statCard}>
            <span>Premium access</span>
            <strong>Unlimited full-catalog streaming for active members</strong>
          </div>
        </div>
      </section>

      <FreeShelf books={freeShelfBooks} hasSubscription={subscribed} />

      <section className={styles.previewSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">Catalog preview</p>
            <h2>Subscriber titles waiting beyond the free shelf.</h2>
          </div>
          <Link href="/catalog" className="buttonGhost">
            View full catalog
          </Link>
        </div>

        <div className={styles.grid}>
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} hasSubscription={subscribed} />
          ))}
        </div>
      </section>
    </div>
  );
}
