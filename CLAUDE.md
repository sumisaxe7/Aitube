# AItube — Project Context (read this first)

You are building **AItube**, a web platform for **verified, high-craft AI-generated video**. Supply-first: the beta's job is to make AI *creators* choose AItube over YouTube.

## Positioning (the filter for every decision)
"The home for verified, high-craft AI video — where creators are paid fairly and viewers always know what they're watching."
If a feature doesn't serve **verified**, **high-craft**, **paid fairly**, or **always know**, it does not belong in the beta.

## Stack (do not deviate without asking)
- **Next.js (App Router, TypeScript)** — full-stack, web-first, SSR on public video pages for SEO.
- **PostgreSQL + Prisma** — single source of truth. Money/transactions are relational and auditable.
- **NextAuth** for auth.
- **Tailwind CSS** + a small component set (shadcn/ui) for UI.
- **API as contract**: every feature exposes a clean API route so a future mobile app is a client, not a rewrite.

## External services — STUB them behind interfaces (no API keys in this build)
Create a `/lib/services/` folder. Each external dependency is an interface with a `mock` implementation now and a real one later:
- `aiCheck` — "is this actually AI?" (later: Hive/Sensity/Sightengine)
- `moderation` — explicit/violence/deepfake-of-real-person (later: Hive/AWS Rekognition)
- `provenance` — read/write C2PA Content Credentials (later: C2PA SDK)
- `video` — upload/transcode/playback URLs (later: Mux)
- `payments` — subscriptions, tips, payouts (later: Stripe Connect)
- `recommender` — ranking/personalization (later: Recombee/Personalize)
The app MUST run end-to-end with mocks and zero external accounts.

## Beta scope — BUILD these six, nothing else
1. Frictionless **verified upload** + safety pipeline (async) + **AI-Verified / provenance badge**.
2. **Multi-dimensional ratings** (Visual Consistency, Narrative/Script, Audio/Voice) → **Weighted Quality Score**.
3. **Creator monetization** when a creator qualifies: subscriptions (creator-set price) + tips.
4. **Creator analytics dashboard** (views, watch time, rating breakdown, drop-off, geography).
5. **Creator collaboration / joint-development** v1 (co-creator credit, shared revenue split, shared project space).
6. **AI help bot** for creators (upload help, policy, "why was I flagged").

## Explicitly OUT of scope for the beta (do not build)
Credits economy, community chat, full cinematic Netflix homepage, custom embedding recommender, mobile app, paid creator-threshold tiers. Stub a simple curated grid + a "Highly Rated" row instead of the cinematic homepage.

## Safety pipeline is GATING, not garnish
Every upload runs: aiCheck → provenance read → moderation (explicit/violence) → deepfake-of-real-person check → decision (publish / hold-for-review / hard-block). Pre-publish: nothing is visible until it clears. Non-consensual real-person likeness = hard block.

## Working agreement
- Internationalize from day one (externalized strings, Unicode, RTL-ready). Don't hardcode UI text.
- Write tests for the Weighted Quality Score, the safety decision tree, and revenue-split math.
- Keep data split correct: content/profiles/reviews fine in Postgres tables; payments tables must be auditable (immutable ledger rows, never mutate amounts).
- After each phase: run the app, run tests, and report what works end-to-end before moving on.
