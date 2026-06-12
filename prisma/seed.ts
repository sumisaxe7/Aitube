import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, Genre, type Prisma } from "@prisma/client";
import { weightedQualityScore } from "../lib/quality";
import { qualifiesForMonetization } from "../lib/qualification";
import { computeSplit } from "../lib/revenue";

const COUNTRIES = ["US", "GB", "IN", "DE", "BR", "JP", "CA", "FR", "AU", "NG"];

const prisma = new PrismaClient();
const POSTERS_DIR = path.join(process.cwd(), "public", "posters");

// --- helpers ---------------------------------------------------------------

const randInt = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1));

const clamp1to5 = (n: number) => Math.min(5, Math.max(1, n));

/** Draw an integer rating around a target mean (1..5). */
const ratingAround = (mean: number) =>
  clamp1to5(Math.round(mean + (Math.random() * 2 - 1)));

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    c === "<"
      ? "&lt;"
      : c === ">"
        ? "&gt;"
        : c === "&"
          ? "&amp;"
          : c === "'"
            ? "&apos;"
            : "&quot;",
  );

/** Greedy word-wrap into lines of at most `max` chars. */
function wrap(text: string, max = 20): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line = `${line} ${w}`;
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 3);
}

const GENRE_COLORS: Record<Genre, [string, string]> = {
  SCIFI: ["#0ea5e9", "#1e1b4b"],
  ANIME: ["#f472b6", "#581c87"],
  DOCUMENTARY: ["#10b981", "#064e3b"],
  MUSIC: ["#a855f7", "#1e1b4b"],
  COMEDY: ["#f59e0b", "#7c2d12"],
  FANTASY: ["#8b5cf6", "#2e1065"],
  EDUCATION: ["#3b82f6", "#0c4a6e"],
  ANIMATION: ["#ef4444", "#450a0a"],
};

