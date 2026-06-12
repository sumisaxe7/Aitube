import { prisma } from "@/lib/db";
import { weightedQualityScore } from "@/lib/quality";
import {
  qualifiesForMonetization,
  type QualificationResult,
} from "@/lib/qualification";

export interface CreatorEarnings {
  grossCents: number;
  platformFeeCents: number;
  netCents: number;
  subscriptionCount: number;
  tipCount: number;
}

export interface CreatorMonetization {
  qualification: QualificationResult;
  subscriptionPriceCents: number | null;
  earnings: CreatorEarnings;
  activeSubscribers: number;
}

/** Compute a creator's qualification (best published-video WQS + count) + earnings. */
export async function getCreatorMonetization(
  creatorId: string,
): Promise<CreatorMonetization> {
  const published = await prisma.video.findMany({
    where: { creatorId, status: "PUBLISHED" },
    include: { ratings: { select: { visual: true, narrative: true, audio: true } } },
  });

  const topQualityScore = published.reduce(
    (max, v) => Math.max(max, weightedQualityScore(v.ratings).score),
    0,
  );

  const qualification = qualifiesForMonetization({
    publishedVideoCount: published.length,
    topQualityScore,
  });

  const [creator, ledger, activeSubscribers] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { id: creatorId } }),
    prisma.ledgerEntry.findMany({ where: { creatorId } }),
    prisma.subscription.count({ where: { creatorId, status: "ACTIVE" } }),
  ]);

  const earnings = ledger.reduce<CreatorEarnings>(
    (acc, e) => ({
      grossCents: acc.grossCents + e.grossCents,
      platformFeeCents: acc.platformFeeCents + e.platformFeeCents,
      netCents: acc.netCents + e.netCents,
      subscriptionCount:
        acc.subscriptionCount + (e.type === "SUBSCRIPTION" ? 1 : 0),
      tipCount: acc.tipCount + (e.type === "TIP" ? 1 : 0),
    }),
    {
      grossCents: 0,
      platformFeeCents: 0,
      netCents: 0,
      subscriptionCount: 0,
      tipCount: 0,
    },
  );

  return {
    qualification,
    subscriptionPriceCents: creator?.subscriptionPriceCents ?? null,
    earnings,
    activeSubscribers,
  };
}
