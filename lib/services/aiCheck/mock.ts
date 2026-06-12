import type { AiCheckService } from "./types";
import { nowIso, pick, round } from "../_util";

const MODELS = [
  "OpenAI Sora",
  "Runway Gen-3",
  "Pika",
  "Kling",
  "Google Veo",
  "Luma Dream Machine",
];

// Returns a realistic high-confidence "yes, AI" result. Pass `simulate: "not_ai"`
// (dev/tests) to force a low-confidence, not-AI verdict so the pipeline routes the
// upload to human review.
export const mockAiCheck: AiCheckService = {
  async analyze(input) {
    if (input.simulate === "not_ai") {
      return {
        isAiGenerated: false,
        confidence: round(0.1 + Math.random() * 0.15, 4),
        detectedModel: null,
        provider: "mock",
        checkedAt: nowIso(),
      };
    }
    return {
      isAiGenerated: true,
      confidence: round(0.9 + Math.random() * 0.099, 4),
      detectedModel: pick(MODELS),
      provider: "mock",
      checkedAt: nowIso(),
    };
  },
};