function posterSvg(title: string, creator: string, genre: Genre): string {
  const [c1, c2] = GENRE_COLORS[genre];
  const lines = wrap(title, 18);
  const startY = 200 - (lines.length - 1) * 26;
  const tspans = lines
    .map(
      (ln, i) =>
        `<tspan x="48" y="${startY + i * 52}">${escapeXml(ln)}</tspan>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <rect width="640" height="360" fill="black" opacity="0.18"/>
  <text x="48" y="64" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" opacity="0.8" letter-spacing="3">${genre}</text>
  <text font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff">${tspans}</text>
  <text x="48" y="312" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" opacity="0.85">${escapeXml(creator)}</text>
</svg>`;
}

// --- seed data -------------------------------------------------------------

const creators = [
  {
    handle: "novaframe",
    displayName: "NovaFrame Studio",
    email: "nova@aitube.local",
    bio: "Cinematic AI sci-fi shorts. Founding creator.",
  },
  {
    handle: "inkmotion",
    displayName: "InkMotion",
    email: "ink@aitube.local",
    bio: "Hand-feel AI anime and animation.",
  },
  {
    handle: "realityalgo",
    displayName: "Reality Algorithm",
    email: "reality@aitube.local",
    bio: "AI documentary and explainers grounded in real science.",
  },
  {
    handle: "synthwave_av",
    displayName: "Synthwave AV",
    email: "synth@aitube.local",
    bio: "Music visualizers and the occasional AI comedy set.",
  },
  {
    handle: "pixelmythos",
    displayName: "Pixel Mythos",
    email: "mythos@aitube.local",
    bio: "Epic AI fantasy worldbuilding.",
  },
] as const;

type SeedVideo = {
  title: string;
  creatorHandle: (typeof creators)[number]["handle"];
  genre: Genre;
  durationSec: number;
  aiModel: string;
  quality: number; // target mean rating 1..5
  description: string;
};

const videos: SeedVideo[] = [
  { title: "The Last Orbital Garden", creatorHandle: "novaframe", genre: Genre.SCIFI, durationSec: 372, aiModel: "OpenAI Sora", quality: 4.7, description: "A lone botanist tends the final greenhouse aboard a dying station." },
  { title: "Echoes of Europa", creatorHandle: "novaframe", genre: Genre.SCIFI, durationSec: 540, aiModel: "Google Veo", quality: 4.2, description: "First contact beneath the ice of Jupiter's moon." },
  { title: "Neon Cartographer", creatorHandle: "novaframe", genre: Genre.SCIFI, durationSec: 268, aiModel: "Runway Gen-3", quality: 3.6, description: "Mapping a city that rewrites itself every night." },

  { title: "Paper Lanterns at Dawn", creatorHandle: "inkmotion", genre: Genre.ANIME, durationSec: 412, aiModel: "Kling", quality: 4.6, description: "A quiet festival morning, told in watercolor light." },
  { title: "The Clockwork Apprentice", creatorHandle: "inkmotion", genre: Genre.ANIMATION, durationSec: 305, aiModel: "Pika", quality: 4.0, description: "An automaton learns to mend more than gears." },
  { title: "Crimson Sakura", creatorHandle: "inkmotion", genre: Genre.ANIME, durationSec: 489, aiModel: "Runway Gen-3", quality: 3.4, description: "A sword, a season, and an unfinished promise." },

  { title: "Deep Time: A Coastline Story", creatorHandle: "realityalgo", genre: Genre.DOCUMENTARY, durationSec: 638, aiModel: "Google Veo", quality: 4.8, description: "Five hundred million years of one shoreline, in twelve minutes." },
  { title: "How Diffusion Dreams", creatorHandle: "realityalgo", genre: Genre.EDUCATION, durationSec: 421, aiModel: "OpenAI Sora", quality: 4.3, description: "What is actually happening inside an image model." },
  { title: "The Vanishing Glaciers", creatorHandle: "realityalgo", genre: Genre.DOCUMENTARY, durationSec: 555, aiModel: "Kling", quality: 3.8, description: "Reconstructed footage of ice that no longer exists." },

  { title: "Midnight Protocol", creatorHandle: "synthwave_av", genre: Genre.MUSIC, durationSec: 233, aiModel: "Luma Dream Machine", quality: 4.1, description: "A driving synthwave visualizer for late commutes." },
  { title: "Retrograde", creatorHandle: "synthwave_av", genre: Genre.MUSIC, durationSec: 198, aiModel: "Pika", quality: 3.9, description: "Slow-burn arpeggios over a dissolving skyline." },
  { title: "AI Stand-up: The Turing Set", creatorHandle: "synthwave_av", genre: Genre.COMEDY, durationSec: 351, aiModel: "Runway Gen-3", quality: 3.2, description: "A generated comic bombs, then kills, then crashes." },

  { title: "The Ember Throne", creatorHandle: "pixelmythos", genre: Genre.FANTASY, durationSec: 600, aiModel: "OpenAI Sora", quality: 4.5, description: "A coronation interrupted by something older than the crown." },
  { title: "Whispers of the Hollow Wood", creatorHandle: "pixelmythos", genre: Genre.FANTASY, durationSec: 444, aiModel: "Google Veo", quality: 4.0, description: "The forest keeps the names of everyone who enters." },
  { title: "Dragonsmith", creatorHandle: "pixelmythos", genre: Genre.FANTASY, durationSec: 377, aiModel: "Kling", quality: 3.7, description: "Forging a blade meant to be swallowed by fire." },
];

async function main() {
  // Idempotent: clear in FK-safe order, then re-seed.
  await prisma.projectNote.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.collaboration.deleteMany();
  await prisma.dailyRollup.deleteMany();
  await prisma.viewerEvent.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.processingStatus.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.video.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.user.deleteMany();

  await mkdir(POSTERS_DIR, { recursive: true });

  // Creators (User + CreatorProfile)
  const creatorIdByHandle = new Map<string, string>();
  for (const c of creators) {
    const user = await prisma.user.create({
      data: {
        name: c.displayName,
        email: c.email,
        role: "CREATOR",
        creatorProfile: {
          create: { handle: c.handle, displayName: c.displayName, bio: c.bio },
        },
      },
      include: { creatorProfile: true },
    });
    creatorIdByHandle.set(c.handle, user.creatorProfile!.id);
  }

  // Viewer pool used as raters (Rating.userId references User).
  const viewerIds: string[] = [];
  for (let i = 1; i <= 25; i++) {
    const u = await prisma.user.create({
      data: { name: `Viewer ${i}`, email: `viewer${i}@aitube.local`, role: "VIEWER" },
    });
    viewerIds.push(u.id);
  }

  // Videos + posters + ratings
  let ratingCount = 0;
  const createdVideos: { id: string; durationSec: number; creatorId: string }[] =
    [];
  for (const v of videos) {
    const filename = `${slugify(v.title)}.svg`;
    await writeFile(
      path.join(POSTERS_DIR, filename),
      posterSvg(v.title, v.creatorHandle, v.genre),
      "utf8",
    );

    const video = await prisma.video.create({
      data: {
        creatorId: creatorIdByHandle.get(v.creatorHandle)!,
        title: v.title,
        description: v.description,
        genre: v.genre,
        status: "PUBLISHED",
        posterUrl: `/posters/${filename}`,
        durationSec: v.durationSec,
        aiModel: v.aiModel,
        provenanceVerified: true,
        publishedAt: new Date(),
      },
    });

    // Random subset of raters, scored around the video's target quality.
    const raters = [...viewerIds]
      .sort(() => Math.random() - 0.5)
      .slice(0, randInt(3, 12));

    const ratings: Prisma.RatingCreateManyInput[] = raters.map((userId) => ({
      videoId: video.id,
      userId,
      visual: ratingAround(v.quality),
      narrative: ratingAround(v.quality),
      audio: ratingAround(v.quality),
    }));
    await prisma.rating.createMany({ data: ratings });
    ratingCount += ratings.length;
    createdVideos.push({
      id: video.id,
      durationSec: v.durationSec,
      creatorId: creatorIdByHandle.get(v.creatorHandle)!,
    });
  }

  // Viewer events for analytics (views, watch-progress, completes) over ~14 days.
  let eventCount = 0;
  const now = Date.now();
  for (const v of createdVideos) {
    const events: Prisma.ViewerEventCreateManyInput[] = [];
    const viewCount = randInt(20, 140);
    for (let i = 0; i < viewCount; i++) {
      const at = new Date(now - randInt(0, 14) * 86_400_000 - randInt(0, 86_400_000));
      const country = COUNTRIES[randInt(0, COUNTRIES.length - 1)];
      events.push({ videoId: v.id, type: "VIEW_START", country, createdAt: at });
      // Furthest position reached this view (biased toward partial watches).
      const frac = Math.min(1, Math.max(0.05, Math.random() ** 0.7));
      const furthest = Math.floor(v.durationSec * frac);
      events.push({
        videoId: v.id,
        type: "WATCH_PROGRESS",
        country,
        positionSec: furthest,
        createdAt: at,
      });
      if (furthest >= v.durationSec * 0.9) {
        events.push({ videoId: v.id, type: "COMPLETE", country, createdAt: at });
      }
    }
    await prisma.viewerEvent.createMany({ data: events });
    eventCount += events.length;
  }

  // Monetization: qualifying creators get a price + a few demo subscriptions/tips.
  let monetizedCreators = 0;
  for (const c of creators) {
    const creatorId = creatorIdByHandle.get(c.handle)!;
    const vids = await prisma.video.findMany({
      where: { creatorId, status: "PUBLISHED" },
      include: { ratings: { select: { visual: true, narrative: true, audio: true } } },
    });
    const topScore = vids.reduce(
      (m, vid) => Math.max(m, weightedQualityScore(vid.ratings).score),
      0,
    );
    const qual = qualifiesForMonetization({
      publishedVideoCount: vids.length,
      topQualityScore: topScore,
    });
    if (!qual.qualified) continue;
    monetizedCreators += 1;

    const priceCents = 500;
    await prisma.creatorProfile.update({
      where: { id: creatorId },
      data: { subscriptionPriceCents: priceCents },
    });
    for (const fan of viewerIds.slice(0, 3)) {
      const split = computeSplit(priceCents);
      await prisma.subscription.upsert({
        where: { creatorId_subscriberUserId: { creatorId, subscriberUserId: fan } },
        create: { creatorId, subscriberUserId: fan, priceCents, status: "ACTIVE" },
        update: { status: "ACTIVE" },
      });
      await prisma.ledgerEntry.create({
        data: { type: "SUBSCRIPTION", creatorId, payerUserId: fan, ...split, note: "Subscription (seed)" },
      });
    }
    const tip = computeSplit(1000);
    await prisma.ledgerEntry.create({
      data: { type: "TIP", creatorId, payerUserId: viewerIds[5], ...tip, note: "Tip (seed)" },
    });
  }

  // Demo collaboration on the first video (NovaFrame + InkMotion, 60/40 split).
  const collabOwner = creatorIdByHandle.get("novaframe")!;
  const collabPartner = creatorIdByHandle.get("inkmotion")!;
  await prisma.collaboration.create({
    data: {
      title: "The Last Orbital Garden — joint cut",
      ownerId: collabOwner,
      videoId: createdVideos[0].id,
      collaborators: {
        create: [
          { creatorId: collabOwner, role: "OWNER", status: "ACCEPTED", sharePct: 60 },
          { creatorId: collabPartner, role: "COCREATOR", status: "ACCEPTED", sharePct: 40 },
        ],
      },
      notes: {
        create: [
          { authorId: collabOwner, body: "Locking the color grade this week — v3 is in the shared drive." },
          { authorId: collabPartner, body: "Re-scored the third act; uploading stems tonight." },
        ],
      },
    },
  });

  console.log(
    `Seeded: ${creators.length} creators, ${viewerIds.length} viewers, ${videos.length} videos, ${ratingCount} ratings, ${eventCount} events, ${monetizedCreators} monetized creators, 1 collaboration.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
