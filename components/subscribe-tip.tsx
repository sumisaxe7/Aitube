"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export function SubscribeTip({
  handle,
  signedIn,
  isSelf,
  canSubscribe,
  priceLabel,
}: {
  handle: string;
  signedIn: boolean;
  isSelf: boolean;
  canSubscribe: boolean;
  priceLabel: string;
}) {
  const t = getTranslator(DEFAULT_LOCALE);
  const [tip, setTip] = useState("5");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isSelf) {
    return (
      <p className="text-xs text-muted-foreground">{t("monetize.selfHint")}</p>
    );
  }
  if (!signedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("monetize.signInPrompt")}{" "}
        <Link href="/signin" className="font-medium underline">
          {t("nav.signIn")}
        </Link>
      </p>
    );
  }

  async function subscribe() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/creators/${handle}/subscribe`, {
      method: "POST",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    setMsg(res.ok ? t("monetize.subscribed") : (data.error ?? t("monetize.error")));
  }

  async function sendTip() {
    const amountCents = Math.round(parseFloat(tip) * 100);
    if (!amountCents || amountCents < 100) {
      setMsg(t("monetize.tipMin"));
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/creators/${handle}/tip`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountCents }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    setMsg(res.ok ? t("monetize.tipped") : (data.error ?? t("monetize.error")));
  }

  return (
    <div className="space-y-3">
      {canSubscribe && (
        <Button onClick={subscribe} disabled={busy} className="w-full">
          {t("monetize.subscribe")} · {priceLabel}
        </Button>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <input
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            inputMode="decimal"
            className="w-full rounded-md border border-input bg-background py-2 pl-6 pr-3 text-sm"
          />
        </div>
        <Button variant="outline" onClick={sendTip} disabled={busy}>
          {t("monetize.tip")}
        </Button>
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
