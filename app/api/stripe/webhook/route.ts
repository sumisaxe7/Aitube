import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { computeSplit } from "@/lib/revenue";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// POST /api/stripe/webhook — the source of truth for "did money actually move".
// Mirrors the ledger-writing logic that the mock-provider API routes do
// synchronously (app/api/creators/[handle]/{subscribe,tip}/route.ts), but only
// runs once Stripe confirms payment. Configure this URL in the Stripe
// dashboard (or via `stripe listen --forward-to localhost:3000/api/stripe/webhook`).
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing stripe-signature header" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: `webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};

      if (metadata.type === "subscription") {
        const { creatorId, subscriberUserId, priceCents } = metadata;
        const price = Number(priceCents);
        const split = computeSplit(price);

        await prisma.$transaction([
          prisma.subscription.upsert({
            where: {
              creatorId_subscriberUserId: { creatorId, subscriberUserId },
            },
            create: {
              creatorId,
              subscriberUserId,
              priceCents: price,
              status: "ACTIVE",
            },
            update: { status: "ACTIVE", priceCents: price, canceledAt: null },
          }),
          prisma.ledgerEntry.create({
            data: {
              type: "SUBSCRIPTION",
              creatorId,
              payerUserId: subscriberUserId,
              grossCents: split.grossCents,
              platformFeeCents: split.platformFeeCents,
              netCents: split.netCents,
              note: `Stripe checkout session ${session.id}`,
            },
          }),
        ]);
      } else if (metadata.type === "tip") {
        const { creatorId, fromUserId, amountCents } = metadata;
        const split = computeSplit(Number(amountCents));

        await prisma.ledgerEntry.create({
          data: {
            type: "TIP",
            creatorId,
            payerUserId: fromUserId,
            grossCents: split.grossCents,
            platformFeeCents: split.platformFeeCents,
            netCents: split.netCents,
            note: `Stripe checkout session ${session.id}`,
          },
        });
      }
      break;
    }

    case "invoice.paid": {
      // Recurring subscription renewal (not the first payment, which is
      // handled by checkout.session.completed above). Record another ledger
      // row so monthly recurring revenue accrues correctly.
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      if (invoice.billing_reason === "subscription_create" || !subscriptionId) {
        // First invoice is covered by checkout.session.completed.
        break;
      }

      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      const { creatorId, subscriberUserId } = stripeSub.metadata ?? {};
      if (!creatorId || !subscriberUserId) break;

      const split = computeSplit(invoice.amount_paid);
      await prisma.ledgerEntry.create({
        data: {
          type: "SUBSCRIPTION",
          creatorId,
          payerUserId: subscriberUserId,
          grossCents: split.grossCents,
          platformFeeCents: split.platformFeeCents,
          netCents: split.netCents,
          note: `Stripe invoice ${invoice.id} (renewal)`,
        },
      });
      break;
    }

    case "account.updated": {
      // Connect onboarding status changed — keep stripeOnboarded in sync
      // without waiting for the creator to revisit /studio/monetization.
      const account = event.data.object as Stripe.Account;
      await prisma.creatorProfile.updateMany({
        where: { stripeAccountId: account.id },
        data: { stripeOnboarded: Boolean(account.details_submitted) },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
