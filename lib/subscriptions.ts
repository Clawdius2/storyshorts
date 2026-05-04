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

// TODO (restore payment): Remove NEXT_PUBLIC_PAYWALL_ENABLED check and restore DB lookup
export async function hasActiveSubscription(clerkUserId: string | null) {
  // Paywall disabled for testing — always return true
  if (process.env.NEXT_PUBLIC_PAYWALL_ENABLED !== "true") {
    return true;
  }

  if (!clerkUserId) {
    return false;
  }

  const user = await getUserByClerkId(clerkUserId);

  if (!user?.subscription) {
    return false;
  }

  return ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscription.status);
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string) {
  return prisma.subscription.findUnique({
    where: { stripeCustomerId },
  });
}
