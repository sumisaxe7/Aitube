import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles, Upload, LayoutDashboard, Home } from "lucide-react";

import "./globals.css";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";
import { DEFAULT_LOCALE, dir, getTranslator } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "AItube — Verified, high-craft AI video",
  description:
    "The home for verified, high-craft AI video — where creators are paid fairly and viewers always know what they're watching.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = DEFAULT_LOCALE;
  const t = getTranslator(locale);
  const session = await auth();
  const creatorName = session?.user?.name;
  const initials = creatorName
    ? creatorName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : null;

  return (
    <html lang={locale} dir={dir(locale)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="container flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30 transition-all group-hover:bg-primary/30 group-hover:ring-primary/50">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <span className="gradient-text text-lg font-bold tracking-tight">
                  {t("app.name")}
                </span>
              </Link>
              <nav className="hidden items-center gap-1 sm:flex">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <Home className="h-3.5 w-3.5" />
                  {t("nav.home")}
                </Link>
                <Link
                  href="/upload"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t("nav.upload")}
                </Link>
                <Link
                  href="/studio"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {t("nav.studio")}
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {creatorName ? (
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm text-muted-foreground sm:inline">
                    {creatorName}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/40 text-xs font-semibold text-primary">
                    {initials}
                  </div>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    >
                      {t("nav.signOut")}
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/signin"
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:glow"
                >
                  {t("nav.signIn")}
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="border-t border-white/5 py-8">
          <div className="container flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary/60" />
              <span className="gradient-text text-sm font-semibold">AItube</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("footer.builtWith")}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
