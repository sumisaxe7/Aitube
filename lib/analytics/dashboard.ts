import { prisma } from "@/lib/db";
import { weightedQualityScore, type QualityResult } from "@/lib/quality";
import { dropOffCurve, type DropOffBucket } from "./rollup";
import { rebuildRollupsForCreator } from "./persist";

export interface VideoAnalytics {
  id: string;
  title: string;
  durationSec: number;
  views: number;
  watchTimeSec: number;
  completes: number;
  completionRate: number;
  dropOff: DropOffBucket[];
  quality: QualityResult;
}

export interface CreatorAnalytics {
  totals: { views: number; watchTimeSec: number; completes: number };
  videos: VideoAnalytics[];
  geography: { country: string; views: number }[];
  revenue: { grossCents: number; netCents: number; platformFeeCents: number };
}

// Reads the precomputed rollups for the dashboard. Rebuilds them first so live
// events (from browsing) are reflected — cheap at beta scale; a real deployment
// would roll up on a schedule instead.
export async function getCreatorAnalytics(
  creatorId: string,
): Promise<CreatorAnalytics> {
  await rebuildRollupsForCreator(creatorId);

  const videos = await prisma.video.findMany({
    where: { creatorId, status: "PUBLISHED" },
    include: {
      rollups: true,
      ratings: { select: { visual: true, narrative: true, audio: true } },
      events: { where: { type: "WATCH_PROGRESS" }, select: { positionSec: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  const videoAnalytics: VideoAnalytics[] = videos.map((v) => {
    const views = v.rollups.reduce((s, r) => s + r.views, 0);
    const watchTimeSec = v.rollups.reduce((s, r) => s + r.watchTimeSec, 0);
    const completes = v.rollups.reduce((s, r) => s + r.completes, 0);
    const positions = v.events.map((e) => e.positionSec ?? 0);
    return {
      id: v.id,
      title: v.title,
      durationSec: v.durationSec,
      views,
      watchTimeSec,
      completes,
      completionRate: views > 0 ? completes / views : 0,
      dropOff: dropOffCurve(positions, v.durationSec),
      quality: weightedQualityScore(v.ratings),
    };
  });

  const totals = videoAnalytics.reduce(
    (acc, v) => ({
      views: acc.views + v.views,
      watchTimeSec: acc.watchTimeSec + v.watchTimeSec,
      completes: acc.completes + v.completes,
    }),
    { views: 0, watchTimeSec: 0, completes: 0 },
  );

  const videoIds = videos.map((v) => v.id);
  const geoGroups = videoIds.length
    ? await prisma.viewerEvent.groupBy({
        by: ["country"],
        where: {
          videoId: { in: videoIds },
          type: "VIEW_START",
          country: { not: null },
        },
        _count: { _all: true },
      })
    : [];
  const geography = geoGroups
    .map((g) => ({ country: g.country as string, views: g._count._all }))
    .sort((a, b) => b.views - a.views);

  const ledger = await prisma.ledgerEntry.findMany({ where: { creatorId } });
  const revenue = ledger.reduce(
    (acc, e) => ({
      grossCents: acc.grossCents + e.grossCents,
      netCents: acc.netCents + e.netCents,
      platformFeeCents: acc.platformFeeCents + e.platformFeeCents,
    }),
    { grossCents: 0, netCents: 0, platformFeeCents: 0 },
  );

  return { totals, videos: videoAnalytics, geography, revenue };
}
