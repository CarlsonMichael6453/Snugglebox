import { GAME_NAME, type Tier } from "@/config";

/** Boxes opened before the gentle rating prompt is allowed. */
export const RATING_PROMPT_MIN_PULLS = 10;

/** Minimum time between rating prompts. */
export const RATING_PROMPT_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000;

export const FEEDBACK_PREFS_KEY = "@snugglebox/feedback-prefs/v1";

export const FEEDBACK_MESSAGE_LIMIT = 500;

export type Thumb = "up" | "down";

export type NoteKind = "feedback" | "bug";

export type FeedbackPrefs = {
  lastShownAt: number | null;
  /** True after they send a note or choose Don't ask again. */
  silenced: boolean;
};

export function defaultFeedbackPrefs(): FeedbackPrefs {
  return { lastShownAt: null, silenced: false };
}

export function sanitizeFeedbackPrefs(raw: unknown): FeedbackPrefs {
  if (!raw || typeof raw !== "object") return defaultFeedbackPrefs();
  const saved = raw as { v?: unknown; lastShownAt?: unknown; silenced?: unknown };
  if (saved.v != null && saved.v !== 1) return defaultFeedbackPrefs();
  const last = saved.lastShownAt;
  return {
    lastShownAt: typeof last === "number" && Number.isFinite(last) && last > 0 ? last : null,
    silenced: saved.silenced === true,
  };
}

export function shouldOfferRating(input: {
  tier: Tier;
  totalPulls: number;
  prefs: FeedbackPrefs;
  now: number;
}): boolean {
  if (input.tier !== "epic" && input.tier !== "legendary") return false;
  if (input.totalPulls < RATING_PROMPT_MIN_PULLS) return false;
  if (input.prefs.silenced) return false;
  if (input.prefs.lastShownAt == null) return true;
  return input.now - input.prefs.lastShownAt >= RATING_PROMPT_INTERVAL_MS;
}

export function withPromptShown(prefs: FeedbackPrefs, now: number): FeedbackPrefs {
  return { ...prefs, lastShownAt: now };
}

export function withSilenced(prefs: FeedbackPrefs, now: number): FeedbackPrefs {
  return { lastShownAt: prefs.lastShownAt ?? now, silenced: true };
}

export function feedbackSubject(kind: NoteKind): string {
  return kind === "bug" ? `${GAME_NAME} bug report` : `${GAME_NAME} feedback`;
}

export function optionalEmailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "That email looks a little off.";
  }
  return null;
}

export function canSubmitNote(input: {
  kind: NoteKind;
  thumb: Thumb | null;
  message: string;
  email: string;
}): boolean {
  if (input.thumb == null) return false;
  if (optionalEmailError(input.email)) return false;
  if (input.kind === "bug" && input.message.trim().length === 0) return false;
  return true;
}

export function feedbackBody(input: {
  thumb: Thumb | null;
  message: string;
  email: string;
  version: string;
  device: string;
}): string {
  const rating = input.thumb === "up" ? "Thumbs up" : input.thumb === "down" ? "Thumbs down" : "No rating";
  const reply = input.email.trim() || "(none)";
  const message = input.message.trim() || "(no message)";
  return [
    `Rating: ${rating}`,
    "",
    message,
    "",
    `Reply-to: ${reply}`,
    `Version: ${input.version}`,
    `Device: ${input.device}`,
  ].join("\n");
}

export function buildMailto(address: string, subject: string, body: string): string {
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
