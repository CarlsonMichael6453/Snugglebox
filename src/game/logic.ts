import {
  BOX_COST,
  DUPE_STARDUST,
  FREE_BOX_COOLDOWN_MS,
  MOCHI_COMMON_WEIGHT,
  MOCHI_RARE_WEIGHT,
  NEW_FRIEND_BONUS,
  PITY_LEGENDARY_CHANCE,
  PITY_THRESHOLD,
  RATES,
  SPARKLE_DUST,
  STARTING_STARDUST,
  type Tier,
} from "@/config";
import { CREATURES, MOCHI_COLORS, MOCHI_ID, creaturesInTier, mochiById, type MochiColor } from "@/data/creatures";

export type Pose = 1 | 2;

export type CreatureProgress = {
  poses: Pose[];
  pulls: number;
};

export type RecentPull = {
  creatureId: string;
  pose: Pose;
  tier: Tier;
  mochiColorId?: string;
  at: number;
};

export type GameState = {
  stardust: number;
  pity: number;
  totalPulls: number;
  lastFreeClaimAt: number | null;
  creatures: Record<string, CreatureProgress>;
  mochiColors: Record<string, number>;
  recent: RecentPull[];
  fresh: string[];
  soundOn: boolean;
  hapticsOn: boolean;
};

export type Presentation = {
  creatureId: string;
  tier: Tier;
  pose: Pose;
  mochiColorId?: string;
  isNewCreature: boolean;
  isNewPose: boolean;
  isNewColor: boolean;
  stardustGained: number;
  pityTriggered: boolean;
  usedFreeBox: boolean;
  headline: string;
};

export type PullOutcome = {
  state: GameState;
  presentation: Presentation;
};

