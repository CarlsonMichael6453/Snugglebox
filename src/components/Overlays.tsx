import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import {
  BOX_COST,
  DUPE_STARDUST,
  GAME_NAME,
  MOCHI_COMMON_WEIGHT,
  MOCHI_RARE_WEIGHT,
  PITY_THRESHOLD,
  RATES,
  TIER_LABEL,
  TIERS,
} from "@/config";
import { MOCHI_COLORS, creatureById, mochiById } from "@/data/creatures";
import { canOpenBox, type Pose } from "@/game/logic";
import { CreatureArt } from "@/components/CreatureArt";
import { useGame, useType } from "@/state/GameContext";
import { colors, tierStyle } from "@/theme";

function Scrim({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <View style={styles.scrim}>
      <Pressable style={styles.scrimHit} onPress={onClose} accessibilityLabel="Close" />
      {children}
    </View>
  );
}

export function GameOverlays() {
  const game = useGame();
  return (
    <>
      {game.phase === "reveal" && game.presentation ? <RevealCard /> : null}
      {game.overlay?.kind === "detail" ? <DetailSheet creatureId={game.overlay.creatureId} /> : null}
      {game.overlay?.kind === "color" ? <ColorSheet colorId={game.overlay.colorId} /> : null}
      {game.overlay?.kind === "settings" ? <SettingsSheet /> : null}
      {game.overlay?.kind === "rates" ? <RatesSheet /> : null}
      {game.overlay?.kind === "reset" ? <ResetSheet /> : null}
    </>
  );
}

