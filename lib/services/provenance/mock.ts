import type { ProvenanceRecord, ProvenanceService } from "./types";
import { nowIso, pick } from "../_util";

const GENERATORS = ["OpenAI Sora", "Runway Gen-3", "Google Veo", "Pika", "Kling"];

function credential(generator: string): ProvenanceRecord {
  return {
    hasCredentials: true,
    generator,
    c2pa: [
      {
        label: "c2pa.actions",
        data: { action: "c2pa.created", softwareAgent: generator },
      },
    ],
    signedAt: nowIso(),
  };
}

export const mockProvenance: ProvenanceService = {
  async read() {
    return credential(pick(GENERATORS));
  },
  async write({ generator }) {
    return credential(generator);
  },
};
