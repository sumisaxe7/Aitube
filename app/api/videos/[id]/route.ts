import { Readable } from "stream";
import { NextResponse } from "next/server";

import { getVideoMeta, openVideoStream } from "@/lib/storage/video-store";

export const dynamic = "force-dynamic";

function nodeToWeb(readable: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      readable.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      readable.on("end", () => controller.close());
      readable.on("error", (err) => controller.error(err));
    },
    cancel() {
      readable.destroy();
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const meta = await getVideoMeta(id);

  if (!meta) {
    console.error(`[video] no file found for videoId=${id}`);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { size: totalSize, contentType } = meta;
  const rangeHeader = request.headers.get("range");

  if (!rangeHeader) {
    const stream = await openVideoStream(meta);
    return new NextResponse(nodeToWeb(stream), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(totalSize),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Parse "bytes=start-end"
  const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
  const start = parseInt(startStr, 10);
  const end = endStr ? Math.min(parseInt(endStr, 10), totalSize - 1) : totalSize - 1;

  if (isNaN(start) || start >= totalSize) {
    return new NextResponse(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${totalSize}` },
    });
  }

  const chunkSize = end - start + 1;
  const stream = await openVideoStream(meta, { start, end });

  return new NextResponse(nodeToWeb(stream), {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Content-Length": String(chunkSize),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
