import { selectProvider } from "../factory";
import type { ModerationService } from "./types";
import { mockModeration } from "./mock";

export * from "./types";

export const moderation = selectProvider<ModerationService>("MODERATION_PROVIDER", {
  mock: () => mockModeration,
});
