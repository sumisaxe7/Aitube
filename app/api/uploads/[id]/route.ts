import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentCreator } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/uploads/:id — live processing status for the owner (polled by /upload).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id },
    include: { processing: true },
  });
  if (!video || video.creatorId !== creator.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    videoId: video.id,
    title: video.title,
    videoStatus: video.status,
    processing: video.processing,
  });
}
