import AsyncStorage from "@react-native-async-storage/async-storage";
import { SAVE_KEY } from "@/config";
import { sanitizeState, type GameState } from "@/game/logic";
import {
  FEEDBACK_PREFS_KEY,
  defaultFeedbackPrefs,
  sanitizeFeedbackPrefs,
  type FeedbackPrefs,
} from "@/game/playerFeedback";

export async function loadGame(): Promise<{ state: GameState; error: string | null }> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return { state: sanitizeState(null), error: null };
    const parsed = JSON.parse(raw) as { v?: number; state?: unknown };
    if (parsed?.v !== 1) return { state: sanitizeState(null), error: null };
    return { state: sanitizeState(parsed.state), error: null };
  } catch {
    return {
      state: sanitizeState(null),
      error: "The saved collection couldn't be read, so this device is starting fresh.",
    };
  }
}

export async function saveGame(state: GameState): Promise<void> {
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, state }));
}

export async function clearGame(): Promise<void> {
  await AsyncStorage.removeItem(SAVE_KEY);
}

export async function loadFeedbackPrefs(): Promise<FeedbackPrefs> {
  try {
    const raw = await AsyncStorage.getItem(FEEDBACK_PREFS_KEY);
    if (!raw) return defaultFeedbackPrefs();
    return sanitizeFeedbackPrefs(JSON.parse(raw));
  } catch {
    return defaultFeedbackPrefs();
  }
}

export async function saveFeedbackPrefs(prefs: FeedbackPrefs): Promise<void> {
  await AsyncStorage.setItem(
    FEEDBACK_PREFS_KEY,
    JSON.stringify({ v: 1, lastShownAt: prefs.lastShownAt, silenced: prefs.silenced }),
  );
}
