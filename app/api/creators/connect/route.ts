import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentCreator } from "@/lib/session";
import { getStripe, APP_BASE_URL } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// POST /api/creators/connect — create (if needed) a Stripe Express account for
// the signed-in creator and return an onboarding link. The creator's browser
// is redirected to Stripe to supply payout details; Stripe redirects back to
// /studio/monetization afterwards via return_url.
export async function POST() {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.PAYMENTS_PROVIDER !== "stripe") {
    return NextResponse.json(
      { error: "Stripe is not enabled (set PAYMENTS_PROVIDER=stripe)." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  let accountId = creator.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.creatorProfile.update({
      where: { id: creator.id },
      data: { stripeAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${APP_BASE_URL}/studio/monetization?stripe=refresh`,
    return_url: `${APP_BASE_URL}/studio/monetization?stripe=return`,
  });

  return NextResponse.json({ url: accountLink.url });
}

// GET /api/creators/connect — re-check onboarding status against Stripe and
// persist stripeOnboarded. Called when the creator lands back from Stripe.
export async function GET() {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!creator.stripeAccountId) {
    return NextResponse.json({ onboarded: false });
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(creator.stripeAccountId);
  const onboarded = Boolean(account.details_submitted);

  if (onboarded !== creator.stripeOnboarded) {
    await prisma.creatorProfile.update({
      where: { id: creator.id },
      data: { stripeOnboarded: onboarded },
    });
  }

  return NextResponse.json({ onboarded });
}
