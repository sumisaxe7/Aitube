import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

// The "AI-Verified" provenance badge — the differentiator viewers see (CLAUDE.md).
// Phase 1 wires it to real pipeline output; here it renders the seeded provenance.
export function VerifiedBadge({
  label,
  title,
  model,
}: {
  label: string;
  title: string;
  model?: string | null;
}) {
  return (
    <Badge variant="success" title={title} className="gap-1">
      <ShieldCheck className="size-3" />
      <span>{model ? `${label} · ${model}` : label}</span>
    </Badge>
  );
}
