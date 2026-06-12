import { selectProvider } from "../factory";
import type { ProvenanceService } from "./types";
import { mockProvenance } from "./mock";

export * from "./types";

export const provenance = selectProvider<ProvenanceService>("PROVENANCE_PROVIDER", {
  mock: () => mockProvenance,
});
