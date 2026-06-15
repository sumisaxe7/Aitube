import Mux from "@mux/mux-node";

import { prisma } from "@/lib/db";
import { getVideoStream } from "@/lib/storage/video-store";

// Streams the stored video (MongoDB GridFS or local disk) into a new Mux asset
// via a direct PUT upload. Returns the Mux asset ID so the caller can store it.
// Mux will fire a webhook when the asset is ready; until then muxPlaybackId stays null.
export async function submitToMux(videoId: string): Promise<string | null> {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) return null; // Mux not configured — skip silently

  const stored = await getVideoStream(videoId);
  if (!stored) {
    console.warn("[mux-ingest] no stored video found for", videoId);
    return null;
  }

  const mux = new Mux({ tokenId, tokenSecret });

  // Create a direct upload URL on Mux
  const upload = await mux.video.uploads.create({
    cors_origin: "*",
    new_asset_settings: {
      playback_policy: ["public"],
      video_quality: "basic",
    },
  });

  // Stream the file body from MongoDB/disk directly to Mux's upload URL
  const { stream, contentType } = stored;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);

  const res = await fetch(upload.url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body,
  });

  if (!res.ok) {
    throw new Error(`Mux upload PUT failed: ${res.status} ${await res.text()}`);
  }

  // Poll until Mux resolves the upload to an asset ID (usually < 5 s)
  let assetId = upload.asset_id ?? null;
  if (!assetId) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const refreshed = await mux.video.uploads.retrieve(upload.id);
      if (refreshed.asset_id) {
        assetId = refreshed.asset_id;
        break;
      }
    }
  }

  if (!assetId) {
    throw new Error(`Mux upload ${upload.id} did not resolve to an asset within timeout`);
  }

  // Persist the asset ID immediately; playback ID will arrive via webhook
  await prisma.video.update({
    where: { id: videoId },
    data: { muxAssetId: assetId },
  });

  return assetId;
}

// Called by the Mux webhook handler (POST /api/mux/webhook) when an asset is ready.
// `videoId` is populated via Mux's passthrough field for Direct Upload flows.
export async function handleMuxAssetReady(
  assetId: string,
  playbackId: string,
  durationSec: number,
  videoId?: string | null,
) {
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
