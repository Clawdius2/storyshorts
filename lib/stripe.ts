import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/subscriptions";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

function getCurrentPeriodEnd(timestamp: number | null | undefined) {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000);
}

export async function syncSubscriptionFromStripe(stripeSubscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const existingBySubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  const existingByCustomer = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  let userId = existingBySubscription?.userId || existingByCustomer?.userId || null;

  if (!userId) {
    const clerkUserId = subscription.metadata.clerkUserId;

    if (!clerkUserId) {
      return null;
    }

    const user = await getOrCreateUser(clerkUserId);
    userId = user.id;
  }

  return prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: getCurrentPeriodEnd(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (subscription as unknown as Record<string, unknown>).current_period_end as number | null,
      ),
    },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: getCurrentPeriodEnd(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (subscription as unknown as Record<string, unknown>).current_period_end as number | null,
      ),
    },
  });
}
