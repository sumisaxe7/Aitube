import { NextResponse } from "next/server";
import { Genre } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentCreator } from "@/lib/session";
import type { SimulateScenario } from "@/lib/services/simulate";
import { processUpload } from "@/lib/pipeline/process";
import { video as videoService } from "@/lib/services/video";
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

// POST /api/uploads — create a video record and return a Mux direct-upload URL.
// The server never receives or buffers video bytes — the client PUTs directly to
// Mux CDN. Thumbnails are omitted from the payload (Mux auto-generates them),
// keeping the request well under Vercel's 4.5 MB function payload limit.
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

  // Size check via metadata field — client sends File.size, not the bytes.
  const fileSizeRaw = formData.get("fileSizeBytes");
  if (fileSizeRaw) {
    const fileSize = Number(fileSizeRaw);
    const maxBytes = getFileSizeLimit(process.env.FILE_SIZE_LIMIT);
    if (fileSize > maxBytes) {
      return NextResponse.json(
        { error: "File exceeds the configured size limit." },
        { status: 413 },
      );
    }
  }

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
      processing: { create: { step: "QUEUED" } },
    },
  });

  // Create a Mux direct-upload URL with passthrough = our video ID so the
  // webhook can link the Mux asset back to this record without a DB migration.
  const upload = await videoService.createUpload({ passthrough: newVideo.id });

  const isMux = process.env.VIDEO_PROVIDER === "mux";

  // Store the upload ID so the playback-polling endpoint can resolve it to an
  // asset ID via the Mux API (needed when webhook can't reach localhost in dev).
  if (isMux && upload.uploadId) {
    await prisma.video.update({
      where: { id: newVideo.id },
      data: { videoUrl: `mux-upload:${upload.uploadId}` },
    });
  }

  // Fire-and-forget: pipeline advances steps while the client polls.
  void processUpload(newVideo.id, simulate);

  return NextResponse.json(
    {
      videoId: newVideo.id,
      ...(isMux ? { muxUploadUrl: upload.uploadUrl } : {}),
    },
    { status: 201 },
  );
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
