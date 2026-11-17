import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import type { Tier } from "@/config";

const sources = {
  tap: require("../../assets/sounds/tap.wav"),
  shake: require("../../assets/sounds/shake.wav"),
  pop: require("../../assets/sounds/pop.wav"),
  common: require("../../assets/sounds/common.wav"),
  rare: require("../../assets/sounds/rare.wav"),
  epic: require("../../assets/sounds/epic.wav"),
  legendary: require("../../assets/sounds/legendary.wav"),
  dupe: require("../../assets/sounds/dupe.wav"),
  sparkle: require("../../assets/sounds/sparkle.wav"),
  ui: require("../../assets/sounds/ui.wav"),
} as const;

export type SoundName = keyof typeof sources;

let players: Partial<Record<SoundName, AudioPlayer>> | null = null;
let ready = false;

export async function initFeedback(): Promise<void> {
  if (ready) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    });
    const next: Partial<Record<SoundName, AudioPlayer>> = {};
    for (const name of Object.keys(sources) as SoundName[]) {
      const player = createAudioPlayer(sources[name]);
      player.volume = name === "ui" || name === "tap" ? 0.35 : 0.55;
      next[name] = player;
    }
    players = next;
    ready = true;
  } catch {
    ready = false;
  }
}

export function playSound(name: SoundName, enabled: boolean): void {
  if (!enabled || !players) return;
  const player = players[name];
  if (!player) return;
  try {
    void Promise.resolve(player.seekTo(0))
      .then(() => player.play())
      .catch(() => undefined);
  } catch {
    // Sound is a treat, never a blocker.
  }
}

export async function buzz(
  kind: "light" | "medium" | "success" | "selection",
  enabled: boolean,
): Promise<void> {
  if (!enabled) return;
  try {
    if (kind === "light") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (kind === "medium") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (kind === "success") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else await Haptics.selectionAsync();
  } catch {
    // Web vibration can be unavailable. That's fine.
  }
}

export function revealSound(tier: Tier, duplicate: boolean): SoundName {
  if (duplicate && tier !== "legendary") return "dupe";
  if (tier === "legendary" || tier === "epic") return tier;
  return duplicate ? "dupe" : "sparkle";
}
