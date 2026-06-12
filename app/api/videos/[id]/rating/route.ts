import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const isStar = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;

// POST /api/videos/:id/rating — upsert the current user's rating (editable).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { visual, narrative, audio } = body;
  if (![visual, narrative, audio].every(isStar)) {
    return NextResponse.json(
      { error: "visual, narrative and audio must be integers 1-5" },
      { status: 400 },
    );
  }

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video || video.status !== "PUBLISHED") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const rating = await prisma.rating.upsert({
    where: { videoId_userId: { videoId: id, userId: user.id } },
    create: {
      videoId: id,
      userId: user.id,
      visual: visual as number,
      narrative: narrative as number,
      audio: audio as number,
    },
    update: {
      visual: visual as number,
      narrative: narrative as number,
      audio: audio as number,
    },
  });
  return NextResponse.json({ rating });
}

// GET /api/videos/:id/rating — the current user's existing rating (or null).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  const { id } = await params;
  if (!user?.id) return NextResponse.json({ rating: null });
  const rating = await prisma.rating.findUnique({
    where: { videoId_userId: { videoId: id, userId: user.id } },
  });
  return NextResponse.json({ rating });
}
