import {
  aiCheck as defaultAiCheck,
  moderation as defaultModeration,
  provenance as defaultProvenance,
} from "@/lib/services";
import type { AiCheckService } from "@/lib/services/aiCheck/types";
import type { ModerationService } from "@/lib/services/moderation/types";
import type { ProvenanceService } from "@/lib/services/provenance/types";
import type { SimulateScenario } from "@/lib/services/simulate";
import { decide } from "./decide";
import type { PipelineReport } from "./types";

export interface PipelineServices {
  aiCheck: AiCheckService;
  moderation: ModerationService;
  provenance: ProvenanceService;
}

export interface RunInput {
  videoId?: string;
  assetUrl?: string;
  simulate?: SimulateScenario;
}

const defaultServices = (): PipelineServices => ({
  aiCheck: defaultAiCheck,
  moderation: defaultModeration,
  provenance: defaultProvenance,
});

/**
 * Runs the four safety steps via the (injectable) service mocks, assembles the
 * signals, and applies the pure `decide` tree. DB-free — the caller persists.
 * Services are injectable so tests can force each outcome.
 */
export async function runSafetyPipeline(
  input: RunInput,
  services: PipelineServices = defaultServices(),
): Promise<PipelineReport> {
  const base = {
    videoId: input.videoId,
    assetUrl: input.assetUrl,
    simulate: input.simulate,
  };

  const ai = await services.aiCheck.analyze(base);
  const prov = await services.provenance.read(base);
  const mod = await services.moderation.scan(base);
  const df = await services.moderation.checkRealPersonDeepfake(base);

  const outcome = decide({
    ai: { isAiGenerated: ai.isAiGenerated, confidence: ai.confidence },
    moderation: { decision: mod.decision, topCategory: mod.topCategory },
    deepfake: { realPersonDeepfake: df.realPersonDeepfake },
  });

  return {
    ...outcome,
    ai: {
      isAiGenerated: ai.isAiGenerated,
      confidence: ai.confidence,
      detectedModel: ai.detectedModel,
    },
    provenance: {
      hasCredentials: prov.hasCredentials,
      generator: prov.generator,
    },
    moderation: { decision: mod.decision, topCategory: mod.topCategory },
    deepfake: {
      realPersonDeepfake: df.realPersonDeepfake,
      matchedIdentity: df.matchedIdentity,
    },
  };
}
