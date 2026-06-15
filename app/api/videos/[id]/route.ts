import { NextResponse } from "next/server";

import { getVideoStream } from "@/lib/storage/video-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const streamInfo = await getVideoStream(id);

  if (!streamInfo) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return new NextResponse(streamInfo.stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": streamInfo.contentType || "video/mp4",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Accept-Ranges": "bytes",
    },
  });
}
