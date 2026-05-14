"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export function SubscribeButton() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
        sessionId?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Checkout could not be started.");
      }

      if (data.sessionId && stripePromise) {
        const stripe = await stripePromise;
        const result = await stripe?.redirectToCheckout({ sessionId: data.sessionId });

        if (result?.error?.message) {
          throw new Error(result.error.message);
        }
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      throw new Error("Stripe checkout session did not return a redirect.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Checkout failed.");
      setIsPending(false);
    }
  }

  return (
    <div>
      <button type="button" className="buttonPrimary" disabled={isPending} onClick={handleClick}>
        {isPending ? "Redirecting..." : "Browse the catalog"}
      </button>
      {error ? <p style={{ color: "#ffb4b4", marginTop: 12 }}>{error}</p> : null}
    </div>
  );
}