import assert from "node:assert/strict";
import { RATES, PITY_THRESHOLD } from "../config.ts";
import { CREATURES, MOCHI_COLORS, MOCHI_ID } from "../data/creatures.ts";
import { albumStats, canOpenBox, initialState, palsTitle, performPull, sanitizeName, sanitizeState, type GameState } from "./logic.ts";

const FREE_WAIT = 1000;

const rateSum = RATES.reduce((sum, rate) => sum + rate.chance, 0);
assert.equal(Math.round(rateSum * 1000), 1000, "rates must sum to 1");

function zeros(): () => number {
  return () => 0;
}

let state = initialState();
assert.equal(canOpenBox(state, 1_000), true);

for (let i = 0; i < PITY_THRESHOLD - 1; i += 1) {
  const outcome = performPull(state, zeros(), 1_000 + i);
  assert.ok(outcome);
  assert.equal(outcome.presentation.tier, "common");
  assert.equal(outcome.presentation.creatureId, MOCHI_ID);
  assert.equal(outcome.presentation.mochiColorId, "vanilla");
  state = outcome.state;
}
assert.equal(state.pity, PITY_THRESHOLD - 1);

const guaranteed = performPull(state, zeros(), 5_000);
assert.ok(guaranteed);
assert.equal(guaranteed.presentation.pityTriggered, true);
assert.ok(guaranteed.presentation.tier === "epic" || guaranteed.presentation.tier === "legendary");
assert.equal(guaranteed.state.pity, 0);
assert.equal(guaranteed.state.creatures[guaranteed.presentation.creatureId].poses.length > 0, true);

const broke: GameState = { ...initialState(), stardust: 0, lastFreeClaimAt: 0 };
assert.equal(canOpenBox(broke, FREE_WAIT), false);
assert.equal(performPull(broke, zeros(), FREE_WAIT), null);

const freeAgain = performPull(broke, zeros(), broke.lastFreeClaimAt! + 4 * 60 * 60 * 1000);
assert.ok(freeAgain);
assert.equal(freeAgain.presentation.usedFreeBox, true);

const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
let rolling = initialState();
const sample = 8000;
for (let i = 0; i < sample; i += 1) {
  rolling = { ...rolling, stardust: 100_000, lastFreeClaimAt: 1, pity: 0 };
  const outcome = performPull(rolling, Math.random, 10);
  assert.ok(outcome);
  counts[outcome.presentation.tier] += 1;
  if (outcome.presentation.creatureId === MOCHI_ID) {
    assert.ok(outcome.presentation.mochiColorId);
  } else {
    assert.equal(outcome.presentation.mochiColorId, undefined);
  }
}
for (const rate of RATES) {
  const seen = counts[rate.tier] / sample;
  assert.ok(Math.abs(seen - rate.chance) < 0.03, `${rate.tier} ${seen} vs ${rate.chance}`);
}

assert.equal(sanitizeName("  Michael  "), "Michael");
assert.equal(sanitizeName("A   very\nlong name that keeps going past the limit"), "A very long name tha");
assert.equal(sanitizeName(12), "");
assert.equal(palsTitle("Michael"), "Michael's Pals");
const named = sanitizeState({ playerName: "  Pip  ", stardust: 10 });
assert.equal(named.playerName, "Pip");
assert.equal(named.stardust, 10);
const kept = performPull({ ...initialState(), playerName: "Michael" }, zeros(), 1_000);
assert.ok(kept);
assert.equal(kept.state.playerName, "Michael");
assert.equal(initialState().playerName, "");

const discovered = albumStats(guaranteed.state);
assert.ok(discovered.discovered >= 1);
assert.equal(discovered.creatureTotal, CREATURES.length);
assert.equal(discovered.colorTotal, MOCHI_COLORS.length);
console.log("logic ok", counts);
