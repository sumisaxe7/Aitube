# AItube

The home for **verified, high-craft AI video** — where creators are paid fairly and viewers always
know what they're watching. This is the **beta build**: all six beta features, running entirely on
**mocks + local Postgres** with **zero external API keys**.

## Stack
- **Next.js (App Router, TypeScript)** — SSR public pages for SEO
- **PostgreSQL + Prisma** — single source of truth (payments are an immutable ledger)
- **Tailwind CSS + shadcn/ui**
- **NextAuth (Auth.js v5)** — dev "sign in as a creator" (swap for real OAuth later)
- **Vitest** — pure-logic unit tests (no DB needed)

## Prerequisites
- Node 20+ and npm
- Docker Desktop (for local Postgres)

## Run it
```bash
npm install            # installs deps and runs `prisma generate`
npm run setup          # one command: Postgres (Docker) -> migrate -> seed
npm run dev            # http://localhost:3000
```
> Local Postgres runs on host port **5433** (not 5432) to avoid colliding with a native Postgres.

Seed data: 5 creators, 15 AI videos across genres, ratings, ~2.5k analytics events, monetized
creators, and a demo collaboration. Then **sign in** (top-right → pick a creator) to use the studio.

## The six beta features
1. **Verified upload + gating safety pipeline** — `/upload`. Every upload runs
   `aiCheck → provenance → moderation → real-person deepfake` and lands PUBLISHED / IN_REVIEW / BLOCKED.
   Nothing is viewer-visible until PUBLISHED; non-consensual real-person likeness is a hard block.
   Use the dev "simulate" selector to see each branch. Published videos show the **AI-Verified** badge
   + provenance disclosure on `/watch/[id]`.
2. **Multi-dimensional ratings → Weighted Quality Score** — rate Visual / Narrative / Audio on a video
   page; the home "Highly Rated" row is driven by a Bayesian quality score, not view count.
3. **Creator monetization** — `/studio/monetization`. Qualified creators set a subscription price;
   anyone can tip. Every transaction is an append-only **immutable ledger** row; the platform fee is
   visibly below YouTube's.
4. **Creator analytics** — `/studio/analytics`. Views, watch time, drop-off curve, rating breakdown,
   geography, revenue. Raw events → precomputed daily rollups.
5. **Creator collaboration** — `/studio/collaborations`. Invite a co-creator, accept, set a revenue
   split, share a project space (notes); co-creators show in credits on the video page.
6. **AI help bot** — `/studio/help`. Grounded in the creator's real video statuses + policy; explains
   "why was my video flagged" from the stored pipeline decision.

## Tests
```bash
npm test               # Vitest — 75 tests, no database required
```
Covers the safety **decision tree** (every branch + precedence), the **Weighted Quality Score**
(empty / single / low-volume / tie-break / Bayesian), **revenue split** (conservation + multi-party
no-leakage), **qualification**, **analytics rollups**, **collaboration split**, and **help-bot grounding**.

There is also a live end-to-end script: with the dev server running, `node scripts/e2e-check.mjs`
drives the full creator journey (sign in → upload every pipeline branch → publish → rate → tip → help).

## Service layer (swap a mock for a real provider with one env var)
Every external dependency lives behind an interface in [`lib/services/`](lib/services), selected by an
env var (default `mock`). **Callers never change** — only the env var + a registered provider.

| Service | Env var | Interface | Real provider to wire next |
|---|---|---|---|
| AI-or-not check | `AICHECK_PROVIDER` | [`lib/services/aiCheck`](lib/services/aiCheck) | Hive / Sensity / Sightengine |
| Moderation + deepfake | `MODERATION_PROVIDER` | [`lib/services/moderation`](lib/services/moderation) | Hive Moderation / AWS Rekognition |
| Provenance (C2PA) | `PROVENANCE_PROVIDER` | [`lib/services/provenance`](lib/services/provenance) | C2PA / Content Credentials SDK |
| Video pipeline | `VIDEO_PROVIDER` | [`lib/services/video`](lib/services/video) | Mux |
| Payments | `PAYMENTS_PROVIDER` | [`lib/services/payments`](lib/services/payments) | Stripe Connect ✅ implemented |
| Recommender | `RECOMMENDER_PROVIDER` | [`lib/services/recommender`](lib/services/recommender) | Recombee / Amazon Personalize |
| Help bot LLM | `HELPBOT_PROVIDER` | [`lib/services/helpBot`](lib/services/helpBot) | Claude / any LLM |

## Real payments (Stripe Connect, test mode)

Payments has a real implementation alongside the mock. To enable it:

1. **Get test-mode keys** from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys)
   (toggle "Test mode" on). You don't need a live/verified account for any of this.
2. **Install the SDK** (already in `package.json`): `npm install`
3. **Run the new migration** for the Connect fields added to `CreatorProfile`:
   ```bash
   npx prisma migrate dev --name add_stripe_connect
   ```
4. **Set env vars** in `.env`:
   ```bash
   PAYMENTS_PROVIDER="stripe"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."   # from step 5
   APP_BASE_URL="http://localhost:3000"
   ```
5. **Forward webhooks locally** with the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.
6. **Connect a creator's payout account**: sign in as a creator → `/studio/monetization` →
   "Connect with Stripe". This creates a Stripe Express account and walks through onboarding
   using Stripe's test data (any details work in test mode — use `000 000 0000` for phone,
   `4000 0000 0000 0000` won't be needed here since this is identity onboarding, not a card).
7. **Subscribe / tip as a viewer**: the buttons now redirect to Stripe Checkout. Use test card
   `4242 4242 4242 4242`, any future expiry, any CVC. On success, Stripe redirects back and the
   `checkout.session.completed` webhook writes the `Subscription` + immutable `LedgerEntry` rows
   (the same rows the mock wrote synchronously).
8. **Recurring renewals**: Stripe's `invoice.paid` webhook appends another ledger row each billing
   cycle — trigger one early in test mode from the Stripe dashboard ("Subscriptions" → the test
   subscription → "..." → "Update subscription" → advance the billing cycle, or use
   `stripe trigger invoice.paid`).

Revenue split: `application_fee_percent` / `application_fee_amount` on the Connect charge mirrors
`lib/revenue.computeSplit` exactly, so Stripe itself enforces the same split the ledger records.

To go back to mocks at any time, set `PAYMENTS_PROVIDER="mock"` — no other code changes needed.

## Project layout
```
app/                routes — home, watch, upload, studio/*, creator/[handle], api/*
components/         UI (shadcn primitives + feature components + charts)
lib/services/       7 env-selected service interfaces + mocks
lib/                db, auth, session, i18n, policy, quality, revenue, qualification,
                    collaboration, monetization, pipeline/*, analytics/*
prisma/             schema + seed + migrations
messages/en.json    externalized UI strings (i18n from day one, RTL-ready)
tests/              vitest specs
```

## Useful scripts
| Script | Does |
|---|---|
| `npm run dev` / `build` / `start` | dev / prod build / serve |
| `npm test` | run tests once |
| `npm run db:up` / `db:down` | start / stop Postgres |
| `npm run db:seed` / `db:reset` | re-seed / drop+migrate+seed |
