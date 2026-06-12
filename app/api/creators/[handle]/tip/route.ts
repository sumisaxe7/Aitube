import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { payments } from "@/lib/services";
import { computeSplit } from "@/lib/revenue";

export const dynamic = "force-dynamic";

// POST /api/creators/:handle/tip — tip any creator (any signed-in user).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { handle } = await params;
  const body = (await request.json().catch(() => ({}))) as { amountCents?: unknown };
  const amountCents = Number(body.amountCents);
  if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 500_000) {
    return NextResponse.json(
      { error: "amountCents must be an integer between 100 and 500000" },
      { status: 400 },
    );
  }
  const creator = await prisma.creatorProfile.findUnique({ where: { handle } });
  if (!creator) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await payments.createTip({
    creatorId: creator.id,
    fromUserId: user.id,
    amountCents,
  });

  const split = computeSplit(amountCents);
  const entry = await prisma.ledgerEntry.create({
    data: {
      type: "TIP",
      creatorId: creator.id,
      payerUserId: user.id,
      grossCents: split.grossCents,
      platformFeeCents: split.platformFeeCents,
      netCents: split.netCents,
      note: "Tip",
    },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
