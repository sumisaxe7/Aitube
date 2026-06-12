import { describe, expect, it } from "vitest";

import { runSafetyPipeline } from "@/lib/pipeline/run";

// Uses the real (env-selected) mock services, forced via `simulate`. DB-free —
// the orchestrator returns a report without persisting.
describe("runSafetyPipeline with configurable mocks", () => {
  it("clean -> PUBLISH with populated provenance + model snapshots", async () => {
    const r = await runSafetyPipeline({ simulate: "clean" });
    expect(r.decision).toBe("PUBLISH");
    expect(r.reason).toBe("NONE");
    expect(r.ai.isAiGenerated).toBe(true);
    expect(r.ai.detectedModel).toBeTruthy();
    expect(r.provenance.hasCredentials).toBe(true);
    expect(r.provenance.generator).toBeTruthy();
  });

  it("review -> HOLD_FOR_REVIEW / AMBIGUOUS", async () => {
    const r = await runSafetyPipeline({ simulate: "review" });
    expect(r.decision).toBe("HOLD_FOR_REVIEW");
    expect(r.reason).toBe("AMBIGUOUS");
  });

  it("explicit -> BLOCK / EXPLICIT", async () => {
    const r = await runSafetyPipeline({ simulate: "explicit" });
    expect(r.decision).toBe("BLOCK");
    expect(r.reason).toBe("EXPLICIT");
  });

  it("violence -> BLOCK / VIOLENCE", async () => {
    const r = await runSafetyPipeline({ simulate: "violence" });
    expect(r.decision).toBe("BLOCK");
    expect(r.reason).toBe("VIOLENCE");
  });

  it("deepfake -> hard BLOCK with a matched identity", async () => {
    const r = await runSafetyPipeline({ simulate: "deepfake" });
    expect(r.decision).toBe("BLOCK");
    expect(r.reason).toBe("REAL_PERSON_DEEPFAKE");
    expect(r.deepfake.realPersonDeepfake).toBe(true);
    expect(r.deepfake.matchedIdentity).toBeTruthy();
  });

  it("not_ai -> HOLD_FOR_REVIEW / NOT_AI", async () => {
    const r = await runSafetyPipeline({ simulate: "not_ai" });
    expect(r.decision).toBe("HOLD_FOR_REVIEW");
    expect(r.reason).toBe("NOT_AI");
    expect(r.ai.isAiGenerated).toBe(false);
  });
});
