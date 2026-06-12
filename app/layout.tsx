import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

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

  return (
    <html lang={locale} dir={dir(locale)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="border-b">
          <div className="container flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-bold tracking-tight">
                {t("app.name")}
              </Link>
              <nav className="hidden items-center gap-4 text-sm sm:flex">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("nav.home")}
                </Link>
                <Link
                  href="/upload"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("nav.upload")}
                </Link>
                <Link
                  href="/studio"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("nav.studio")}
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {creatorName ? (
                <>
                  <span className="hidden text-muted-foreground sm:inline">
                    {creatorName}
                  </span>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {t("nav.signOut")}
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/signin" className="font-medium">
                  {t("nav.signIn")}
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          {t("footer.builtWith")}
        </footer>
      </body>
    </html>
  );
}
