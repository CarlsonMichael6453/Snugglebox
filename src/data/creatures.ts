import type { Tier } from "@/config";

export type Creature = {
  id: string;
  name: string;
  tier: Tier;
  description: string;
};

export type MochiColor = {
  id: string;
  name: string;
  /** Rainbow, Midnight, and Sakura are the rare colors of an otherwise common bun. */
  rare: boolean;
};

export const MOCHI_ID = "mochi-bun";

export const CREATURES: Creature[] = [
  {
    id: "mochi-bun",
    name: "Mochi Bun",
    tier: "common",
    description: "A squishy rice-cake bun who believes every problem is just under-hugged.",
  },
  {
    id: "pip-the-puffling",
    name: "Pip the Puffling",
    tier: "common",
    description: "A pocket puffin who practices flying by flapping very seriously.",
  },
  {
    id: "toastie",
    name: "Toastie",
    tier: "common",
    description: "A corgi loaf, warm in the middle and always ready to be a pillow.",
  },
  {
    id: "hedgy-spud",
    name: "Hedgy Spud",
    tier: "common",
    description: "A potato hedgehog who sprouts a tiny leaf when something feels right.",
  },
  {
    id: "waddlebean",
    name: "Waddlebean",
    tier: "common",
    description: "A penguin in an eggshell hat they have never once explained.",
  },
  {
    id: "nibbles",
    name: "Nibbles",
    tier: "common",
    description: "A hamster with star-stuffed cheeks, saving sparkles for later.",
  },
  {
    id: "puddle-frog",
    name: "Puddle Frog",
    tier: "common",
    description: "Carries a lily-pad umbrella and is never surprised by drizzle.",
  },
  {
    id: "pancake-the-otter",
    name: "Pancake the Otter",
    tier: "common",
    description: "A flat little otter who floats like a perfectly golden pancake.",
  },
  {
    id: "pom-pom",
    name: "Pom Pom",
    tier: "common",
    description: "A living yarn ball who unravels when excited and rewinds when calm.",
  },
  {
    id: "snorfle",
    name: "Snorfle",
    tier: "rare",
    description: "A sleepy puff whose snores come out as tiny polite clouds.",
  },
  {
    id: "mossling",
    name: "Mossling",
    tier: "rare",
    description: "A mossy sprout with a mushroom cap, growing at the speed of naps.",
  },
  {
    id: "bubbles-the-axolotl",
    name: "Bubbles the Axolotl",
    tier: "rare",
    description: "Blows blush-pink bubbles whenever a feeling gets too big.",
  },
  {
    id: "drizzle",
    name: "Drizzle",
    tier: "rare",
    description: "A small raincloud who only cries glitter, and only a little.",
  },
  {
    id: "bramble-bear",
    name: "Bramble Bear",
    tier: "rare",
    description: "A berry-stained bear who keeps getting tangled in their own scarf.",
  },
  {
    id: "teacup-owl",
    name: "Teacup Owl",
    tier: "rare",
    description: "Small enough to nap in a teacup, with eyes like two full moons.",
  },
  {
    id: "squishmallow-seal",
    name: "Squishmallow Seal",
    tier: "rare",
    description: "So round they gave up waddling and took up gentle rolling.",
  },
  {
    id: "marsh-mellow",
    name: "Marsh Mellow",
    tier: "rare",
    description: "A toasted marshmallow camper who lives for one more cozy night.",
  },
  {
    id: "cloudpaw",
    name: "Cloudpaw",
    tier: "epic",
    description: "A cloud kitten whose paws leave foggy little prints behind.",
  },
  {
    id: "fennix",
    name: "Fennix",
    tier: "epic",
    description: "A little fox with a candleflame tail that never burns a thing.",
  },
  {
    id: "lumi",
    name: "Lumi",
    tier: "epic",
    description: "A moon-moth who glows softly, but only after bedtime.",
  },
  {
    id: "frostfluff",
    name: "Frostfluff",
    tier: "epic",
    description: "Keeps a private winter in their scarf and shares the sparkle.",
  },
  {
    id: "shroomkin",
    name: "Shroomkin",
    tier: "epic",
    description: "A mushroom sprite whose cap is dotted like a night of fireflies.",
  },
  {
    id: "glimmerpup",
    name: "Glimmerpup",
    tier: "epic",
    description: "A puppy with a star on their forehead and very good intentions.",
  },
  {
    id: "nebby",
    name: "Nebby",
    tier: "legendary",
    description: "A cosmic cat with a galaxy in their fur and a comet for a tail.",
  },
  {
    id: "goldie-dragonling",
    name: "Goldie Dragonling",
    tier: "legendary",
    description: "A sunshine dragonling who hoards giggles instead of gold.",
  },
];

export const MOCHI_COLORS: MochiColor[] = [
  { id: "vanilla", name: "Vanilla", rare: false },
  { id: "strawberry", name: "Strawberry", rare: false },
  { id: "matcha", name: "Matcha", rare: false },
  { id: "taro", name: "Taro", rare: false },
  { id: "mango", name: "Mango", rare: false },
  { id: "sky", name: "Sky", rare: false },
  { id: "chocolate", name: "Chocolate", rare: false },
  { id: "black-sesame", name: "Black Sesame", rare: false },
  { id: "peach", name: "Peach", rare: false },
  { id: "mint", name: "Mint", rare: false },
  { id: "lavender", name: "Lavender", rare: false },
  { id: "caramel", name: "Caramel", rare: false },
  { id: "cotton-candy", name: "Cotton Candy", rare: false },
  { id: "lemon", name: "Lemon", rare: false },
  { id: "coral", name: "Coral", rare: false },
  { id: "cloudy", name: "Cloudy", rare: false },
  { id: "cookie-dough", name: "Cookie Dough", rare: false },
  { id: "rainbow", name: "Rainbow", rare: true },
  { id: "midnight", name: "Midnight", rare: true },
  { id: "sakura", name: "Sakura", rare: true },
];

export function creatureById(id: string): Creature | undefined {
  return CREATURES.find((creature) => creature.id === id);
}

export function mochiById(id: string): MochiColor | undefined {
  return MOCHI_COLORS.find((color) => color.id === id);
}

export function creaturesInTier(tier: Tier): Creature[] {
  return CREATURES.filter((creature) => creature.tier === tier);
}