function RevealCard() {
  const game = useGame();
  const type = useType();
  const card = game.presentation;
  if (!card) return null;
  const creature = creatureById(card.creatureId);
  const color = card.mochiColorId ? mochiById(card.mochiColorId) : undefined;
  const style = tierStyle[card.tier];
  const duplicate = !card.isNewCreature && !card.isNewPose && !card.isNewColor;
  const affordable = canOpenBox(game.state, game.now);

  return (
    <View style={styles.scrim}>
      <View style={[styles.reveal, { borderColor: style.glow }]}>
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
          <Text style={[styles.badgeText, { color: style.fg, fontFamily: type.strong }]}>{TIER_LABEL[card.tier]}</Text>
        </View>
        <CreatureArt
          creatureId={card.creatureId}
          pose={card.pose}
          colorId={card.mochiColorId}
          style={styles.revealArt}
        />
        <Text style={[styles.revealName, { fontFamily: type.display }]}>{creature?.name}</Text>
        {color ? <Text style={[styles.colorName, { fontFamily: type.strong }]}>{color.name}{color.rare ? "  ✦" : ""}</Text> : null}
        <Text style={[styles.description, { fontFamily: type.body }]}>{creature?.description}</Text>
        <Text style={[styles.look, { fontFamily: type.body }]}>
          {card.mochiColorId ? `Look ${card.pose} saved in the dex` : `Look ${card.pose} of 2`}
        </Text>
        <View style={[styles.banner, { backgroundColor: duplicate ? "#FFF4D2" : "#E7F2E6" }]}>
          <Text style={[styles.bannerText, { fontFamily: type.strong, color: duplicate ? "#8A5A00" : "#3E6B4A" }]}>
            {card.headline}   ✦ +{card.stardustGained}
          </Text>
        </View>
        <View style={styles.revealActions}>
          <Pressable style={styles.secondary} onPress={game.dismissReveal}>
            <Text style={[styles.secondaryText, { fontFamily: type.strong }]}>Sweet</Text>
          </Pressable>
          <Pressable
            style={[styles.primary, !affordable && styles.ctaOff]}
            disabled={!affordable}
            onPress={game.openAnother}
          >
            <Text style={[styles.primaryText, { fontFamily: type.display }]}>
              {affordable ? "Open another" : `Need ✦ ${BOX_COST}`}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function DetailSheet({ creatureId }: { creatureId: string }) {
  const game = useGame();
  const type = useType();
  const creature = creatureById(creatureId);
  const progress = game.state.creatures[creatureId];
  const [pose, setPose] = useState<Pose>(progress?.poses.includes(1) ? 1 : 2);
  if (!creature || !progress) return null;
  const owned = progress.poses.includes(pose);
  const palette = tierStyle[creature.tier];

  return (
    <Scrim onClose={() => game.setOverlay(null)}>
      <View style={styles.sheet}>
        <View style={[styles.badge, { backgroundColor: palette.bg, alignSelf: "flex-start" }]}>
          <Text style={[styles.badgeText, { color: palette.fg, fontFamily: type.strong }]}>{TIER_LABEL[creature.tier]}</Text>
        </View>
        <CreatureArt creatureId={creature.id} pose={pose} locked={!owned} style={styles.detailArt} />
        <View style={styles.poseRow}>
          {([1, 2] as Pose[]).map((look) => (
            <Pressable key={look} onPress={() => setPose(look)} style={[styles.poseButton, pose === look && styles.poseButtonOn]}>
              <Text style={[styles.poseText, { fontFamily: type.body }]}>
                Look {look}
                {progress.poses.includes(look) ? "" : " · hidden"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.revealName, { fontFamily: type.display }]}>{creature.name}</Text>
        <Text style={[styles.description, { fontFamily: type.body }]}>{creature.description}</Text>
        <Text style={[styles.look, { fontFamily: type.body }]}>Found {progress.pulls} {progress.pulls === 1 ? "time" : "times"}</Text>
        {creature.id === "mochi-bun" ? (
          <View style={styles.colorWrap}>
            {MOCHI_COLORS.map((color) => {
              const count = game.state.mochiColors[color.id] ?? 0;
              return (
                <View key={color.id} style={styles.mini}>
                  <CreatureArt colorId={color.id} locked={count === 0} style={styles.miniArt} />
                </View>
              );
            })}
          </View>
        ) : null}
        <Pressable style={styles.primary} onPress={() => game.setOverlay(null)}>
          <Text style={[styles.primaryText, { fontFamily: type.display }]}>Close</Text>
        </Pressable>
      </View>
    </Scrim>
  );
}

function ColorSheet({ colorId }: { colorId: string }) {
  const game = useGame();
  const type = useType();
  const color = mochiById(colorId);
  const count = game.state.mochiColors[colorId] ?? 0;
  if (!color || count === 0) return null;
  return (
    <Scrim onClose={() => game.setOverlay(null)}>
      <View style={styles.sheet}>
        <CreatureArt colorId={color.id} style={styles.detailArt} />
        <Text style={[styles.revealName, { fontFamily: type.display }]}>{color.name} Mochi</Text>
        <Text style={[styles.description, { fontFamily: type.body }]}>
          {color.rare ? "A rare bake of Mochi Bun." : "One of Mochi Bun's everyday colors."} Found {count}{" "}
          {count === 1 ? "time" : "times"}.
        </Text>
        <Pressable style={styles.primary} onPress={() => game.setOverlay(null)}>
          <Text style={[styles.primaryText, { fontFamily: type.display }]}>Close</Text>
        </Pressable>
      </View>
    </Scrim>
  );
}

function SettingsSheet() {
  const game = useGame();
  const type = useType();
  return (
    <Scrim onClose={() => game.setOverlay(null)}>
      <View style={styles.sheet}>
        <Text style={[styles.revealName, { fontFamily: type.display }]}>Settings</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { fontFamily: type.body }]}>Sound</Text>
          <Switch value={game.state.soundOn} onValueChange={game.setSound} trackColor={{ true: colors.coral, false: "#E4D3C2" }} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { fontFamily: type.body }]}>Haptics</Text>
          <Switch value={game.state.hapticsOn} onValueChange={game.setHaptics} trackColor={{ true: colors.coral, false: "#E4D3C2" }} />
        </View>
        <Text style={[styles.description, { fontFamily: type.body }]}>
          {GAME_NAME} keeps everything on this device. Rename the game in src/config.ts.
        </Text>
        <Pressable style={styles.danger} onPress={() => game.setOverlay({ kind: "reset" })}>
          <Text style={[styles.dangerText, { fontFamily: type.strong }]}>Reset collection</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => game.setOverlay(null)}>
          <Text style={[styles.secondaryText, { fontFamily: type.strong }]}>Done</Text>
        </Pressable>
      </View>
    </Scrim>
  );
}

