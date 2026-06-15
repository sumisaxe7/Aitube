import { prisma } from "@/lib/db";

// Called by the Mux webhook (POST /api/mux/webhook) when an asset is ready.
// `videoId` is set via Mux's passthrough field on Direct Upload flows;
// falls back to legacy muxAssetId lookup for any older assets.
export async function handleMuxAssetReady(
  assetId: string,
  playbackId: string,
  durationSec: number,
  videoId?: string | null,
) {
  // Mux auto-generates a thumbnail we can use immediately.
  const posterUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

  if (videoId) {
    await prisma.video.update({
      where: { id: videoId },
      data: { muxAssetId: assetId, muxPlaybackId: playbackId, durationSec, posterUrl },
    });
  } else {
    await prisma.video.updateMany({
      where: { muxAssetId: assetId },
      data: { muxPlaybackId: playbackId, durationSec, posterUrl },
    });
  }
}
