import { prisma } from "@/lib/db";
import { decisionToVideoStatus } from "@/lib/policy";
import type { SimulateScenario } from "@/lib/services/simulate";
import { runSafetyPipeline } from "./run";
import type { PipelineStep } from "@prisma/client";

// Local async simulation: the upload route fires this un-awaited and the client
// polls ProcessingStatus.step. Real impl swaps this body onto a queue worker —
// the service interfaces don't change.
const STEP_DELAY_MS = Number(process.env.PIPELINE_STEP_DELAY_MS ?? 800);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function setStep(videoId: string, step: PipelineStep) {
  await prisma.processingStatus.update({ where: { videoId }, data: { step } });
}

export async function processUpload(
  videoId: string,
  simulate?: SimulateScenario,
): Promise<void> {
  try {
    await prisma.processingStatus.update({
      where: { videoId },
      data: { step: "AI_CHECK", startedAt: new Date() },
    });
    await sleep(STEP_DELAY_MS);
    await setStep(videoId, "PROVENANCE");
    await sleep(STEP_DELAY_MS);
    await setStep(videoId, "MODERATION");
    await sleep(STEP_DELAY_MS);
    await setStep(videoId, "DEEPFAKE");
    await sleep(STEP_DELAY_MS);

    const report = await runSafetyPipeline({ videoId, simulate });
    const videoStatus = decisionToVideoStatus(report.decision);
    const published = report.decision === "PUBLISH";

    // With Mux Direct Upload the client already PUT the file to Mux before the
    // pipeline ran — no server-side ingest needed. The Mux webhook (or the
    // /api/videos/[id]/playback polling endpoint) will set muxPlaybackId once
    // Mux finishes transcoding.
    await prisma.$transaction([
      prisma.processingStatus.update({
        where: { videoId },
        data: {
          step: "DONE",
          decision: report.decision,
          reason: report.reason,
          messageKey: report.messageKey,
          aiIsGenerated: report.ai.isAiGenerated,
          aiConfidence: report.ai.confidence,
          aiModel: report.ai.detectedModel,
          provenanceHasCredentials: report.provenance.hasCredentials,
          provenanceGenerator: report.provenance.generator,
          moderationDecision: report.moderation.decision,
          moderationTopCategory: report.moderation.topCategory,
          realPersonDeepfake: report.deepfake.realPersonDeepfake,
          completedAt: new Date(),
        },
      }),
      prisma.video.update({
        where: { id: videoId },
        data: {
          status: videoStatus,
          publishedAt: published ? new Date() : null,
          aiModel: report.ai.detectedModel ?? report.provenance.generator,
          provenanceVerified: published ? report.provenance.hasCredentials : false,
        },
      }),
    ]);
  } catch (err) {
    console.error("[pipeline] processUpload failed", videoId, err);
    await prisma.processingStatus
      .update({
        where: { videoId },
        data: {
          step: "DONE",
          decision: "BLOCK",
          reason: "OTHER",
          messageKey: "policy.message.error",
          completedAt: new Date(),
        },
      })
      .catch(() => {});
    await prisma.video
      .update({ where: { id: videoId }, data: { status: "BLOCKED" } })
      .catch(() => {});
  }
}
