import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";
import { Genre } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentCreator } from "@/lib/session";
import type { SimulateScenario } from "@/lib/services/simulate";
import { processUpload } from "@/lib/pipeline/process";
import { storeVideoInMongo } from "@/lib/storage/video-store";
import { getFileSizeLimit } from "@/lib/upload-limit";

export const dynamic = "force-dynamic";

const SIMULATE_VALUES: SimulateScenario[] = [
  "clean",
  "review",
  "explicit",
  "violence",
  "deepfake",
  "not_ai",
];

// POST /api/uploads — accept multipart/form-data, save file to disk, kick pipeline.
export async function POST(request: Request) {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "expected multipart/form-data" },
      { status: 400 },
    );
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = formData.get("description")
    ? String(formData.get("description"))
    : null;
  const genre = String(formData.get("genre") ?? "");
  const simulateRaw = formData.get("simulate");
  const simulate: SimulateScenario | undefined = SIMULATE_VALUES.includes(
    simulateRaw as SimulateScenario,
  )
    ? (simulateRaw as SimulateScenario)
    : undefined;
  const maxBytes = getFileSizeLimit(process.env.FILE_SIZE_LIMIT);
  const file = formData.get("file") as File | null;
  if (file && file.size > maxBytes) {
    return NextResponse.json(
      { error: "File exceeds the configured size limit." },
      { status: 413 },
    );
  }
  const thumbnailDataUrl = formData.get("thumbnailDataUrl")
    ? String(formData.get("thumbnailDataUrl"))
    : null;
  const durationSec =
    parseInt(String(formData.get("durationSec") ?? "0"), 10) || 0;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!(Object.values(Genre) as string[]).includes(genre)) {
    return NextResponse.json({ error: "invalid genre" }, { status: 400 });
  }

  const newVideo = await prisma.video.create({
    data: {
      creatorId: creator.id,
      title,
      description,
      genre: genre as Genre,
      status: "PROCESSING",
      durationSec,
      provenanceVerified: false,
      posterUrl: thumbnailDataUrl ?? null,
      processing: { create: { step: "QUEUED" } },
    },
  });

  if (file && file.size > 0) {
    try {
      const stored = await storeVideoInMongo(newVideo.id, file);
      if (stored) {
        await prisma.video.update({
          where: { id: newVideo.id },
          data: { videoUrl: stored.url },
        });
      } else {
        const ext = path.extname(file.name) || ".mp4";
        const uploadsDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          "videos",
        );
        await mkdir(uploadsDir, { recursive: true });
        const filename = `${newVideo.id}${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(uploadsDir, filename), buffer);
        await prisma.video.update({
          where: { id: newVideo.id },
          data: { videoUrl: `/uploads/videos/${filename}` },
        });
      }
    } catch (err) {
      console.error("File save error:", err);
    }
  }

  // Fire-and-forget: pipeline advances steps while the client polls.
  void processUpload(newVideo.id, simulate);

  return NextResponse.json({ videoId: newVideo.id }, { status: 201 });
}

// GET /api/uploads — the signed-in creator's uploads with their statuses.
export async function GET() {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const videos = await prisma.video.findMany({
    where: { creatorId: creator.id },
    include: { processing: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ videos });
}
