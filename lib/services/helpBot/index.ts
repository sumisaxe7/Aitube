import { selectProvider } from "../factory";
import type { HelpBotService } from "./types";
import { mockHelpBot } from "./mock";

export * from "./types";
export { composeAnswer } from "./compose";

export const helpBot = selectProvider<HelpBotService>("HELPBOT_PROVIDER", {
  mock: () => mockHelpBot,
});
