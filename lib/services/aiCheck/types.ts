import type { SimulateScenario } from "../simulate";

// "Is this actually AI?" — confirms the platform's core premise on every upload.
// Real later: Hive / Sensity / Sightengine.
export interface AiCheckInput {
  videoId?: string;
  assetUrl?: string;
  /** Dev/test only — force the verdict. Real providers ignore it. */
  simulate?: SimulateScenario;
}

export interface AiCheckResult {
  isAiGenerated: boolean;
  confidence: number; // 0..1
  detectedModel: string | null;
  provider: string;
  checkedAt: string; // ISO timestamp
}

export interface AiCheckService {
  analyze(input: AiCheckInput): Promise<AiCheckResult>;
}
