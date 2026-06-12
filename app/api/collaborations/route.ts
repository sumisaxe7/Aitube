import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentCreator } from "@/lib/session";
import { createCollaboration } from "@/lib/collaboration";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    title?: unknown;
    videoId?: unknown;
  };
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const collaboration = await createCollaboration(
    creator.id,
    title,
    body.videoId ? String(body.videoId) : null,
  );
  return NextResponse.json({ collaboration }, { status: 201 });
}

export async function GET() {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const collaborations = await prisma.collaboration.findMany({
    where: { collaborators: { some: { creatorId: creator.id } } },
    include: { collaborators: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ collaborations });
}
