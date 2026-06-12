import { selectProvider } from "../factory";
import type { AiCheckService } from "./types";
import { mockAiCheck } from "./mock";

export * from "./types";

export const aiCheck = selectProvider<AiCheckService>("AICHECK_PROVIDER", {
  mock: () => mockAiCheck,
});
