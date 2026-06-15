import { headers } from "next/headers";
import Mux from "@mux/mux-node";
import { NextResponse } from "next/server";

import { handleMuxAssetReady } from "@/lib/pipeline/mux-ingest";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("mux-signature") ?? "";

  try {
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
    mux.webhooks.verifySignature(body, { "mux-signature": signature }, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type === "video.asset.ready") {
    const asset = event.data;
    const playback = (asset.playback_ids ?? []).find(
      (p: { policy: string }) => p.policy === "public",
    );
    if (asset.id && playback?.id) {
      // `passthrough` holds the AItube video ID when the upload was created via
      // Direct Upload (the new path).  Fall back to legacy muxAssetId lookup.
      await handleMuxAssetReady(
        asset.id,
        playback.id,
        asset.duration ? Math.round(asset.duration) : 0,
        asset.passthrough ?? null,
      );
    }
  }

  return NextResponse.json({ received: true });
}
