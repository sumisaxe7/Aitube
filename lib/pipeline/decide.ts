import { AI_MIN_CONFIDENCE, reasonToMessageKey } from "@/lib/policy";
import type { BlockReason, PipelineOutcome, PipelineSignals } from "./types";

function outcome(
  decision: PipelineOutcome["decision"],
  reason: BlockReason,
): PipelineOutcome {
  return { decision, reason, messageKey: reasonToMessageKey(reason) };
}

/**
 * The gating safety decision tree. Pure and exhaustively tested.
 *
 * Precedence (highest-risk first):
 *  1. Real-person deepfake  -> hard BLOCK (no auto-appeal; the brand-killing case).
 *  2. Explicit / violence   -> BLOCK.
 *  3. Not confidently AI     -> HOLD for human review (platform premise unconfirmed).
 *  4. Ambiguous safety       -> HOLD for human review.
 *  5. Otherwise              -> PUBLISH.
 *
 * BLOCK outranks HOLD outranks PUBLISH — a clip that is both a deepfake and
 * low-confidence-AI is still blocked, not merely held.
 */
export function decide(signals: PipelineSignals): PipelineOutcome {
  const { ai, moderation, deepfake } = signals;

  if (deepfake.realPersonDeepfake) {
    return outcome("BLOCK", "REAL_PERSON_DEEPFAKE");
  }

  if (moderation.decision === "block") {
    const reason: BlockReason =
      moderation.topCategory === "violence"
        ? "VIOLENCE"
        : moderation.topCategory === "explicit"
          ? "EXPLICIT"
          : "OTHER";
    return outcome("BLOCK", reason);
  }

  if (!ai.isAiGenerated || ai.confidence < AI_MIN_CONFIDENCE) {
    return outcome("HOLD_FOR_REVIEW", "NOT_AI");
  }

  if (moderation.decision === "review") {
    return outcome("HOLD_FOR_REVIEW", "AMBIGUOUS");
  }

  return outcome("PUBLISH", "NONE");
}
