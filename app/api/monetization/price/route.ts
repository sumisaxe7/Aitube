import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentCreator } from "@/lib/session";
import { getCreatorMonetization } from "@/lib/monetization";

export const dynamic = "force-dynamic";

// POST /api/monetization/price — a qualified creator sets their subscription price.
export async function POST(request: Request) {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { priceCents?: unknown };
  const priceCents = Number(body.priceCents);
  if (!Number.isInteger(priceCents) || priceCents < 100 || priceCents > 100_000) {
    return NextResponse.json(
      { error: "priceCents must be an integer between 100 and 100000" },
      { status: 400 },
    );
  }

  const mon = await getCreatorMonetization(creator.id);
  if (!mon.qualification.qualified) {
    return NextResponse.json({ error: "not qualified for monetization" }, { status: 403 });
  }

  const updated = await prisma.creatorProfile.update({
    where: { id: creator.id },
    data: { subscriptionPriceCents: priceCents },
  });
  return NextResponse.json({
    subscriptionPriceCents: updated.subscriptionPriceCents,
  });
}
