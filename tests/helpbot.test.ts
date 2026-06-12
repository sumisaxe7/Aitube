import { describe, expect, it } from "vitest";

import { composeAnswer } from "@/lib/services/helpBot/compose";
import type { HelpBotContext, HelpVideoContext } from "@/lib/services/helpBot/types";

const base = (focus: HelpVideoContext | null, extra: HelpVideoContext[] = []): HelpBotContext => ({
  creatorName: "NovaFrame Studio",
  policySummary: "POLICY: only AI video, pre-publish safety pipeline, no real-person deepfakes.",
  videos: [...(focus ? [focus] : []), ...extra],
  focusVideo: focus,
});

const blockedDeepfake: HelpVideoContext = {
  title: "Fake Celebrity Ad",
  status: "BLOCKED",
  reason: "REAL_PERSON_DEEPFAKE",
  reasonMessage: "Hard-blocked: this appears to depict a real, identifiable person without consent.",
};

const inReview: HelpVideoContext = {
  title: "Edge Case Clip",
  status: "IN_REVIEW",
  reason: "AMBIGUOUS",
  reasonMessage: "This needs a quick human review before it can be published.",
};

const published: HelpVideoContext = {
  title: "The Last Orbital Garden",
  status: "PUBLISHED",
  reason: "NONE",
  reasonMessage: "Verified and published.",
};

describe("help bot — flag-reason answers reflect the stored pipeline decision", () => {
  it("explains a real-person deepfake hard block using the stored reason", () => {
    const a = composeAnswer("why was my video blocked?", base(blockedDeepfake));
    expect(a.text).toContain(blockedDeepfake.reasonMessage);
    expect(a.text.toLowerCase()).toContain("blocked");
    expect(a.text.toLowerCase()).toContain("appeal");
    expect(a.citations).toContain(`video:${blockedDeepfake.title}`);
  });

  it("explains an in-review video as awaiting human review", () => {
    const a = composeAnswer("what's the status of my upload?", base(inReview));
    expect(a.text).toContain(inReview.reasonMessage);
    expect(a.text.toLowerCase()).toContain("human review");
  });

  it("confirms a published video passed every check", () => {
    const a = composeAnswer("why is this one live?", base(published));
    expect(a.text.toLowerCase()).toContain("published");
    expect(a.text).toContain(published.reasonMessage);
  });

  it("falls back to the worst-status video when no focus is set", () => {
    const ctx = base(null, [published, blockedDeepfake]);
    const a = composeAnswer("why was something flagged?", ctx);
    expect(a.text).toContain(blockedDeepfake.title);
  });
});

describe("help bot — other intents stay grounded", () => {
  it("gives upload help addressed to the creator", () => {
    const a = composeAnswer("how do I upload a video?", base(null, [published]));
    expect(a.text).toContain("NovaFrame Studio");
    expect(a.text.toLowerCase()).toContain("pipeline");
  });

  it("returns the policy summary for policy questions", () => {
    const a = composeAnswer("what content is allowed?", base(null, [published]));
    expect(a.text).toBe(base(null, [published]).policySummary);
  });

  it("summarizes the catalogue as a grounded fallback", () => {
    const a = composeAnswer("hello there", base(null, [published, inReview]));
    expect(a.text).toContain("2 videos");
  });
});
