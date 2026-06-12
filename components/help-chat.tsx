"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

interface Msg {
  role: "user" | "bot";
  text: string;
}

export function HelpChat({
  videos,
  initialVideoId,
}: {
  videos: Array<{ id: string; title: string; status: string }>;
  initialVideoId?: string;
}) {
  const t = getTranslator(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: t("help.greeting") },
  ]);
  const [input, setInput] = useState("");
  const [videoId, setVideoId] = useState(initialVideoId ?? "");
  const [busy, setBusy] = useState(false);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, videoId: videoId || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { text?: string };
      setMessages((m) => [...m, { role: "bot", text: data.text ?? t("help.error") }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: t("help.error") }]);
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            {t("help.focusVideo")}
          </label>
          <select
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("help.noFocus")}</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} ({v.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-md border p-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {m.text}
            </div>
          ))}
          {busy && (
            <div className="text-xs text-muted-foreground">{t("help.thinking")}</div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {[t("help.q1"), t("help.q2"), t("help.q3")].map((qp) => (
            <button
              key={qp}
              onClick={() => ask(qp)}
              className="rounded-full border px-3 py-1 text-xs hover:bg-accent"
            >
              {qp}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask(input);
            }}
            placeholder={t("help.placeholder")}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button onClick={() => ask(input)} disabled={busy}>
            {t("help.send")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
