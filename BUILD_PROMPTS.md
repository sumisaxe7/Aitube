# AItube — Build Prompts for Claude Code

Open the `aitube` folder in Claude Code. `CLAUDE.md` is auto-loaded as context, so these prompts stay short and don't re-explain the project. Run phases **in order** — each builds on the last. Using Opus/Fable, so prompts ask for plan-then-build and tests.

**Workflow per phase:** paste the prompt → let it plan → approve → let it build → ask it to run the app + tests → only then move to the next phase.

---

## Phase 0 — Scaffold + service interfaces (foundation)

```
Read CLAUDE.md fully before doing anything.

Scaffold the AItube project: Next.js (App Router, TypeScript), Tailwind, shadcn/ui, Prisma + PostgreSQL, NextAuth. Set up a docker-compose for local Postgres so I can run everything with one command.

Then create /lib/services/ with TypeScript interfaces + mock implementations for: aiCheck, moderation, provenance, video, payments, recommender (per CLAUDE.md). Each mock returns realistic fake data and is selected via env var so I can swap to real later without touching callers.

Create a seed script with: 5 demo creators, 15 AI videos (mix of genres), and sample ratings, so the app has content immediately.

Deliverable: `npm run dev` shows a working home page reading seeded data through the recommender mock; `npm test` passes a smoke test. Plan the file structure first and show me before building.
```

---

## Phase 1 — Verified upload + safety pipeline + provenance badge

```
Build Feature 1: verified upload with the gating safety pipeline.

- Upload UI (drag-drop, progress) that calls the `video` service mock to "store/transcode".
- An async pipeline that runs aiCheck → provenance read → moderation → deepfake-of-real-person check, each via its service mock, producing a status: PUBLISHED / IN_REVIEW / BLOCKED.
- A `ProcessingStatus` model so the creator sees live state of their upload.
- Nothing is viewer-visible until status = PUBLISHED. Non-consensual real-person likeness from the mock = hard BLOCK with a clear creator message.
- Show an "AI-Verified" provenance badge on published videos, surfacing the (mock) detected model + disclosure.

Write unit tests for the decision tree covering every branch (clean, ambiguous→review, explicit→block, real-person deepfake→block). Make the mocks configurable so tests can force each outcome. Plan first.
```

---

## Phase 2 — Multi-dimensional ratings + Weighted Quality Score

```
Build Feature 2: the ratings system.

- Viewers rate three dimensions per video: Visual Consistency, Narrative/Script, Audio/Voice (each 1–5). One rating per user per video, editable.
- Compute a Weighted Quality Score per video. Make the weighting a documented, pure, testable function (not inline). Default weights configurable; explain your default in a comment.
- A "Highly Rated" row on the home page driven by Weighted Quality Score, NOT view count.
- Show the score + per-dimension breakdown on the video page.

Heavily test the scoring function: empty ratings, single rating, tie-breaking, and that low-volume videos aren't unfairly boosted (use a confidence-weighted average, e.g. Bayesian, and justify it). Plan first.
```

---

## Phase 3 — Creator monetization (subscriptions + tips)

```
Build Feature 3: monetization via the `payments` service mock (NO real Stripe yet).

- A creator "qualifies" for monetization at a defined threshold (e.g. N published videos + min Weighted Quality Score) — make the rule a single configurable function.
- Qualified creators set a subscription price; viewers subscribe. Viewers can tip any creator.
- Implement an immutable ledger: every transaction is an append-only row (creator, viewer, type, gross, platform fee, net). NEVER mutate amounts. Platform fee configurable and visibly lower than YouTube's — surface "you keep X%" in the creator UI.
- Revenue-split math must be a pure tested function.

Test: qualification gating, fee math, tip + subscription flows, ledger immutability. Plan first.
```

---

## Phase 4 — Creator analytics dashboard

```
Build Feature 4: the creator analytics dashboard.

- Event ingestion (mock viewer events): view start, watch progress, completion, rating, subscribe, tip, plus a country field.
- Dashboard with: total views, watch time, completion/drop-off curve per video, rating breakdown by dimension, revenue (from the ledger), and geography. Use charts.
- Keep raw events in a table; precompute daily rollups for dashboard speed. Make the rollup a tested function.

Test the rollup/aggregation math against known fixtures. Plan first.
```

---

## Phase 5 — Creator collaboration / joint-development v1

```
Build Feature 5: lightweight creator collaboration.

- A creator can invite another creator as co-creator on a video/project (invite + accept flow).
- Co-creators appear in credits on the video page.
- A configurable revenue split between co-creators that plugs into the existing ledger (reuse the Phase 3 split function — do not duplicate).
- A shared project space: a simple page where co-creators see shared drafts/notes for a collaboration.

Test the multi-party split (must sum to 100%, no rounding leakage). Plan first.
```

---

## Phase 6 — AI help bot for creators

```
Build Feature 6: the creator AI help bot, behind a service interface (mock LLM now, swappable later).

- A chat widget for creators answering: upload help, content policy, and "why was my video flagged/blocked" by reading that video's actual ProcessingStatus + pipeline result.
- Ground answers in real app state (the creator's videos, their statuses, policy doc) — not generic chat.
- Keep the LLM call behind /lib/services/ so I can swap the mock for a real model with one env change.

Test that flag-reason answers correctly reflect the stored pipeline decision. Plan first.
```

---

## Phase 7 — Hardening pass (run before you call the beta done)

```
Do a hardening pass, no new features.

- Verify the full creator journey works end-to-end on seed data: sign up → upload → safety pipeline → publish → get rated → qualify → monetize → see analytics → collaborate → ask the bot.
- Confirm i18n: no hardcoded UI strings, RTL doesn't break layout.
- Confirm the data split: payments are an immutable ledger; no amount is ever mutated.
- Run the whole test suite; add tests for any gap you find in the safety decision tree, scoring, or revenue math.
- Give me a short report: what's solid, what's stubbed, and the exact list of real integrations (Mux, Hive, Stripe, etc.) I'd wire next, with the file/interface each plugs into.
```

---

### Tips for running these with Opus/Fable
- Let it **plan before building** every phase — you'll catch wrong assumptions cheaply.
- If a phase is large, tell it: *"build in steps, pausing after each for me to run it."*
- Keep `CLAUDE.md` open; if it drifts from scope, say *"re-read CLAUDE.md, check this against beta scope."*
- After each phase, commit to git before the next — easy rollback.
