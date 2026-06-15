import type { VideoService } from "./types";
import { randInt, randomId } from "../_util";

// Mux-shaped ids/urls so callers code against a realistic surface. Nothing is
// actually uploaded or transcoded — getTranscodeStatus reports "ready" instantly.
export const mockVideo: VideoService = {
  async createUpload(_opts?: { passthrough?: string }) {
    const id = randomId();
    return {
      uploadId: `upl_${id}`,
      uploadUrl: `https://mock-upload.aitube.local/${id}`,
      assetId: `asset_${id}`,
    };
  },
  async getTranscodeStatus(assetId) {
    return {
      assetId,
      status: "ready",
      playbackId: `pb_${assetId.replace(/^asset_/, "")}`,
      durationSec: randInt(45, 900),
    };
  },
  getPlaybackUrl(playbackId) {
    return `https://stream.mock.aitube.local/${playbackId}.m3u8`;
  },
};
