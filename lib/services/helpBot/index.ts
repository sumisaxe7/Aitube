import { selectProvider } from "../factory";
import type { HelpBotService } from "./types";
import { mockHelpBot } from "./mock";
import { claudeHelpBot } from "./claude";

export * from "./types";
export { composeAnswer } from "./compose";

export const helpBot = selectProvider<HelpBotService>("HELPBOT_PROVIDER", {
  mock: () => mockHelpBot,
  claude: () => claudeHelpBot,
});
