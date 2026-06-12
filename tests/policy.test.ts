import { describe, expect, it } from "vitest";

import { decisionToVideoStatus, reasonToMessageKey } from "@/lib/policy";
import type { BlockReason, PipelineDecision } from "@/lib/pipeline/types";

describe("policy mappings (gap coverage)", () => {
  it("maps every pipeline decision to a video status", () => {
    const cases: Array<[PipelineDecision, string]> = [
      ["PUBLISH", "PUBLISHED"],
      ["HOLD_FOR_REVIEW", "IN_REVIEW"],
      ["BLOCK", "BLOCKED"],
    ];
    for (const [decision, status] of cases) {
      expect(decisionToVideoStatus(decision)).toBe(status);
    }
  });

  it("maps every block/review reason to a policy message key", () => {
    const reasons: BlockReason[] = [
      "NONE",
      "NOT_AI",
      "AMBIGUOUS",
      "EXPLICIT",
      "VIOLENCE",
      "REAL_PERSON_DEEPFAKE",
      "OTHER",
    ];
    for (const reason of reasons) {
      const key = reasonToMessageKey(reason);
      expect(key).toMatch(/^policy\.message\.[a-zA-Z]+$/);
    }
    // distinct reasons should not collide on the same message
    const keys = reasons.map(reasonToMessageKey);
    expect(new Set(keys).size).toBe(reasons.length);
  });
});
