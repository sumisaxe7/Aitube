// Phase 1 pipeline types. Pure — no imports from services or DB, so decide() and
// its tests stay isolated.

export type PipelineDecision = "PUBLISH" | "HOLD_FOR_REVIEW" | "BLOCK";

// Reason for the decision (covers review reasons too, not only blocks).
export type BlockReason =
  | "NONE"
  | "NOT_AI"
  | "AMBIGUOUS"
  | "EXPLICIT"
  | "VIOLENCE"
  | "REAL_PERSON_DEEPFAKE"
  | "OTHER";

// The minimal signals the decision tree consumes (assembled from service output).
export interface PipelineSignals {
  ai: { isAiGenerated: boolean; confidence: number };
  moderation: { decision: "clean" | "review" | "block"; topCategory: string | null };
  deepfake: { realPersonDeepfake: boolean };
}

export interface PipelineOutcome {
  decision: PipelineDecision;
  reason: BlockReason;
  messageKey: string;
}

// Full report = the outcome plus snapshots of every step (persisted for the badge,
// the watch-page disclosure, and the Phase 6 "why was I flagged" answer).
export interface PipelineReport extends PipelineOutcome {
  ai: { isAiGenerated: boolean; confidence: number; detectedModel: string | null };
  provenance: { hasCredentials: boolean; generator: string | null };
  moderation: { decision: string; topCategory: string | null };
  deepfake: { realPersonDeepfake: boolean; matchedIdentity: string | null };
}
