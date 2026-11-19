/**
 * Working title. Alternate name: "Boxie Buddies".
 * Change this one constant to rename the game in the interface.
 */
export const GAME_NAME = "Snugglebox";

export const GAME_TAGLINE = "A little box. A new friend.";

export type Tier = "common" | "rare" | "epic" | "legendary";

export const TIERS: Tier[] = ["common", "rare", "epic", "legendary"];

/** Drop rates. Must add up to 1. Shown in the app. */
export const RATES: { tier: Tier; chance: number }[] = [
  { tier: "common", chance: 0.6 },
  { tier: "rare", chance: 0.28 },
  { tier: "epic", chance: 0.1 },
  { tier: "legendary", chance: 0.02 },
];

/** Pulls without an Epic or Legendary before the next one is guaranteed. */
export const PITY_THRESHOLD = 20;

/** When pity forces a high rarity, this is the chance it is Legendary instead of Epic. */
export const PITY_LEGENDARY_CHANCE = 0.18;

export const BOX_COST = 100;
export const STARTING_STARDUST = 800;
export const FREE_BOX_COOLDOWN_MS = 4 * 60 * 60 * 1000;

/** A little dust on every open, so the box never feels empty-handed. */
export const SPARKLE_DUST = 20;
export const NEW_FRIEND_BONUS = 30;

export const DUPE_STARDUST: Record<Tier, number> = {
  common: 55,
  rare: 120,
  epic: 320,
  legendary: 900,
};

/** Weight of an ordinary Mochi color versus Rainbow, Midnight, and Sakura. */
export const MOCHI_COMMON_WEIGHT = 12;
export const MOCHI_RARE_WEIGHT = 3;

export const TIER_LABEL: Record<Tier, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export const SAVE_KEY = "@snugglebox/save/v1";

/**
 * Where feedback and bug reports are addressed.
 * This is the only destination — the form builds a mailto link to it.
 */
export const FEEDBACK_EMAIL = "bykeh1sy@mail.grokbot.com";
