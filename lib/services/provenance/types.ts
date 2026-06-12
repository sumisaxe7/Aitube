// Read/write C2PA Content Credentials. Real later: C2PA SDK.
export interface ProvenanceInput {
  videoId?: string;
  assetUrl?: string;
}

export interface C2paAssertion {
  label: string;
  data: Record<string, unknown>;
}

export interface ProvenanceRecord {
  hasCredentials: boolean;
  generator: string | null; // e.g. "OpenAI Sora"
  c2pa: C2paAssertion[] | null;
  signedAt: string | null;
}

export interface ProvenanceWriteInput {
  videoId: string;
  generator: string;
}

export interface ProvenanceService {
  read(input: ProvenanceInput): Promise<ProvenanceRecord>;
  write(input: ProvenanceWriteInput): Promise<ProvenanceRecord>;
}
