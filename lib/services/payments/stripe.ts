import type Stripe from "stripe";
import type {
  Balance,
  CreateSubscriptionInput,
  CreateTipInput,
  PaymentResult,
  PaymentsService,
} from "./types";
import { nowIso } from "../_util";
import { computeSplit, PLATFORM_FEE_RATE } from "@/lib/revenue";
import { prisma } from "@/lib/db";
import { getStripe, APP_BASE_URL } from "@/lib/stripe";

// Real Stripe Connect implementation.
//
// Unlike the mock, payments here are asynchronous: createSubscription/createTip
// create a Checkout Session and return its URL. The caller (API route) must
// redirect the browser there. The Subscription row + immutable LedgerEntry are
// written by the `checkout.session.completed` webhook (app/api/stripe/webhook),
// NOT here — so the ledger never records money that hasn't actually settled.
//
// Revenue split: AItube takes PLATFORM_FEE_RATE via Stripe Connect's
// application_fee mechanism (destination charge to the creator's Express
// account), so the split happens inside Stripe itself and matches
// lib/revenue.computeSplit exactly.

async function requireConnectedAccount(creatorId: string): Promise<string> {
  const creator = await prisma.creatorProfile.findUnique({
    where: { id: creatorId },
    select: { stripeAccountId: true, stripeOnboarded: true },
  });
  if (!creator?.stripeAccountId || !creator.stripeOnboarded) {
    throw new Error(
      "Creator has not completed Stripe Connect onboarding (POST /api/creators/connect).",
    );
  }
  return creator.stripeAccountId;
}

export const stripePayments: PaymentsService = {
  async createSubscription({ creatorId, subscriberId, priceCents }: CreateSubscriptionInput): Promise<PaymentResult> {
    const stripe = getStripe();
    const destinationAccountId = await requireConnectedAccount(creatorId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: priceCents,
            recurring: { interval: "month" },
            product_data: { name: "AItube creator subscription" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        application_fee_percent: Math.round(PLATFORM_FEE_RATE * 100 * 100) / 100,
        transfer_data: { destination: destinationAccountId },
        metadata: { creatorId, subscriberUserId: subscriberId },
      },
      metadata: {
        type: "subscription",
        creatorId,
        subscriberUserId: subscriberId,
        priceCents: String(priceCents),
      },
      success_url: `${APP_BASE_URL}/creator?checkout=success`,
      cancel_url: `${APP_BASE_URL}/creator?checkout=cancel`,
    });

    const split = computeSplit(priceCents);
    return {
      id: session.id,
      type: "subscription",
      grossCents: split.grossCents,
      platformFeeCents: split.platformFeeCents,
      netCents: split.netCents,
      currency: "USD",
      createdAt: nowIso(),
      checkoutUrl: session.url ?? undefined,
      pending: true,
    };
  },

  async createTip({ creatorId, fromUserId, amountCents }: CreateTipInput): Promise<PaymentResult> {
    const stripe = getStripe();
    const destinationAccountId = await requireConnectedAccount(creatorId);
    const split = computeSplit(amountCents);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: { name: "AItube tip" },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: split.platformFeeCents,
        transfer_data: { destination: destinationAccountId },
      },
      metadata: {
        type: "tip",
        creatorId,
        fromUserId,
        amountCents: String(amountCents),
      },
      success_url: `${APP_BASE_URL}/creator?checkout=success`,
      cancel_url: `${APP_BASE_URL}/creator?checkout=cancel`,
    });

    return {
      id: session.id,
      type: "tip",
      grossCents: split.grossCents,
      platformFeeCents: split.platformFeeCents,
      netCents: split.netCents,
      currency: "USD",
      createdAt: nowIso(),
      checkoutUrl: session.url ?? undefined,
      pending: true,
    };
  },

  async getBalance(creatorId: string): Promise<Balance> {
    const stripe = getStripe();
    const creator = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { stripeAccountId: true, stripeOnboarded: true },
    });
    if (!creator?.stripeAccountId || !creator.stripeOnboarded) {
      return { creatorId, availableCents: 0, pendingCents: 0, currency: "USD" };
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: creator.stripeAccountId,
    });
    const usd = (parts: Stripe.Balance["available"]) =>
      parts.find((p) => p.currency === "usd")?.amount ?? 0;

    return {
      creatorId,
      availableCents: usd(balance.available),
      pendingCents: usd(balance.pending),
      currency: "USD",
    };
  },
};
