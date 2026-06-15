import Mux from "@mux/mux-node";

import type { VideoService, TranscodeResult } from "./types";

function client() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error("MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set");
  }
  return new Mux({ tokenId, tokenSecret });
}

export const muxVideo: VideoService = {
  async createUpload() {
    const mux = client();
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXTAUTH_URL ?? "*",
      new_asset_settings: {
        playback_policy: ["public"],
        video_quality: "basic",
      },
    });
    return {
      uploadId: upload.id,
      uploadUrl: upload.url,
      assetId: upload.asset_id ?? "",
    };
  },

  async getTranscodeStatus(assetId): Promise<TranscodeResult> {
    const mux = client();
    const asset = await mux.video.assets.retrieve(assetId);
    const playback = asset.playback_ids?.find((p) => p.policy === "public");
    const status =
      asset.status === "ready"
        ? "ready"
        : asset.status === "errored"
          ? "errored"
          : "preparing";
    return {
      assetId: asset.id,
      status,
      playbackId: playback?.id ?? null,
      durationSec: asset.duration ? Math.round(asset.duration) : null,
    };
  },

  getPlaybackUrl(playbackId) {
    return `https://stream.mux.com/${playbackId}.m3u8`;
  },
};
