import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getAppUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/subscriptions";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [clerkUser, appUser] = await Promise.all([currentUser(), getOrCreateUser(userId)]);
  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId: appUser.id },
  });

  if (existingSubscription?.status === "active" || existingSubscription?.status === "trialing") {
    return NextResponse.json({ checkoutUrl: `${getAppUrl()}/subscribe/success` });
  }

  const emailAddress = clerkUser?.emailAddresses[0]?.emailAddress;
  let customerId = existingSubscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: emailAddress,
      metadata: {
        clerkUserId: userId,
      },
      name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || undefined,
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    allow_promotion_codes: true,
    success_url: `${getAppUrl()}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/subscribe/cancel`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: {
            name: "StoryShorts Membership",
            description: "Unlimited streaming of the full StoryShorts catalog.",
          },
          recurring: {
            interval: "month",
          },
          unit_amount: 795,
        },
      },
    ],
    metadata: {
      clerkUserId: userId,
      appUserId: appUser.id,
    },
    subscription_data: {
      metadata: {
        clerkUserId: userId,
        appUserId: appUser.id,
      },
    },
  });

  return NextResponse.json({
    checkoutUrl: session.url,
    sessionId: session.id,
  });
}
