import { NextResponse } from "next/server";

import { recommender } from "@/lib/services";
import { DEFAULT_LOCALE } from "@/lib/i18n";

// API-as-contract: the same home feed the web home page renders, as JSON, so a
// future mobile/TV client is a client of this route — not a rewrite (CLAUDE.md).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const locale =
    new URL(request.url).searchParams.get("locale") ?? DEFAULT_LOCALE;
  const sections = await recommender.getHomeFeed({ locale });
  return NextResponse.json({ locale, sections });
}
