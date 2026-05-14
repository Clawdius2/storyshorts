import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SubscribeButton } from "@/components/SubscribeButton";
import { hasActiveSubscription } from "@/lib/subscriptions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function SubscribePage() {
  const { userId } = await auth();
  const subscribed = await hasActiveSubscription(userId);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className="eyebrow">Pricing</p>
        <h1 className={styles.heading}>
          Great stories. <br />$0.99 at a time.
        </h1>
        <p className={styles.copy}>
          No subscription required. Pick a title, pay once, listen forever. Every story is
          premium-narrated and ready to stream instantly.
        </p>
      </section>

      <section className={styles.tiers}>
        <div className={styles.tier}>
          <div className={styles.tierHeader}>
            <strong>Free titles</strong>
            <span className={styles.tierPrice}>$0</span>
          </div>
          <p className={styles.tierDesc}>
            Start with classics from the public domain. No account, no credit card — just tap
            and listen.
          </p>
          <Link href="/catalog" className="buttonSecondary">
            Browse free titles
          </Link>
        </div>

        <div className={`${styles.tier} ${styles.tierHighlight}`}>
          <div className={styles.tierBadge}>Most popular</div>
          <div className={styles.tierHeader}>
            <strong>Premium titles</strong>
            <span className={styles.tierPrice}>$0.99</span>
          </div>
          <p className={styles.tierDesc}>
            Full access to the entire StoryShorts catalog. One-time purchase per title, yours
            to keep streaming.
          </p>
          {subscribed ? (
            <Link href="/catalog" className="buttonPrimary">
              You have access — browse catalog
            </Link>
          ) : userId ? (
            <SubscribeButton />
          ) : (
            <Link href="/sign-in?redirect_url=/subscribe" className="buttonPrimary">
              Sign in to purchase
            </Link>
          )}
        </div>
      </section>

      <section className={styles.note}>
        <p>
          All purchases are permanent. A subscription is not required to enjoy StoryShorts —
          browse the catalog, pick what speaks to you, and unlock it for less than a dollar.
        </p>
        <Link href="/catalog" className="buttonGhost">
          Browse the catalog
        </Link>
      </section>
    </div>
  );
}