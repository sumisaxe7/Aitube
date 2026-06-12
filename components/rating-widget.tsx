"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export interface InitialRating {
  visual: number;
  narrative: number;
  audio: number;
}

const DIMS = [
  { key: "visual", labelKey: "rate.visual" },
  { key: "narrative", labelKey: "rate.narrative" },
  { key: "audio", labelKey: "rate.audio" },
] as const;

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}`}
          onClick={() => onChange(n)}
          className={cn(
            "text-2xl leading-none transition-colors",
            n <= value ? "text-yellow-500" : "text-muted-foreground/40",
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function RatingWidget({
  videoId,
  signedIn,
  initial,
}: {
  videoId: string;
  signedIn: boolean;
  initial: InitialRating | null;
}) {
  const t = getTranslator(DEFAULT_LOCALE);
  const [visual, setVisual] = useState(initial?.visual ?? 0);
  const [narrative, setNarrative] = useState(initial?.narrative ?? 0);
  const [audio, setAudio] = useState(initial?.audio ?? 0);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const setters: Record<string, (n: number) => void> = {
    visual: setVisual,
    narrative: setNarrative,
    audio: setAudio,
  };
  const values: Record<string, number> = { visual, narrative, audio };
  const canSave = [visual, narrative, audio].every((v) => v >= 1);

  async function save() {
    if (!canSave) return;
    setState("saving");
    const res = await fetch(`/api/videos/${videoId}/rating`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visual, narrative, audio }),
    });
    setState(res.ok ? "saved" : "error");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("rate.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!signedIn ? (
          <p className="text-sm text-muted-foreground">
            {t("rate.signInPrompt")}{" "}
            <Link href="/signin" className="font-medium underline">
              {t("nav.signIn")}
            </Link>
          </p>
        ) : (
          <>
            {DIMS.map(({ key, labelKey }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm">{t(labelKey)}</span>
                <Stars value={values[key]} onChange={setters[key]} />
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={save} disabled={!canSave || state === "saving"}>
                {state === "saving" ? t("rate.saving") : t("rate.save")}
              </Button>
              {state === "saved" && (
                <span className="text-sm text-success">{t("rate.saved")}</span>
              )}
              {state === "error" && (
                <span className="text-sm text-destructive">{t("rate.error")}</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
