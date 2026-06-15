import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import path from "path";

import { GridFSBucket, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "aitube";

let clientPromise: Promise<MongoClient> | undefined;

function getClient() {
  if (!MONGODB_URI) return null;
  if (!clientPromise) {
    const p = new MongoClient(MONGODB_URI).connect();
    // Reset the singleton if the connection fails so the next call retries
    p.catch(() => { clientPromise = undefined; });
    clientPromise = p;
  }
  return clientPromise;
}

export interface VideoMeta {
  size: number;
  contentType: string;
  source: "mongo" | "local";
  localPath?: string;
  mongoFileId?: unknown;
}

export interface StreamRange {
  start: number;
  end: number;
}

/** Look up file metadata without opening a stream. */
export async function getVideoMeta(videoId: string): Promise<VideoMeta | null> {
  // Try MongoDB first
  const client = getClient();
  if (client) {
    try {
      const db = (await client).db(MONGODB_DB);
      const file = await db.collection("videos.files").findOne({ "metadata.videoId": videoId });
      if (file) {
        return {
          size: file.length as number,
          contentType: (file.metadata?.contentType as string) || "video/mp4",
          source: "mongo",
          mongoFileId: file._id,
        };
      }
    } catch (err) {
      console.error("[video-store] MongoDB lookup failed:", err);
      // fall through to local
    }
  }

  // Try local filesystem
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");
  for (const ext of ["mp4", "mov", "webm", "m4v"]) {
    const fullPath = path.join(uploadsDir, `${videoId}.${ext}`);
    if (existsSync(fullPath)) {
      return {
        size: statSync(fullPath).size,
        contentType: "video/mp4",
        source: "local",
        localPath: fullPath,
      };
    }
  }

  return null;
}

/** Open a stream for a known file, optionally with a byte range. */
export async function openVideoStream(
  meta: VideoMeta,
  range?: StreamRange,
): Promise<Readable> {
  if (meta.source === "local" && meta.localPath) {
    return createReadStream(meta.localPath, range ? { start: range.start, end: range.end } : undefined);
  }

  // MongoDB
  const client = getClient();
  if (!client) throw new Error("MongoDB unavailable");
  const db = (await client).db(MONGODB_DB);
  const bucket = new GridFSBucket(db, { bucketName: "videos" });
  return bucket.openDownloadStream(
    meta.mongoFileId as Parameters<typeof bucket.openDownloadStream>[0],
    range ? { start: range.start, end: range.end } : undefined,
  );
}

// ── Legacy helpers (used by upload pipeline) ───────────────────────────────

export async function storeVideoInMongo(videoId: string, file: File) {
  const client = getClient();
  if (!client) return null;

  const db = (await client).db(MONGODB_DB);
  const bucket = new GridFSBucket(db, { bucketName: "videos" });
  const buffer = Buffer.from(await file.arrayBuffer());
  const stream = Readable.from(buffer);
  const uploadStream = bucket.openUploadStream(`${videoId}-${file.name}`, {
    metadata: {
      videoId,
      contentType: file.type || "video/mp4",
      uploadedAt: new Date().toISOString(),
    },
  });

  await pipeline(stream, uploadStream);

  return {
    storageKey: String(uploadStream.id),
    url: `/api/videos/${videoId}`,
  };
}

export async function deleteVideoFromMongo(videoId: string) {
  const client = getClient();
  if (!client) return false;

  const db = (await client).db(MONGODB_DB);
  const file = await db.collection("videos.files").findOne({ "metadata.videoId": videoId });
  if (!file) return false;

  await db.collection("videos.chunks").deleteMany({ files_id: file._id });
  await db.collection("videos.files").deleteOne({ _id: file._id });
  return true;
}

/** @deprecated Use getVideoMeta + openVideoStream instead. */
export async function getVideoStream(videoId: string, range?: StreamRange) {
  const meta = await getVideoMeta(videoId);
  if (!meta) return null;
  const stream = await openVideoStream(meta, range);
  return { stream, contentType: meta.contentType, size: meta.size };
}
