import { NextResponse } from "next/server";
import { EventType } from "@prisma/client";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/events — ingest a viewer event (public). Mocked client-side beacons
// call this; a real deployment would batch these through an event stream.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const type = String(body.type ?? "");
  if (!(Object.values(EventType) as string[]).includes(type)) {
    return NextResponse.json({ error: "invalid event type" }, { status: 400 });
  }
  const videoId = String(body.videoId ?? "");
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, status: true },
  });
  if (!video || video.status !== "PUBLISHED") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const positionSec = Number(body.positionSec);
  const valueCents = Number(body.valueCents);
  await prisma.viewerEvent.create({
    data: {
      videoId,
      type: type as EventType,
      country: body.country
        ? String(body.country).slice(0, 2).toUpperCase()
        : null,
      positionSec: Number.isFinite(positionSec) ? Math.floor(positionSec) : null,
      valueCents: Number.isFinite(valueCents) ? Math.floor(valueCents) : null,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
