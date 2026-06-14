import Stripe from "stripe";

// Shared Stripe client singleton (test mode keys in dev — see .env.example).
// Used by the real payments provider, the Connect onboarding route, and the
// webhook handler. Throws lazily (only when actually used) so the app still
// boots with PAYMENTS_PROVIDER="mock" and no key configured.
const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export function getStripe(): Stripe {
  if (globalForStripe.stripe) return globalForStripe.stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env to use PAYMENTS_PROVIDER=\"stripe\".",
    );
  }
  const stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  if (process.env.NODE_ENV !== "production") {
    globalForStripe.stripe = stripe;
  }
  return stripe;
}

export const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
