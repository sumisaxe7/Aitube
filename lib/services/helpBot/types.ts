// Creator help bot. Mock now, swappable for a real LLM via HELPBOT_PROVIDER.
export interface HelpVideoContext {
  title: string;
  status: string; // VideoStatus
  reason: string; // BlockReason
  reasonMessage: string; // resolved creator-facing message (from the pipeline)
  aiModel?: string | null;
}

export interface HelpBotContext {
  creatorName: string;
  policySummary: string;
  videos: HelpVideoContext[];
  focusVideo?: HelpVideoContext | null;
}

export interface HelpBotInput {
  question: string;
  context: HelpBotContext;
}

export interface HelpBotAnswer {
  text: string;
  citations: string[];
}

export interface HelpBotService {
  answer(input: HelpBotInput): Promise<HelpBotAnswer>;
}
