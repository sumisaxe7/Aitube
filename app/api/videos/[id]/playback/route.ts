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

// GET /api/videos/[id]/playback — lightweight poll for playback readiness.
// When VIDEO_PROVIDER=mux and the webhook hasn't fired yet (local dev without
// ngrok), this endpoint resolves the upload → asset → playback ID directly via
// the Mux API and writes the result to the DB so future calls are instant.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id, status: "PUBLISHED" },
    select: { muxPlaybackId: true, videoUrl: true, posterUrl: true, muxAssetId: true },
  });
  if (!video) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Already resolved — fast path.
  if (video.muxPlaybackId) {
    return NextResponse.json({
      muxPlaybackId: video.muxPlaybackId,
      videoUrl: null,
      posterUrl: video.posterUrl,
    });
  }

  const mux = muxClient();

  // Try to resolve via Mux API if we have an upload ID or asset ID stored.
  if (mux) {
    try {
      let assetId = video.muxAssetId ?? null;

      // Resolve upload ID → asset ID if not yet known.
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

      // Check asset status and grab playback ID if ready.
      if (assetId) {
        const asset = await mux.video.assets.retrieve(assetId);
        if (asset.status === "ready") {
          const playback = asset.playback_ids?.find((p) => p.policy === "public");
          if (playback?.id) {
            const durationSec = asset.duration ? Math.round(asset.duration) : 0;
            // Use Mux's auto-generated thumbnail — no client upload needed.
            const posterUrl = `https://image.mux.com/${playback.id}/thumbnail.jpg`;
            await prisma.video.update({
              where: { id },
              data: { muxPlaybackId: playback.id, durationSec, posterUrl },
            });
            return NextResponse.json({
              muxPlaybackId: playback.id,
              videoUrl: null,
              posterUrl,
            });
          }
        }
      }
    } catch (err) {
      console.error("[playback] Mux API check failed:", err);
    }
  }

  // Still transcoding or no Mux credentials — return null so client keeps polling.
  return NextResponse.json({
    muxPlaybackId: null,
    videoUrl: video.videoUrl?.startsWith("mux-upload:") ? null : (video.videoUrl ?? null),
    posterUrl: video.posterUrl,
  });
}
