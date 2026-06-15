import { readdir, unlink } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCurrentCreator } from "@/lib/session";
import { deleteVideoFromMongo } from "@/lib/storage/video-store";

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const video = await prisma.video.findUnique({
    where: { id },
    select: { creatorId: true, muxAssetId: true },
  });
  if (!video || (!isAdmin && video.creatorId !== creator.id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Delete from Mux (non-fatal — DB row is the source of truth).
  if (video.muxAssetId) {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    if (tokenId && tokenSecret) {
      try {
        const mux = new Mux({ tokenId, tokenSecret });
        await mux.video.assets.delete(video.muxAssetId);
      } catch (err) {
        console.error("[delete] Mux asset deletion failed (non-fatal):", err);
      }
    }
  }

  // Delete from MongoDB GridFS / local disk (legacy storage, non-fatal).
  try {
    await deleteVideoFromMongo(id);
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");
    const files = await readdir(uploadsDir).catch(() => []);
    await Promise.all(
      files
        .filter((f) => f.startsWith(`${id}.`))
        .map((f) => unlink(path.join(uploadsDir, f)).catch(() => undefined)),
    );
  } catch (err) {
    console.error("[delete] File cleanup failed (non-fatal):", err);
  }

  await prisma.video.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
