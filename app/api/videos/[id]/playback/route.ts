import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function muxClient() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) return null;
  return new Mux({ tokenId, tokenSecret });
}

// GET /api/videos/[id]/playback — lightweight poll for Mux playback readiness.
// When the Mux webhook can't reach the server (local dev without ngrok) this
// endpoint resolves upload → asset → playbackId directly via the Mux API and
// writes the result to the DB so future calls and the webhook both stay in sync.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id, status: "PUBLISHED" },
    select: { muxPlaybackId: true, muxAssetId: true, videoUrl: true, posterUrl: true },
  });
  if (!video) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Fast path — already resolved.
  if (video.muxPlaybackId) {
    return NextResponse.json({
      muxPlaybackId: video.muxPlaybackId,
      posterUrl: video.posterUrl,
    });
  }

  const mux = muxClient();
  if (mux) {
    try {
      let assetId = video.muxAssetId ?? null;

      // Resolve upload ID → asset ID if the webhook hasn't fired yet.
      if (!assetId && video.videoUrl?.startsWith("mux-upload:")) {
        const uploadId = video.videoUrl.replace("mux-upload:", "");
        const upload = await mux.video.uploads.retrieve(uploadId);
        if (upload.asset_id) {
          assetId = upload.asset_id;
          await prisma.video.update({
            where: { id },
            data: { muxAssetId: assetId, videoUrl: null },
          });
        }
      }

      // Check asset and grab playback ID when Mux is done transcoding.
      if (assetId) {
        const asset = await mux.video.assets.retrieve(assetId);
        if (asset.status === "ready") {
          const playback = asset.playback_ids?.find((p) => p.policy === "public");
          if (playback?.id) {
            const posterUrl = `https://image.mux.com/${playback.id}/thumbnail.jpg`;
            const durationSec = asset.duration ? Math.round(asset.duration) : 0;
            await prisma.video.update({
              where: { id },
              data: { muxPlaybackId: playback.id, posterUrl, durationSec },
            });
            return NextResponse.json({ muxPlaybackId: playback.id, posterUrl });
          }
        }
      }
    } catch (err) {
      console.error("[playback] Mux API check failed:", err);
    }
  }

  // Still transcoding — client keeps polling.
  return NextResponse.json({ muxPlaybackId: null, posterUrl: video.posterUrl });
}