function RatesSheet() {
  const game = useGame();
  const type = useType();
  const rareShare = MOCHI_RARE_WEIGHT / (MOCHI_COMMON_WEIGHT * 17 + MOCHI_RARE_WEIGHT * 3);
  return (
    <Scrim onClose={() => game.setOverlay(null)}>
      <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheet}>
        <Text style={[styles.revealName, { fontFamily: type.display }]}>Drop rates</Text>
        <Text style={[styles.description, { fontFamily: type.body }]}>
          A box costs ✦ {BOX_COST}. Every open also sprinkles a little stardust, and a duplicate pays more.
        </Text>
        {RATES.map((rate) => (
          <View key={rate.tier} style={styles.rateRow}>
            <Text style={[styles.rateLabel, { fontFamily: type.strong, color: tierStyle[rate.tier].fg }]}>
              {TIER_LABEL[rate.tier]}
            </Text>
            <View style={styles.rateTrack}>
              <View style={[styles.rateFill, { width: `${rate.chance * 100}%`, backgroundColor: tierStyle[rate.tier].glow }]} />
            </View>
            <Text style={[styles.ratePct, { fontFamily: type.body }]}>{Math.round(rate.chance * 100)}%</Text>
          </View>
        ))}
        <Text style={[styles.description, { fontFamily: type.body }]}>
          After {PITY_THRESHOLD} opens without an Epic or Legendary, the next box promises one. Each Mochi Bun also rolls a
          color. Rainbow, Midnight, and Sakura are about {Math.round(rareShare * 1000) / 10}% each.
        </Text>
        <Text style={[styles.look, { fontFamily: type.body }]}>Duplicate stardust</Text>
        {TIERS.map((tier) => (
          <Text key={tier} style={[styles.rateLine, { fontFamily: type.body }]}>
            {TIER_LABEL[tier]} duplicate · ✦ {DUPE_STARDUST[tier]}
          </Text>
        ))}
        <Pressable style={styles.primary} onPress={() => game.setOverlay(null)}>
          <Text style={[styles.primaryText, { fontFamily: type.display }]}>Got it</Text>
        </Pressable>
      </ScrollView>
    </Scrim>
  );
}

function ResetSheet() {
  const game = useGame();
  const type = useType();
  return (
    <Scrim>
      <View style={styles.sheet}>
        <Text style={[styles.revealName, { fontFamily: type.display }]}>Send every friend home?</Text>
        <Text style={[styles.description, { fontFamily: type.body }]}>
          This clears the collection, stardust, pity, and the free-box timer. Handy for testing.
        </Text>
        <Pressable style={styles.danger} onPress={game.resetGame}>
          <Text style={[styles.dangerText, { fontFamily: type.strong }]}>Reset</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => game.setOverlay({ kind: "settings" })}>
          <Text style={[styles.secondaryText, { fontFamily: type.strong }]}>Keep them</Text>
        </Pressable>
      </View>
    </Scrim>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(74, 49, 40, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 20,
  },
  scrimHit: { ...StyleSheet.absoluteFill },
  reveal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 3,
    padding: 18,
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 18,
  },
  sheetScroll: { width: "100%", maxWidth: 440, maxHeight: "86%" },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, letterSpacing: 0.4 },
  revealArt: { width: 220, height: 220, marginTop: 6 },
  detailArt: { width: 200, height: 200, alignSelf: "center" },
  revealName: { color: colors.ink, fontSize: 30, textAlign: "center", marginTop: 4 },
  colorName: { color: colors.coralDeep, fontSize: 16, marginTop: 2 },
  description: { color: colors.inkSoft, fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 21 },
  look: { color: colors.ink, fontSize: 13, marginTop: 8 },
  banner: { marginTop: 12, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bannerText: { fontSize: 15 },
  revealActions: { flexDirection: "row", gap: 10, marginTop: 16, width: "100%" },
  primary: {
    flex: 1,
    backgroundColor: colors.coralDeep,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  primaryText: { color: "#FFFCF8", fontSize: 18 },
  ctaOff: { opacity: 0.55 },
  secondary: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F6EFE6",
    marginTop: 12,
  },
  secondaryText: { color: colors.ink, fontSize: 16 },
  danger: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F8D7DC",
    marginTop: 12,
  },
  dangerText: { color: "#8E3A4A", fontSize: 16 },
  poseRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 8 },
  poseButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#F6EFE6" },
  poseButtonOn: { backgroundColor: "#F8D0D8" },
  poseText: { color: colors.ink, fontSize: 13 },
  colorWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 12 },
  mini: { width: 42, height: 42 },
  miniArt: { width: 42, height: 42 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  rowLabel: { color: colors.ink, fontSize: 16 },
  rateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  rateLabel: { width: 88, fontSize: 14 },
  rateTrack: { flex: 1, height: 8, borderRadius: 8, backgroundColor: "#F3E6D4", overflow: "hidden" },
  rateFill: { height: 8 },
  ratePct: { width: 40, textAlign: "right", color: colors.ink },
  rateLine: { color: colors.ink, fontSize: 14, marginTop: 4 },
});
