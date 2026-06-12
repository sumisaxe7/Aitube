import { describe, expect, it } from "vitest";

import { decide } from "@/lib/pipeline/decide";
import { AI_MIN_CONFIDENCE } from "@/lib/policy";
import type { PipelineSignals } from "@/lib/pipeline/types";

// Build signals with clean defaults; override per branch.
function mk(p: {
  ai?: Partial<PipelineSignals["ai"]>;
  moderation?: Partial<PipelineSignals["moderation"]>;
  deepfake?: Partial<PipelineSignals["deepfake"]>;
}): PipelineSignals {
  return {
    ai: { isAiGenerated: true, confidence: 0.95, ...p.ai },
    moderation: { decision: "clean", topCategory: null, ...p.moderation },
    deepfake: { realPersonDeepfake: false, ...p.deepfake },
  };
}

describe("safety decision tree — every branch", () => {
  it("clean AI clip -> PUBLISH / NONE", () => {
    const o = decide(mk({}));
    expect(o.decision).toBe("PUBLISH");
    expect(o.reason).toBe("NONE");
    expect(o.messageKey).toBe("policy.message.published");
  });

  it("ambiguous moderation -> HOLD_FOR_REVIEW / AMBIGUOUS", () => {
    const o = decide(mk({ moderation: { decision: "review", topCategory: "violence" } }));
    expect(o.decision).toBe("HOLD_FOR_REVIEW");
    expect(o.reason).toBe("AMBIGUOUS");
  });

  it("explicit block -> BLOCK / EXPLICIT", () => {
    const o = decide(mk({ moderation: { decision: "block", topCategory: "explicit" } }));
    expect(o.decision).toBe("BLOCK");
    expect(o.reason).toBe("EXPLICIT");
  });

  it("violence block -> BLOCK / VIOLENCE", () => {
    const o = decide(mk({ moderation: { decision: "block", topCategory: "violence" } }));
    expect(o.decision).toBe("BLOCK");
    expect(o.reason).toBe("VIOLENCE");
  });

  it("block with unknown category -> BLOCK / OTHER", () => {
    const o = decide(mk({ moderation: { decision: "block", topCategory: "weapons" } }));
    expect(o.decision).toBe("BLOCK");
    expect(o.reason).toBe("OTHER");
  });

  it("real-person deepfake -> BLOCK / REAL_PERSON_DEEPFAKE", () => {
    const o = decide(mk({ deepfake: { realPersonDeepfake: true } }));
    expect(o.decision).toBe("BLOCK");
    expect(o.reason).toBe("REAL_PERSON_DEEPFAKE");
  });

  it("not AI -> HOLD_FOR_REVIEW / NOT_AI", () => {
    const o = decide(mk({ ai: { isAiGenerated: false, confidence: 0.2 } }));
    expect(o.decision).toBe("HOLD_FOR_REVIEW");
    expect(o.reason).toBe("NOT_AI");
  });
});

describe("safety decision tree — precedence & boundaries", () => {
  it("deepfake outranks an explicit block", () => {
    const o = decide(
      mk({
        deepfake: { realPersonDeepfake: true },
        moderation: { decision: "block", topCategory: "explicit" },
      }),
    );
    expect(o.reason).toBe("REAL_PERSON_DEEPFAKE");
  });

  it("a safety block outranks not-AI (block beats hold)", () => {
    const o = decide(
      mk({
        ai: { isAiGenerated: false, confidence: 0.1 },
        moderation: { decision: "block", topCategory: "explicit" },
      }),
    );
    expect(o.decision).toBe("BLOCK");
    expect(o.reason).toBe("EXPLICIT");
  });

  it("confidence exactly at the threshold publishes", () => {
    const o = decide(mk({ ai: { isAiGenerated: true, confidence: AI_MIN_CONFIDENCE } }));
    expect(o.decision).toBe("PUBLISH");
  });

  it("confidence just below the threshold routes to review", () => {
    const o = decide(mk({ ai: { isAiGenerated: true, confidence: AI_MIN_CONFIDENCE - 0.01 } }));
    expect(o.decision).toBe("HOLD_FOR_REVIEW");
    expect(o.reason).toBe("NOT_AI");
  });

  it("every decision carries a non-empty message key", () => {
    for (const o of [
      decide(mk({})),
      decide(mk({ moderation: { decision: "review", topCategory: null } })),
      decide(mk({ moderation: { decision: "block", topCategory: "explicit" } })),
      decide(mk({ deepfake: { realPersonDeepfake: true } })),
    ]) {
      expect(o.messageKey).toMatch(/^policy\.message\./);
    }
  });
});
