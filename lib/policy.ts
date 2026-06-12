import type { VideoStatus } from "@prisma/client";
import type { BlockReason, PipelineDecision } from "@/lib/pipeline/types";

// --- Tunable policy ---------------------------------------------------------

// Minimum aiCheck confidence to accept a clip as AI-generated. Below this we do
// NOT block (it might be a false negative) — we route to human review, since
// "is it AI?" is the platform's whole premise and a human should confirm.
export const AI_MIN_CONFIDENCE = 0.5;

// --- Mappings ---------------------------------------------------------------

export function decisionToVideoStatus(decision: PipelineDecision): VideoStatus {
  switch (decision) {
    case "PUBLISH":
      return "PUBLISHED";
    case "HOLD_FOR_REVIEW":
      return "IN_REVIEW";
    case "BLOCK":
      return "BLOCKED";
  }
}

const MESSAGE_KEYS: Record<BlockReason, string> = {
  NONE: "policy.message.published",
  NOT_AI: "policy.message.notAi",
  AMBIGUOUS: "policy.message.ambiguous",
  EXPLICIT: "policy.message.explicit",
  VIOLENCE: "policy.message.violence",
  REAL_PERSON_DEEPFAKE: "policy.message.realPersonDeepfake",
  OTHER: "policy.message.other",
};

export function reasonToMessageKey(reason: BlockReason): string {
  return MESSAGE_KEYS[reason];
}
