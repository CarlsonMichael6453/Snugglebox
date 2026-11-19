import assert from "node:assert/strict";
import { FEEDBACK_EMAIL } from "../config.ts";
import {
  RATING_PROMPT_INTERVAL_MS,
  RATING_PROMPT_MIN_PULLS,
  buildMailto,
  canSubmitNote,
  defaultFeedbackPrefs,
  feedbackBody,
  feedbackSubject,
  optionalEmailError,
  sanitizeFeedbackPrefs,
  shouldOfferRating,
  withPromptShown,
  withSilenced,
} from "./playerFeedback.ts";

const day = 24 * 60 * 60 * 1000;
const prefs = defaultFeedbackPrefs();

assert.equal(FEEDBACK_EMAIL, "feedback@example.com");
assert.equal(RATING_PROMPT_MIN_PULLS, 10);
assert.equal(RATING_PROMPT_INTERVAL_MS, 90 * day);

assert.equal(
  shouldOfferRating({ tier: "common", totalPulls: 40, prefs, now: 1_000 }),
  false,
);
assert.equal(
  shouldOfferRating({ tier: "rare", totalPulls: 40, prefs, now: 1_000 }),
  false,
);
assert.equal(
  shouldOfferRating({ tier: "epic", totalPulls: 9, prefs, now: 1_000 }),
  false,
);
assert.equal(
  shouldOfferRating({ tier: "epic", totalPulls: 10, prefs, now: 1_000 }),
  true,
);
assert.equal(
  shouldOfferRating({ tier: "legendary", totalPulls: 10, prefs, now: 1_000 }),
  true,
);

const shown = withPromptShown(prefs, 5_000);
assert.equal(
  shouldOfferRating({ tier: "legendary", totalPulls: 12, prefs: shown, now: 5_000 + 89 * day }),
  false,
);
assert.equal(
  shouldOfferRating({ tier: "epic", totalPulls: 12, prefs: shown, now: 5_000 + 90 * day }),
  true,
);

const quiet = withSilenced(shown, 9_000);
assert.equal(quiet.silenced, true);
assert.equal(quiet.lastShownAt, 5_000);
assert.equal(
  shouldOfferRating({ tier: "legendary", totalPulls: 80, prefs: quiet, now: 5_000 + 400 * day }),
  false,
);

const freshSilence = withSilenced(prefs, 9_000);
assert.equal(freshSilence.lastShownAt, 9_000);

assert.deepEqual(sanitizeFeedbackPrefs(null), prefs);
assert.deepEqual(sanitizeFeedbackPrefs({ v: 2, silenced: true, lastShownAt: 4 }), prefs);
assert.deepEqual(sanitizeFeedbackPrefs({ v: 1, silenced: true, lastShownAt: 4 }), {
  silenced: true,
  lastShownAt: 4,
});
assert.deepEqual(sanitizeFeedbackPrefs({ v: 1, silenced: "yes", lastShownAt: "4" }), {
  silenced: false,
  lastShownAt: null,
});

assert.equal(feedbackSubject("feedback"), "Snugglebox feedback");
assert.equal(feedbackSubject("bug"), "Snugglebox bug report");
assert.equal(optionalEmailError(""), null);
assert.equal(optionalEmailError("  pal@example.com "), null);
assert.ok(optionalEmailError("not-an-email"));

assert.equal(
  canSubmitNote({ kind: "feedback", thumb: null, message: "hi", email: "" }),
  false,
);
assert.equal(
  canSubmitNote({ kind: "feedback", thumb: "up", message: "", email: "" }),
  true,
);
assert.equal(
  canSubmitNote({ kind: "bug", thumb: "down", message: "   ", email: "" }),
  false,
);
assert.equal(
  canSubmitNote({ kind: "bug", thumb: "down", message: "The box froze", email: "pal@example.com" }),
  true,
);
assert.equal(
  canSubmitNote({ kind: "feedback", thumb: "up", message: "yay", email: "nope" }),
  false,
);

const body = feedbackBody({
  thumb: "up",
  message: "The pals are wonderful",
  email: "pal@example.com",
  version: "1.0.0",
  device: "Mozilla/5.0 (test)",
});
assert.match(body, /^Rating: Thumbs up/);
assert.match(body, /The pals are wonderful/);
assert.match(body, /Reply-to: pal@example.com/);
assert.match(body, /Version: 1.0.0/);
assert.match(body, /Device: Mozilla\/5.0 \(test\)/);

const down = feedbackBody({
  thumb: "down",
  message: "",
  email: "  ",
  version: "1.0.0",
  device: "ios 17",
});
assert.match(down, /Rating: Thumbs down/);
assert.match(down, /\(no message\)/);
assert.match(down, /Reply-to: \(none\)/);

const url = buildMailto(FEEDBACK_EMAIL, feedbackSubject("feedback"), body);
assert.ok(url.startsWith(`mailto:${FEEDBACK_EMAIL}?subject=`));
assert.ok(url.includes(encodeURIComponent("Snugglebox feedback")));
assert.ok(url.includes(encodeURIComponent("Rating: Thumbs up")));
assert.ok(url.includes(encodeURIComponent("Reply-to: pal@example.com")));
assert.equal(url.includes("feedback@somewhere-else.com"), false);

const bugUrl = buildMailto(FEEDBACK_EMAIL, feedbackSubject("bug"), body);
assert.ok(bugUrl.includes(encodeURIComponent("Snugglebox bug report")));

console.log("player feedback ok");
