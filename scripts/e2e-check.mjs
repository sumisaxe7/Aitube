// Phase 7 end-to-end check: drives the full creator journey against the live app.
import http from "node:http";

const HOST = "127.0.0.1";
const PORT = 3000;
const cookies = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function setCookies(res) {
  for (const c of res.headers["set-cookie"] ?? []) {
    const [kv] = c.split(";");
    const i = kv.indexOf("=");
    cookies[kv.slice(0, i)] = kv.slice(i + 1);
  }
}
const cookieHeader = () =>
  Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");

function req(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : null;
    const r = http.request(
      {
        host: HOST,
        port: PORT,
        path,
        method,
        headers: {
          ...(data ? { "content-length": Buffer.byteLength(data) } : {}),
          cookie: cookieHeader(),
          ...headers,
        },
      },
      (res) => {
        setCookies(res);
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
      },
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

const json = (r) => {
  try {
    return JSON.parse(r.body);
  } catch {
    return null;
  }
};
let pass = 0;
let fail = 0;
function check(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function signIn(handle) {
  const csrf = json(await req("GET", "/api/auth/csrf"));
  const form = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    handle,
    callbackUrl: `http://${HOST}:${PORT}/studio`,
    json: "true",
  }).toString();
  await req("POST", "/api/auth/callback/dev-creator", form, {
    "content-type": "application/x-www-form-urlencoded",
  });
  return Object.keys(cookies).some((k) => k.includes("session-token"));
}

async function uploadAndWait(simulate) {
  const created = json(
    await req("POST", "/api/uploads", { title: `E2E ${simulate}`, genre: "SCIFI", simulate }),
  );
  const id = created?.videoId;
  if (!id) return null;
  for (let i = 0; i < 50; i++) {
    const s = json(await req("GET", `/api/uploads/${id}`));
    if (s?.processing?.step === "DONE") return { id, status: s };
    await sleep(400);
  }
  return { id, status: null };
}

(async () => {
  console.log("\n== Public home (seeded data via recommender) ==");
  const home = await req("GET", "/");
  check("home 200", home.status === 200);
  check("home shows seeded video", home.body.includes("The Last Orbital Garden"));
  check("home shows AI-Verified badge", home.body.includes("AI-Verified"));

  const recs = json(await req("GET", "/api/recommendations"));
  check("recommender returns highly-rated", recs?.sections?.some((s) => s.id === "highly-rated"));

  console.log("\n== Auth (dev sign-in) ==");
  check("signed in as novaframe", await signIn("novaframe"));

  console.log("\n== Upload + gating pipeline (every branch) ==");
  const clean = await uploadAndWait("clean");
  check("clean -> PUBLISHED", clean?.status?.processing?.decision === "PUBLISH", JSON.stringify(clean?.status?.processing?.decision));
  const review = await uploadAndWait("review");
  check("review -> IN_REVIEW", review?.status?.processing?.decision === "HOLD_FOR_REVIEW");
  const explicit = await uploadAndWait("explicit");
  check("explicit -> BLOCK", explicit?.status?.processing?.decision === "BLOCK");
  const deepfake = await uploadAndWait("deepfake");
  check(
    "deepfake -> hard BLOCK + reason",
    deepfake?.status?.processing?.decision === "BLOCK" &&
      deepfake?.status?.processing?.reason === "REAL_PERSON_DEEPFAKE",
  );

  console.log("\n== Gating: visibility ==");
  const pubWatch = await req("GET", `/watch/${clean.id}`);
  check("published video watchable (200)", pubWatch.status === 200);
  const blockedWatch = await req("GET", `/watch/${deepfake.id}`);
  check("blocked video NOT viewable (404)", blockedWatch.status === 404);

  console.log("\n== Ratings ==");
  const rate = await req("POST", `/api/videos/${clean.id}/rating`, {
    visual: 5,
    narrative: 4,
    audio: 4,
  });
  check("rating accepted", rate.status === 200);
  const badRate = await req("POST", `/api/videos/${clean.id}/rating`, { visual: 9, narrative: 1, audio: 1 });
  check("invalid rating rejected (400)", badRate.status === 400);

  console.log("\n== Monetization (ledger) ==");
  // novaframe is monetized in seed; tip a different creator (inkmotion).
  const tip = await req("POST", "/api/creators/inkmotion/tip", { amountCents: 1000 });
  const tipEntry = json(tip)?.entry;
  check("tip created ledger row", tip.status === 201 && tipEntry);
  check(
    "ledger split conserves money (net+fee=gross)",
    tipEntry && tipEntry.netCents + tipEntry.platformFeeCents === tipEntry.grossCents,
  );
  check("platform fee below 30%", tipEntry && tipEntry.platformFeeCents < tipEntry.grossCents * 0.3);

  console.log("\n== Analytics + collaboration + help bot pages ==");
  check("studio analytics 200", (await req("GET", "/studio/analytics")).status === 200);
  check("studio collaborations 200", (await req("GET", "/studio/collaborations")).status === 200);

  const help = json(
    await req("POST", "/api/help", {
      question: "why was my video blocked?",
      videoId: deepfake.id,
    }),
  );
  check("help bot grounds on real pipeline decision", help?.text?.toLowerCase().includes("blocked"));
  check("help bot cites the focus video", help?.citations?.some((c) => c.startsWith("video:")));

  console.log("\n== Gating: unauthenticated creator pages redirect ==");
  for (const k of Object.keys(cookies)) delete cookies[k]; // sign out
  const upRedirect = await req("GET", "/upload");
  check("upload redirects when signed out", upRedirect.status === 307 || upRedirect.status === 302);

  console.log(`\n==== e2e: ${pass} passed, ${fail} failed ====`);
  process.exit(fail === 0 ? 0 : 1);
})();
