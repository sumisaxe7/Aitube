"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { cn } from "@/lib/utils";

type Translate = (key: string) => string;

export interface UploadStatusResponse {
  videoId: string;
  title: string;
  videoStatus: string;
  processing: {
    step: string;
    decision: string | null;
    reason: string;
    messageKey: string | null;
    aiModel: string | null;
    provenanceGenerator: string | null;
    provenanceHasCredentials: boolean | null;
  } | null;
}

const STEPS = ["AI_CHECK", "PROVENANCE", "MODERATION", "DEEPFAKE"] as const;
const STEP_KEY: Record<(typeof STEPS)[number], string> = {
  AI_CHECK: "aiCheck",
  PROVENANCE: "provenance",
  MODERATION: "moderation",
  DEEPFAKE: "deepfake",
};

const DECISION_BADGE: Record<string, { variant: "success" | "outline" | "destructive"; key: string }> = {
  PUBLISH: { variant: "success", key: "status.published" },
  HOLD_FOR_REVIEW: { variant: "outline", key: "status.inReview" },
  BLOCK: { variant: "destructive", key: "status.blocked" },
};

export function PipelineStatus({
  status,
  onReset,
  t,
}: {
  status: UploadStatusResponse | null;
  onReset: () => void;
  t: Translate;
}) {
  const step = status?.processing?.step ?? "QUEUED";
  const decision = status?.processing?.decision ?? null;
  const messageKey = status?.processing?.messageKey ?? null;
  const done = step === "DONE";
  const currentIndex = STEPS.indexOf(step as (typeof STEPS)[number]);

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <ol className="space-y-2">
          {STEPS.map((s, i) => {
            const state =
              done || (currentIndex >= 0 && i < currentIndex)
                ? "done"
                : i === currentIndex
                  ? "active"
                  : "pending";
            return (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    state === "done" && "bg-success text-success-foreground",
                    state === "active" &&
                      "animate-pulse bg-primary text-primary-foreground",
                    state === "pending" && "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    state === "pending" && "text-muted-foreground",
                  )}
                >
                  {t(`pipeline.step.${STEP_KEY[s]}`)}
                </span>
              </li>
            );
          })}
        </ol>

        {!done && (
          <p className="text-sm text-muted-foreground">{t("pipeline.running")}</p>
        )}

        {done && decision && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={DECISION_BADGE[decision]?.variant ?? "outline"}>
                {t(DECISION_BADGE[decision]?.key ?? "status.inReview")}
              </Badge>
              {decision === "PUBLISH" && (
                <VerifiedBadge
                  label={t("badge.aiVerified")}
                  title={t("badge.aiVerifiedTitle")}
                  model={status?.processing?.aiModel}
                />
              )}
            </div>
            {messageKey && <p className="text-sm">{t(messageKey)}</p>}
            <div className="flex gap-2">
              {decision === "PUBLISH" && status && (
                <Button asChild size="sm">
                  <Link href={`/watch/${status.videoId}`}>
                    {t("upload.viewVideo")}
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onReset}>
                {t("upload.uploadAnother")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
