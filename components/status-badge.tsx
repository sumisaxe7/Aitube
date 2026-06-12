import type { VideoStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

type Translate = (key: string) => string;
type Variant = "secondary" | "success" | "destructive" | "outline";

const VARIANT: Record<VideoStatus, Variant> = {
  PROCESSING: "secondary",
  IN_REVIEW: "outline",
  PUBLISHED: "success",
  BLOCKED: "destructive",
};

const KEY: Record<VideoStatus, string> = {
  PROCESSING: "status.processing",
  IN_REVIEW: "status.inReview",
  PUBLISHED: "status.published",
  BLOCKED: "status.blocked",
};

export function StatusBadge({
  status,
  t,
}: {
  status: VideoStatus;
  t: Translate;
}) {
  return <Badge variant={VARIANT[status]}>{t(KEY[status])}</Badge>;
}
