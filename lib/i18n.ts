import en from "@/messages/en.json";

// Lightweight i18n for Phase 0 — all UI strings externalized, RTL-ready. This is
// deliberately small (no routing) but shaped so next-intl can replace it later
// without changing call sites: components use a translator `t("some.key")`.

export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE ?? "en";

const RTL_LOCALES = new Set(["ar", "he", "fa", "ur", "ps", "dv"]);

export type Messages = typeof en;

const CATALOG: Record<string, Messages> = { en };

export function getMessages(locale: string = DEFAULT_LOCALE): Messages {
  return CATALOG[locale] ?? CATALOG.en;
}

export function isRtl(locale: string = DEFAULT_LOCALE): boolean {
  return RTL_LOCALES.has(locale);
}

export function dir(locale: string = DEFAULT_LOCALE): "ltr" | "rtl" {
  return isRtl(locale) ? "rtl" : "ltr";
}

/** Resolve a dotted key path ("home.title") against a messages object. */
export function translate(messages: Messages, key: string): string {
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);
  return typeof value === "string" ? value : key;
}

/** Bind a locale and return a `t(key)` function for components. */
export function getTranslator(locale: string = DEFAULT_LOCALE) {
  const messages = getMessages(locale);
  return (key: string) => translate(messages, key);
}
