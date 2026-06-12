import { NextResponse } from "next/server";
import type { Video, ProcessingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentCreator } from "@/lib/session";
import { helpBot } from "@/lib/services";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function statusFallbackKey(status: string): string {
  switch (status) {
    case "PUBLISHED":
      return "policy.message.published";
    case "IN_REVIEW":
      return "policy.message.ambiguous";
    case "BLOCKED":
      return "policy.message.other";
    default:
      return "help.statusProcessing";
  }
}

type VideoWithProcessing = Video & { processing: ProcessingStatus | null };

export async function POST(request: Request) {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    question?: unknown;
    videoId?: unknown;
  };
  const question = String(body.question ?? "").slice(0, 1000);
  const videoId = body.videoId ? String(body.videoId) : null;
  const t = getTranslator(DEFAULT_LOCALE);

  const videos = await prisma.video.findMany({
    where: { creatorId: creator.id },
    include: { processing: true },
    orderBy: { createdAt: "desc" },
  });

  const toCtx = (v: VideoWithProcessing) => ({
    title: v.title,
    status: v.status,
    reason: v.processing?.reason ?? "NONE",
    reasonMessage: t(v.processing?.messageKey ?? statusFallbackKey(v.status)),
    aiModel: v.aiModel,
  });

  const focus = videoId ? videos.find((v) => v.id === videoId) : null;

  const answer = await helpBot.answer({
    question,
    context: {
      creatorName: creator.displayName,
      policySummary: t("help.policySummary"),
      videos: videos.map(toCtx),
      focusVideo: focus ? toCtx(focus) : null,
    },
  });

  return NextResponse.json(answer);
}
