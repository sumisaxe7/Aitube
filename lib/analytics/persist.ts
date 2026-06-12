import { prisma } from "@/lib/db";
import { rollupDailyEvents } from "./rollup";

// Rebuild the precomputed DailyRollup rows for a video from its raw events.
export async function rebuildRollupsForVideo(videoId: string): Promise<void> {
  const events = await prisma.viewerEvent.findMany({ where: { videoId } });
  const rows = rollupDailyEvents(
    events.map((e) => ({
      videoId: e.videoId,
      type: e.type,
      positionSec: e.positionSec,
      createdAt: e.createdAt,
    })),
  );

  await prisma.$transaction([
    prisma.dailyRollup.deleteMany({ where: { videoId } }),
    ...rows.map((r) =>
      prisma.dailyRollup.create({
        data: {
          videoId: r.videoId,
          date: new Date(`${r.date}T00:00:00.000Z`),
          views: r.views,
          watchTimeSec: r.watchTimeSec,
          completes: r.completes,
        },
      }),
    ),
  ]);
}

export async function rebuildRollupsForCreator(creatorId: string): Promise<void> {
  const videos = await prisma.video.findMany({
    where: { creatorId },
    select: { id: true },
  });
  for (const v of videos) await rebuildRollupsForVideo(v.id);
}
