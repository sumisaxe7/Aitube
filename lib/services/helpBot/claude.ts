import Anthropic from "@anthropic-ai/sdk";
import type { HelpBotService, HelpBotInput, HelpBotAnswer } from "./types";

function buildSystemPrompt(): string {
  return `You are an AI help assistant for AItube, a platform for verified, high-craft AI-generated video. You help creators understand:
- Why their video was flagged, blocked, or is in review
- How to upload and publish videos
- AItube's content policy and safety pipeline

The safety pipeline runs: AI-check → provenance → moderation → deepfake-of-real-person check.
Possible statuses: PUBLISHED (live), PROCESSING (pipeline running), IN_REVIEW (human review needed), BLOCKED (hard-blocked, cannot appeal if REAL_PERSON_DEEPFAKE).

Tone: helpful, concise, factual. Never speculate beyond the grounded context provided. If the status or reason is unknown, say so.`;
}

function buildUserMessage(input: HelpBotInput): string {
  const { question, context } = input;
  const lines: string[] = [];

  lines.push(`Creator: ${context.creatorName}`);
  lines.push(`Total videos: ${context.videos.length}`);

  if (context.focusVideo) {
    const v = context.focusVideo;
    lines.push(`\nFocus video: "${v.title}"`);
    lines.push(`Status: ${v.status}`);
    if (v.reason) lines.push(`Block reason: ${v.reason}`);
    if (v.reasonMessage) lines.push(`Pipeline message: ${v.reasonMessage}`);
    if (v.aiModel) lines.push(`AI model: ${v.aiModel}`);
  }

  if (context.videos.length > 0) {
    lines.push(`\nAll videos:`);
    for (const v of context.videos) {
      lines.push(`- "${v.title}" — ${v.status}${v.reason ? ` (${v.reason})` : ""}`);
    }
  }

  lines.push(`\nPolicy summary:\n${context.policySummary}`);
  lines.push(`\nCreator question: ${question}`);

  return lines.join("\n");
}

function extractCitations(text: string, input: HelpBotInput): string[] {
  const citations: string[] = [];
  if (
    /policy|rules|guideline|pipeline|deepfake|moderation|provenance/i.test(text)
  ) {
    citations.push("policy");
  }
  if (input.context.focusVideo) {
    citations.push(`video:${input.context.focusVideo.title}`);
  }
  return citations;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set. Set it to use HELPBOT_PROVIDER=\"claude\".");
  return new Anthropic({ apiKey });
}

export const claudeHelpBot: HelpBotService = {
  async answer(input: HelpBotInput): Promise<HelpBotAnswer> {
    const client = getClient();

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserMessage(input) }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "Sorry, I couldn't generate a response.";

    return {
      text,
      citations: extractCitations(text, input),
    };
  },
};
