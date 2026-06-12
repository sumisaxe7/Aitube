import type { HelpBotAnswer, HelpBotContext, HelpVideoContext } from "./types";

function humanStatus(status: string): string {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "IN_REVIEW":
      return "in human review";
    case "BLOCKED":
      return "blocked";
    case "PROCESSING":
      return "still processing";
    default:
      return status.toLowerCase();
  }
}

function summarizeStatuses(videos: HelpVideoContext[]): string {
  const counts = new Map<string, number>();
  for (const v of videos) counts.set(v.status, (counts.get(v.status) ?? 0) + 1);
  const parts = [...counts.entries()].map(
    ([s, n]) => `${n} ${humanStatus(s)}`,
  );
  return parts.length ? parts.join(", ") : "none yet";
}

/**
 * Deterministic, GROUNDED answer composer — the brain of the mock help bot. It
 * never invents state: flag/block answers are built from the focus video's stored
 * pipeline reason + message, so the reply always reflects the real decision. A
 * real LLM provider would receive this same grounded context.
 */
export function composeAnswer(
  question: string,
  ctx: HelpBotContext,
): HelpBotAnswer {
  const q = question.toLowerCase();
  const asksWhy = /(why|flag|block|reject|review|reason|status|appeal)/.test(q);
  const focus =
    ctx.focusVideo ??
    ctx.videos.find((v) => v.status === "BLOCKED") ??
    ctx.videos.find((v) => v.status === "IN_REVIEW") ??
    null;

  if (asksWhy && focus) {
    const citations = [`video:${focus.title}`, "policy"];
    let text = `"${focus.title}" is currently ${humanStatus(focus.status)}. ${focus.reasonMessage}`;
    if (focus.status === "BLOCKED" && focus.reason === "REAL_PERSON_DEEPFAKE") {
      text +=
        " This is our strictest rule (non-consensual real-person likeness) and isn't auto-appealable.";
    } else if (focus.status === "IN_REVIEW") {
      text +=
        " A human reviewer will take a look — nothing more is needed from you right now.";
    } else if (focus.status === "PUBLISHED") {
      text += " You're all set — it passed every check.";
    }
    return { text, citations };
  }

  if (/(upload|publish|how do i|file|format|submit)/.test(q)) {
    return {
      text: `Hi ${ctx.creatorName} — to publish, open Upload, drop your video, add a title and genre, then submit. Every upload runs our verified safety pipeline (AI-or-not → provenance → moderation → real-person deepfake) before going live, and you'll see live status as it processes.`,
      citations: ["policy"],
    };
  }

  if (/(policy|allowed|rules|guidelines|consent|deepfake|explicit|violence)/.test(q)) {
    return { text: ctx.policySummary, citations: ["policy"] };
  }

  return {
    text: `Hi ${ctx.creatorName}. You have ${ctx.videos.length} video${ctx.videos.length === 1 ? "" : "s"}: ${summarizeStatuses(ctx.videos)}. Ask me "why was <video> flagged?", how uploads work, or about our content policy.`,
    citations: [],
  };
}
