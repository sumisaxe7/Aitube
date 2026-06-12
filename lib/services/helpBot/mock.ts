import type { HelpBotService } from "./types";
import { composeAnswer } from "./compose";

// Mock LLM: grounds every answer in the supplied app-state context. A real
// provider (Claude, etc.) would take the same context and question.
export const mockHelpBot: HelpBotService = {
  async answer(input) {
    return composeAnswer(input.question, input.context);
  },
};
