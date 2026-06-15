import { createReadStream, existsSync } from "fs";
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
    clientPromise = new MongoClient(MONGODB_URI).connect();
  }
  return clientPromise;
}

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

<<<<<<< feature-update
=======
export async function streamVideoFromMongo(videoId: string) {
  const client = getClient();
  if (!client) return null;

  const db = (await client).db(MONGODB_DB);
  const bucket = new GridFSBucket(db, { bucketName: "videos" });
  const file = await db.collection("videos.files").findOne({ "metadata.videoId": videoId });
  if (!file) return null;

  return {
    stream: bucket.openDownloadStream(file._id),
    contentType: file.contentType || "video/mp4",
    size: file.length,
  };
}

>>>>>>> main
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

export async function streamVideoFromLocal(videoId: string) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");
  const matches = [
    `${videoId}.mp4`,
    `${videoId}.mov`,
    `${videoId}.webm`,
    `${videoId}.m4v`,
  ];

  for (const name of matches) {
    const fullPath = path.join(uploadsDir, name);
    if (existsSync(fullPath)) {
      return {
        stream: createReadStream(fullPath),
        contentType: "video/mp4",
        size: undefined,
      };
    }
  }

  return null;
}

export async function getVideoStream(videoId: string) {
  return (await streamVideoFromMongo(videoId)) ?? (await streamVideoFromLocal(videoId));
}
