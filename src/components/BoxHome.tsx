import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BOX_COST, PITY_THRESHOLD, RATES, TIER_LABEL } from "@/config";
import { creatureById } from "@/data/creatures";
import { canOpenBox, formatDuration, freeBoxReady, msUntilFreeBox } from "@/game/logic";
import { CreatureArt } from "@/components/CreatureArt";
import { MysteryBox } from "@/components/MysteryBox";
import { TopBar } from "@/components/TopBar";
import { useGame, useType } from "@/state/GameContext";
import { colors, tierStyle, useWide } from "@/theme";
import { CollectionPane } from "@/components/CollectionPane";

export function BoxHome() {
  const game = useGame();
  const type = useType();
  const wide = useWide();
  const ready = freeBoxReady(game.state, game.now);
  const affordable = canOpenBox(game.state, game.now);
  const busy = game.phase === "shake" || game.phase === "pop";
  const pityRatio = Math.min(1, game.state.pity / PITY_THRESHOLD);
  const wait = msUntilFreeBox(game.state, game.now);

  const stage = (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {game.saveError ? <Text style={[styles.banner, { fontFamily: type.body }]}>{game.saveError}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => game.setOverlay({ kind: "rates" })} style={styles.pityCard}>
        <View style={styles.pityLabelRow}>
          <Text style={[styles.pityLabel, { fontFamily: type.body }]}>Epic pity</Text>
          <Text style={[styles.pityCount, { fontFamily: type.strong }]}>
            {game.state.pity}/{PITY_THRESHOLD}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pityRatio * 100}%` }]} />
        </View>
        <Text style={[styles.pityHint, { fontFamily: type.body }]}>
          {game.state.pity >= PITY_THRESHOLD - 5 ? "The box is humming." : "An Epic is promised if the sparkle runs out."}
        </Text>
      </Pressable>

      <MysteryBox
        phase={game.phase}
        tier={game.presentation?.tier ?? null}
        disabled={game.phase === "idle" && !affordable}
        onPress={() => {
          if (game.phase === "shake" || game.phase === "pop") game.skipAnimation();
          else if (!affordable) game.setOverlay({ kind: "rates" });
          else game.openBox();
        }}
      />

      <Pressable
        accessibilityRole="button"
        disabled={game.phase === "idle" && !affordable}
        onPress={() => (game.phase === "shake" || game.phase === "pop" ? game.skipAnimation() : game.openBox())}
        style={[styles.cta, game.phase === "idle" && !affordable ? styles.ctaDisabled : null, ready && game.phase === "idle" && styles.ctaFree]}
      >
        <Text style={[styles.ctaText, { fontFamily: type.display }]}>
          {busy ? "Opening…" : game.phase === "shake" || game.phase === "pop" ? "Skip" : ready ? "Open a free box" : affordable ? `Open  ·  ✦ ${BOX_COST}` : `Need ✦ ${BOX_COST}`}
        </Text>
      </Pressable>
      <Text style={[styles.helper, { fontFamily: type.body }]}>
        {busy
          ? "Tap to skip the wiggle."
          : ready
            ? "This one is on the house."
            : affordable
              ? `Next free box in ${formatDuration(wait)}`
              : `Duplicates turn into stardust. Free box in ${formatDuration(wait)}.`}
      </Text>

      <Pressable onPress={() => game.setOverlay({ kind: "rates" })} style={styles.odds}>
        <Text style={[styles.oddsText, { fontFamily: type.body }]}>
          {RATES.map((rate) => `${Math.round(rate.chance * 100)}% ${TIER_LABEL[rate.tier].toLowerCase()}`).join("  ·  ")}
        </Text>
      </Pressable>

      {game.state.recent.length > 0 ? (
        <View style={styles.recent}>
          <Text style={[styles.recentLabel, { fontFamily: type.body }]}>Just met</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
            {game.state.recent.map((pull, index) => {
              const creature = creatureById(pull.creatureId);
              return (
                <Pressable
                  key={`${pull.at}-${index}`}
                  onPress={() => game.setOverlay({ kind: "detail", creatureId: pull.creatureId })}
                  style={[styles.recentChip, { borderColor: tierStyle[pull.tier].glow }]}
                >
                  <CreatureArt
                    creatureId={pull.creatureId}
                    pose={pull.pose}
                    colorId={pull.mochiColorId}
                    style={styles.recentArt}
                  />
                  <Text numberOfLines={1} style={[styles.recentName, { fontFamily: type.body }]}>
                    {creature?.name ?? "Friend"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <Text style={[styles.emptyHint, { fontFamily: type.body }]}>No friends yet. The box is waiting.</Text>
      )}
    </ScrollView>
  );

  if (wide) {
    return (
      <View style={styles.wide}>
        <TopBar />
        <View style={styles.wideRow}>
          <View style={styles.wideBox}>{stage}</View>
          <View style={styles.wideDex}>
            <CollectionPane showHeader={false} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar />
      {stage}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  wide: { flex: 1, backgroundColor: colors.bg },
  wideRow: { flex: 1, flexDirection: "row" },
  wideBox: { flex: 1.15, minWidth: 0 },
  wideDex: { width: 440, borderLeftWidth: 1, borderLeftColor: colors.line, backgroundColor: "#FFF9F3" },
  scroll: { paddingHorizontal: 20, paddingBottom: 28, alignItems: "stretch" },
  banner: {
    backgroundColor: "#FFF1D6",
    color: colors.ink,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  pityCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 8,
  },
  pityLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  pityLabel: { color: colors.inkSoft, fontSize: 13 },
  pityCount: { color: colors.ink, fontSize: 13 },
  track: { height: 8, borderRadius: 8, backgroundColor: "#F3E6D4", marginTop: 8, overflow: "hidden" },
  fill: { height: 8, borderRadius: 8, backgroundColor: "#C9A0E8" },
  pityHint: { color: colors.inkSoft, fontSize: 12, marginTop: 6 },
  cta: {
    marginTop: 8,
    backgroundColor: colors.coralDeep,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaFree: { backgroundColor: "#3E6B4A" },
  ctaDisabled: { backgroundColor: "#CDB8A8" },
  ctaText: { color: "#FFFCF8", fontSize: 20 },
  helper: { textAlign: "center", color: colors.ink, marginTop: 10, fontSize: 14 },
  helperSoft: { textAlign: "center", color: colors.inkSoft, marginTop: 2, fontSize: 13 },
  odds: { marginTop: 14, alignItems: "center" },
  oddsText: { color: colors.inkSoft, fontSize: 12, textAlign: "center" },
  recent: { marginTop: 18 },
  recentLabel: { color: colors.inkSoft, fontSize: 13, marginBottom: 8 },
  recentRow: { gap: 8, paddingRight: 8 },
  recentChip: {
    width: 84,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
    alignItems: "center",
  },
  recentArt: { width: 64, height: 64 },
  recentName: { color: colors.ink, fontSize: 11, marginTop: 2 },
  emptyHint: { textAlign: "center", color: colors.inkSoft, marginTop: 22, fontSize: 14 },
});
