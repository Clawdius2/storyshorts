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
      <section className={styles.card}>
        <p className="eyebrow">Membership</p>
        <h1>Unlock the full StoryShorts catalog for $7.95/month.</h1>
        <p className={styles.copy}>
          Unlimited streaming, persistent resume points, and immediate access to every premium
          story in the library.
        </p>
        <div className={styles.benefits}>
          <div>
            <strong>Full-catalog streaming</strong>
            <p>Listen to every premium title from any device.</p>
          </div>
          <div>
            <strong>Saved progress</strong>
            <p>Resume exactly where you stopped across sessions.</p>
          </div>
          <div>
            <strong>Free shelf included</strong>
            <p>Five stories remain open to everyone, anytime.</p>
          </div>
        </div>
        <div className={styles.actions}>
          {subscribed ? (
            <Link href="/catalog" className="buttonPrimary">
              You already have access
            </Link>
          ) : userId ? (
            <SubscribeButton />
          ) : (
            <Link href="/sign-in" className="buttonPrimary">
              Sign in to subscribe
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
