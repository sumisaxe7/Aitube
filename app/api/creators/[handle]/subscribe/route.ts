import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { payments } from "@/lib/services";
import { computeSplit } from "@/lib/revenue";

export const dynamic = "force-dynamic";

// POST /api/creators/:handle/subscribe — subscribe at the creator's set price.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { handle } = await params;
  const creator = await prisma.creatorProfile.findUnique({ where: { handle } });
  if (!creator) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (creator.userId === user.id) {
    return NextResponse.json({ error: "cannot subscribe to yourself" }, { status: 400 });
  }
  if (!creator.subscriptionPriceCents) {
    return NextResponse.json({ error: "creator is not monetized" }, { status: 400 });
  }

  const price = creator.subscriptionPriceCents;
  // Simulate the processor charge (Stripe later).
  await payments.createSubscription({
    creatorId: creator.id,
    subscriberId: user.id,
    priceCents: price,
  });

  // Authoritative split + append-only ledger row, written atomically.
  const split = computeSplit(price);
  const [subscription, entry] = await prisma.$transaction([
    prisma.subscription.upsert({
      where: {
        creatorId_subscriberUserId: {
          creatorId: creator.id,
          subscriberUserId: user.id,
        },
      },
      create: {
        creatorId: creator.id,
        subscriberUserId: user.id,
        priceCents: price,
        status: "ACTIVE",
      },
      update: { status: "ACTIVE", priceCents: price, canceledAt: null },
    }),
    prisma.ledgerEntry.create({
      data: {
        type: "SUBSCRIPTION",
        creatorId: creator.id,
        payerUserId: user.id,
        grossCents: split.grossCents,
        platformFeeCents: split.platformFeeCents,
        netCents: split.netCents,
        note: "Subscription",
      },
    }),
  ]);

  return NextResponse.json({ subscription, entry }, { status: 201 });
}
