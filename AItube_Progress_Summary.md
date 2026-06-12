# AItube — What We've Built So Far

*Status as of June 2026. Plain-English summary of the beta we just built.*

---

## The one-line version

We built a **working, fully-tested beta of AItube** — a platform for verified, high-craft AI video — that runs end-to-end on a developer's machine using stand-in ("mock") services, with **zero external accounts or API keys required**. All six planned beta features are built, tested, and verified working together as one continuous creator journey.

**What this proves:** the software works. **What it does not yet prove:** that creators want it. That's the next phase, and it's mostly non-coding.

---

## What "done" actually means here

Three independent checks all pass:

- **75 automated tests pass** — covering the logic that must be exactly right (safety decisions, quality math, money math).
- **The production build is clean** — 24 pages/routes, no type errors.
- **A scripted run of the full creator journey passes 21/21 checks** on the live app: sign in → upload → safety check → publish → get rated → earn a tip → see analytics → use the help bot → sign out.

So this isn't a slideshow or a clickable mockup. It's real, running software.

---

## The six features we built

**1. Verified upload + safety pipeline + "AI-Verified" badge.**
A creator uploads a video, and before anyone can see it, it runs through a gated safety check: is it actually AI? does it have provenance/disclosure info? is it explicit or violent? is it a deepfake of a real person? Based on that, the video is either **published**, **held for review**, or **blocked**. A non-consensual deepfake of a real person is a hard block. Nothing is visible to viewers until it clears. Published videos show an "AI-Verified" badge. *This is our trust moat — the thing YouTube can't easily copy.*

**2. Multi-dimensional ratings → Weighted Quality Score.**
Viewers rate three things separately: Visual Consistency, Narrative/Script, and Audio/Voice. These feed a single Quality Score. The "Highly Rated" row on the homepage ranks by **quality, not view count** — so good craft surfaces instead of clickbait. The scoring uses a confidence-weighted (Bayesian) method so a video with two 5-star ratings doesn't unfairly beat one with two hundred.

**3. Creator monetization (subscriptions + tips).**
Once a creator qualifies (enough published videos + a minimum quality score), they can set a subscription price, and viewers can subscribe or tip. Every transaction is recorded in an **immutable ledger** — append-only rows that are never edited — so the money trail is fully auditable. Our platform fee is set lower than YouTube's, and the creator sees "you keep X%" directly. *This is the "paid fairly" promise.*

**4. Creator analytics dashboard.**
Creators see views, watch time, where viewers drop off, the rating breakdown by dimension, revenue, and viewer geography — with charts. Raw events roll up into daily summaries for speed.

**5. Creator collaboration v1.**
A creator can invite another as co-creator, with credits shown on the video and an automatic revenue split between them (reusing the same money-split logic as tips/subscriptions, so there's no rounding leakage). There's a shared project space for collaborators.

**6. AI help bot for creators.**
A chat assistant that answers upload/policy questions and — importantly — explains *"why was my video flagged?"* by reading that specific video's actual safety-check result, not a generic answer.

---

## How it's built (the smart shortcut)

Every hard external service (real AI-detection, video streaming, payments, etc.) is **stubbed behind a clean interface** with a fake version that returns realistic data. This means:

- The whole app runs today with no API keys and no monthly bills.
- When we're ready, we swap each fake for the real one (Mux for video, Hive for AI-detection, Stripe for payouts, etc.) by changing **one setting per service** — the rest of the code doesn't change.

| What it does | Currently | Real version later |
|---|---|---|
| "Is this actually AI?" | mock | Hive / Sensity / Sightengine |
| Moderation + deepfake | mock | Hive / AWS Rekognition |
| Provenance (disclosure) | mock | C2PA SDK |
| Video play/transcode | mock | Mux |
| Payments / payouts | mock | Stripe Connect |
| Recommendations | mock | Recombee / Amazon Personalize |
| Help-bot brain | mock | Claude / any LLM |

**Tech stack:** Next.js (web app), PostgreSQL + Prisma (database), Tailwind (styling). Built for the web first, but with a clean internal API so a future mobile app plugs in without a rewrite. Built multilingual-ready from day one (no hardcoded text; right-to-left layout supported).

---

## Two real bugs we caught (and why that's a good sign)

The hardening pass did its job — it found two genuine defects the normal build missed:

1. A database port collision causing flaky sign-ins (fixed by moving the database port).
2. A subtle web-framework error where translated text was passed incorrectly into certain page components — invisible to the build, caught only by running the live journey (now fixed).

These are exactly the kind of issues that would have embarrassed us in front of the first creator. Better to find them now.

---

## What we deliberately did NOT build

We held the line on scope. None of these were built, on purpose, because there's no point adding them to a platform with no creators yet: the credits/rewards economy, community chat, the full cinematic Netflix-style homepage, a custom recommendation algorithm, a mobile app, and paid creator tiers. Each is a real "later," not a "never."

---

## Honest caveats

- It runs **locally on mocks** — it is not yet deployed to a public URL, and no real video actually streams or real money actually moves yet.
- The safety pipeline currently runs as a simple background process; at real scale it needs a proper queue (noted, not yet needed).
- A few layout details aren't yet pixel-perfect for right-to-left languages (small follow-up).

---

## Where this leaves us

We finished the **product**. We have not yet tested the **thesis** — that creators choose AItube over YouTube. That's the next phase, and it's mostly *not* coding:

1. **Deploy to a live URL** (keep the mocks) so a creator can actually open it.
2. **Un-mock only what a creator would notice is fake** — real video playback (Mux) and the real AI-or-not check first. Save Stripe for when a creator actually wants to get paid.
3. **Recruit 10–15 founding AI creators** and watch them use it. The question that matters: *"Would you post your next video here before YouTube — why or why not?"*
4. **Track one number:** how many creators upload a second video without being prompted.
5. **Then** start the investor conversation — with real creator-retention data as the pitch, not the feature list.

The most common way to waste the next six months is to keep building features for an empty platform. We have the product; now we go get the creators.
