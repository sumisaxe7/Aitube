// Upload / transcode / playback. Real later: Mux (or S3 -> Transcoder -> CDN).
export interface CreateUploadResult {
  uploadId: string;
  uploadUrl: string;
  assetId: string;
}

export type TranscodeStatus = "preparing" | "ready" | "errored";

export interface TranscodeResult {
  assetId: string;
  status: TranscodeStatus;
  playbackId: string | null;
  durationSec: number | null;
}

export interface VideoService {
  createUpload(opts?: { passthrough?: string }): Promise<CreateUploadResult>;
  getTranscodeStatus(assetId: string): Promise<TranscodeResult>;
  getPlaybackUrl(playbackId: string): string;
}
