import type { ModerationService } from "./types";
import { nowIso, round } from "../_util";

const CATEGORIES = ["explicit", "violence", "gore", "hate", "self_harm", "weapons"];

const cleanScores = () =>
  CATEGORIES.map((category) => ({ category, score: round(Math.random() * 0.05, 4) }));

// Default scan is clean. `simulate` (dev/tests) forces review/block; the deepfake
// check is a separate call so the pipeline has a distinct step for it.
export const mockModeration: ModerationService = {
  async scan(input) {
    const sim = input.simulate;
    if (sim === "explicit" || sim === "violence") {
      return {
        decision: "block",
        categories: CATEGORIES.map((category) => ({
          category,
          score:
            category === sim
              ? round(0.92 + Math.random() * 0.07, 4)
              : round(Math.random() * 0.05, 4),
        })),
        topCategory: sim,
        provider: "mock",
        scannedAt: nowIso(),
      };
    }
    if (sim === "review") {
      return {
        decision: "review",
        categories: CATEGORIES.map((category) => ({
          category,
          score:
            category === "violence"
              ? round(0.45 + Math.random() * 0.1, 4)
              : round(Math.random() * 0.1, 4),
        })),
        topCategory: "violence",
        provider: "mock",
        scannedAt: nowIso(),
      };
    }
    return {
      decision: "clean",
      categories: cleanScores(),
      topCategory: null,
      provider: "mock",
      scannedAt: nowIso(),
    };
  },

  async checkRealPersonDeepfake(input) {
    const hit = input.simulate === "deepfake";
    return {
      realPersonDeepfake: hit,
      matchedIdentity: hit ? "Identified public figure (mock match)" : null,
      provider: "mock",
      checkedAt: nowIso(),
    };
  },
};
