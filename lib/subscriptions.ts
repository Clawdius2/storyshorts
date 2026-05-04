import "server-only";
import { prisma } from "@/lib/prisma";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export async function getUserByClerkId(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkUserId },
    include: { subscription: true },
  });
}

export async function getOrCreateUser(clerkUserId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: { clerkUserId },
  });
}

// TODO (restore payment): Set NEXT_PUBLIC_PAYWALL_ENABLED=disabled in Vercel project settings
// then delete this early-return and restore the DB lookup below.
export async function hasActiveSubscription(clerkUserId: string | null) {
  // Paywall DISABLED for testing — all books unlocked
  return true;

  /* — restore from here —
  if (!clerkUserId) {
    return false;
  }

  const user = await getUserByClerkId(clerkUserId);

  if (!user?.subscription) {
    return false;
  }

  return ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscription.status);
  — restore to here — */
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string) {
  return prisma.subscription.findUnique({
    where: { stripeCustomerId },
  });
}
