import type { SimulateScenario } from "../simulate";

// Pre-publish safety scan. Real later: Hive Moderation / AWS Rekognition.
export type ModerationDecision = "clean" | "review" | "block";

export interface ModerationInput {
  videoId?: string;
  assetUrl?: string;
  /** Dev/test only — force the outcome. Real providers ignore it. */
  simulate?: SimulateScenario;
}

export interface ModerationCategoryScore {
  category: string;
  score: number; // 0..1
}

export interface ModerationResult {
  decision: ModerationDecision;
  categories: ModerationCategoryScore[];
  /** Highest-scoring category when decision is review/block, else null. */
  topCategory: string | null;
  provider: string;
  scannedAt: string;
}

// The highest-risk check — non-consensual likeness of a real, identifiable
// person => hard block (CLAUDE.md). Its own call so it is a distinct pipeline step.
export interface DeepfakeResult {
  realPersonDeepfake: boolean;
  matchedIdentity: string | null;
  provider: string;
  checkedAt: string;
}

export interface ModerationService {
  scan(input: ModerationInput): Promise<ModerationResult>;
  checkRealPersonDeepfake(input: ModerationInput): Promise<DeepfakeResult>;
}
