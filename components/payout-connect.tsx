"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export function PayoutConnect({
  enabled,
  onboarded,
  hasAccount,
}: {
  /** PAYMENTS_PROVIDER === "stripe" */
  enabled: boolean;
  onboarded: boolean;
  hasAccount: boolean;
}) {
  const t = getTranslator(DEFAULT_LOCALE);
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  async function connect() {
    setBusy(true);
    const res = await fetch("/api/creators/connect", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm">
          {onboarded ? t("monetize.payoutsConnected") : t("monetize.payoutsNotConnected")}
        </p>
      </div>
      {onboarded ? (
        <Badge variant="success">{t("monetize.payoutsConnected").split("—")[0].trim()}</Badge>
      ) : (
        <Button onClick={connect} disabled={busy} variant="outline">
          {busy
            ? t("monetize.redirecting")
            : hasAccount
              ? t("monetize.continueOnboarding")
              : t("monetize.connectStripe")}
        </Button>
      )}
    </div>
  );
}