export function initialState(): GameState {
  return {
    stardust: STARTING_STARDUST,
    pity: 0,
    totalPulls: 0,
    lastFreeClaimAt: null,
    creatures: {},
    mochiColors: {},
    recent: [],
    fresh: [],
    soundOn: true,
    hapticsOn: true,
  };
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeCreatures(value: unknown): Record<string, CreatureProgress> {
  if (!value || typeof value !== "object") return {};
  const next: Record<string, CreatureProgress> = {};
  for (const creature of CREATURES) {
    const entry = (value as Record<string, unknown>)[creature.id];
    if (!entry || typeof entry !== "object") continue;
    const raw = entry as { poses?: unknown; pulls?: unknown };
    const poses = Array.isArray(raw.poses)
      ? raw.poses.filter((pose): pose is Pose => pose === 1 || pose === 2)
      : [];
    const unique = [...new Set(poses)].sort() as Pose[];
    if (unique.length === 0) continue;
    next[creature.id] = {
      poses: unique,
      pulls: Math.max(unique.length, Math.floor(asNumber(raw.pulls, unique.length))),
    };
  }
  return next;
}

function sanitizeColors(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const next: Record<string, number> = {};
  for (const color of MOCHI_COLORS) {
    const count = asNumber((value as Record<string, unknown>)[color.id], 0);
    if (count > 0) next[color.id] = Math.floor(count);
  }
  return next;
}

export function sanitizeState(raw: unknown): GameState {
  const base = initialState();
  if (!raw || typeof raw !== "object") return base;
  const saved = raw as Partial<GameState>;
  return {
    stardust: Math.max(0, Math.floor(asNumber(saved.stardust, base.stardust))),
    pity: Math.max(0, Math.min(PITY_THRESHOLD, Math.floor(asNumber(saved.pity, 0)))),
    totalPulls: Math.max(0, Math.floor(asNumber(saved.totalPulls, 0))),
    lastFreeClaimAt: typeof saved.lastFreeClaimAt === "number" ? saved.lastFreeClaimAt : null,
    creatures: sanitizeCreatures(saved.creatures),
    mochiColors: sanitizeColors(saved.mochiColors),
    recent: Array.isArray(saved.recent) ? saved.recent.slice(0, 12) : [],
    fresh: Array.isArray(saved.fresh) ? saved.fresh.filter((item): item is string => typeof item === "string") : [],
    soundOn: saved.soundOn !== false,
    hapticsOn: saved.hapticsOn !== false,
  };
}

export function freeBoxReady(state: GameState, now: number): boolean {
  if (state.lastFreeClaimAt == null) return true;
  return now - state.lastFreeClaimAt >= FREE_BOX_COOLDOWN_MS;
}

export function msUntilFreeBox(state: GameState, now: number): number {
  if (state.lastFreeClaimAt == null) return 0;
  return Math.max(0, FREE_BOX_COOLDOWN_MS - (now - state.lastFreeClaimAt));
}

export function canOpenBox(state: GameState, now: number): boolean {
  return freeBoxReady(state, now) || state.stardust >= BOX_COST;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export type AlbumStats = {
  discovered: number;
  creatureTotal: number;
  poses: number;
  poseTotal: number;
  colors: number;
  colorTotal: number;
  album: number;
  albumTotal: number;
  percent: number;
};

export function albumStats(state: GameState): AlbumStats {
  const discovered = CREATURES.filter((creature) => (state.creatures[creature.id]?.poses.length ?? 0) > 0).length;
  const poses = CREATURES.reduce((sum, creature) => sum + (state.creatures[creature.id]?.poses.length ?? 0), 0);
  const colors = MOCHI_COLORS.filter((color) => (state.mochiColors[color.id] ?? 0) > 0).length;
  const poseTotal = CREATURES.length * 2;
  const colorTotal = MOCHI_COLORS.length;
  const album = poses + colors;
  const albumTotal = poseTotal + colorTotal;
  return {
    discovered,
    creatureTotal: CREATURES.length,
    poses,
    poseTotal,
    colors,
    colorTotal,
    album,
    albumTotal,
    percent: albumTotal === 0 ? 0 : album / albumTotal,
  };
}

function tierFromRoll(roll: number): Tier {
  let cursor = 0;
  for (const rate of RATES) {
    cursor += rate.chance;
    if (roll < cursor) return rate.tier;
  }
  return "legendary";
}

function pickColor(roll: number): MochiColor {
  const total = MOCHI_COLORS.reduce(
    (sum, color) => sum + (color.rare ? MOCHI_RARE_WEIGHT : MOCHI_COMMON_WEIGHT),
    0,
  );
  let cursor = roll * total;
  for (const color of MOCHI_COLORS) {
    cursor -= color.rare ? MOCHI_RARE_WEIGHT : MOCHI_COMMON_WEIGHT;
    if (cursor < 0) return color;
  }
  return MOCHI_COLORS[MOCHI_COLORS.length - 1];
}

function headlineFor(input: {
  isNewCreature: boolean;
  isNewPose: boolean;
  isNewColor: boolean;
  mochi: boolean;
  pityTriggered: boolean;
}): string {
  if (input.pityTriggered && input.isNewCreature) return "The box kept its promise";
  if (input.isNewCreature) return "New friend!";
  if (input.mochi && input.isNewColor) return "New color!";
  if (input.isNewPose) return "New look!";
  if (input.pityTriggered) return "Pity sparkle";
  return "Already snuggled";
}

export function performPull(state: GameState, rng: () => number, now: number): PullOutcome | null {
  const usedFreeBox = freeBoxReady(state, now);
  if (!usedFreeBox && state.stardust < BOX_COST) return null;

  let tier = tierFromRoll(rng());
  let pityTriggered = false;
  if (state.pity + 1 >= PITY_THRESHOLD && (tier === "common" || tier === "rare")) {
    pityTriggered = true;
    tier = rng() < PITY_LEGENDARY_CHANCE ? "legendary" : "epic";
  }

  const pool = creaturesInTier(tier);
  const creature = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  const pose: Pose = rng() < 0.5 ? 1 : 2;
  const mochiColor = creature.id === MOCHI_ID ? pickColor(rng()) : undefined;

  const previous = state.creatures[creature.id];
  const hadCreature = (previous?.poses.length ?? 0) > 0;
  const hadPose = previous?.poses.includes(pose) ?? false;
  const hadColor = mochiColor ? (state.mochiColors[mochiColor.id] ?? 0) > 0 : false;

  let stardustGained = SPARKLE_DUST;
  if (!hadCreature) stardustGained += NEW_FRIEND_BONUS;
  if (mochiColor) {
    if (hadColor) stardustGained += mochiColor.rare ? DUPE_STARDUST.rare : DUPE_STARDUST.common;
  } else if (hadPose) {
    stardustGained += DUPE_STARDUST[tier];
  }

  const cost = usedFreeBox ? 0 : BOX_COST;
  const poses = [...new Set([...(previous?.poses ?? []), pose])].sort() as Pose[];
  const fresh = [...state.fresh];
  if (!hadCreature) fresh.push(`c:${creature.id}`);
  if (!hadPose) fresh.push(`p:${creature.id}:${pose}`);
  if (mochiColor && !hadColor) fresh.push(`m:${mochiColor.id}`);

  const next: GameState = {
    ...state,
    stardust: state.stardust - cost + stardustGained,
    pity: tier === "epic" || tier === "legendary" ? 0 : state.pity + 1,
    totalPulls: state.totalPulls + 1,
    lastFreeClaimAt: usedFreeBox ? now : state.lastFreeClaimAt,
    creatures: {
      ...state.creatures,
      [creature.id]: { poses, pulls: (previous?.pulls ?? 0) + 1 },
    },
    mochiColors: mochiColor
      ? { ...state.mochiColors, [mochiColor.id]: (state.mochiColors[mochiColor.id] ?? 0) + 1 }
      : state.mochiColors,
    recent: [
      { creatureId: creature.id, pose, tier, mochiColorId: mochiColor?.id, at: now },
      ...state.recent,
    ].slice(0, 12),
    fresh,
  };

  return {
    state: next,
    presentation: {
      creatureId: creature.id,
      tier,
      pose,
      mochiColorId: mochiColor?.id,
      isNewCreature: !hadCreature,
      isNewPose: !hadPose,
      isNewColor: mochiColor ? !hadColor : false,
      stardustGained,
      pityTriggered,
      usedFreeBox,
      headline: headlineFor({
        isNewCreature: !hadCreature,
        isNewPose: !hadPose,
        isNewColor: mochiColor ? !hadColor : false,
        mochi: Boolean(mochiColor),
        pityTriggered,
      }),
    },
  };
}

export function forgetFresh(state: GameState, keys: string[]): GameState {
  if (keys.length === 0) return state;
  const drop = new Set(keys);
  return { ...state, fresh: state.fresh.filter((key) => !drop.has(key)) };
}

export function colorIsRare(id: string | undefined): boolean {
  return id ? (mochiById(id)?.rare ?? false) : false;
}
