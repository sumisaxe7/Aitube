"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export function PriceForm({
  initialCents,
}: {
  initialCents: number | null;
}) {
  const t = getTranslator(DEFAULT_LOCALE);
  const [price, setPrice] = useState(
    initialCents ? (initialCents / 100).toString() : "5",
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const priceCents = Math.round(parseFloat(price) * 100);
    if (!priceCents || priceCents < 100) {
      setMsg(t("monetize.priceMin"));
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/monetization/price", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ priceCents }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    setMsg(res.ok ? t("monetize.priceSaved") : (data.error ?? t("monetize.error")));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <label className="flex-1 space-y-1">
          <span className="text-sm font-medium">{t("monetize.priceLabel")}</span>
          <div className="relative">
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-md border border-input bg-background py-2 ps-6 pe-3 text-sm"
            />
          </div>
        </label>
        <Button onClick={save} disabled={busy}>
          {t("monetize.savePrice")}
        </Button>
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
