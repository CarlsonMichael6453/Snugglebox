import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TIER_LABEL, TIERS, type Tier } from "@/config";
import { CREATURES, MOCHI_COLORS, MOCHI_ID } from "@/data/creatures";
import { albumStats } from "@/game/logic";
import { CreatureArt } from "@/components/CreatureArt";
import { useGame, useType } from "@/state/GameContext";
import { colors, tierStyle } from "@/theme";

type Filter = "all" | Tier | "mochi";

export function CollectionPane({ showHeader = true }: { showHeader?: boolean }) {
  const game = useGame();
  const type = useType();
  const [filter, setFilter] = useState<Filter>("all");
  const [width, setWidth] = useState(0);
  const stats = albumStats(game.state);
  const columns = width >= 520 ? 4 : 3;
  const gap = 10;
  const cell = width > 0 ? (width - gap * (columns - 1)) / columns : 100;

  const creatures =
    filter === "mochi" || filter === "all"
      ? filter === "all"
        ? CREATURES
        : []
      : CREATURES.filter((creature) => creature.tier === filter);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width - 32)}
    >
      <View style={styles.summary}>
        <Text style={[styles.summaryTitle, { fontFamily: type.display }]}>
          {stats.discovered}/{stats.creatureTotal} friends
        </Text>
        <Text style={[styles.summaryPct, { fontFamily: type.strong }]}>{Math.round(stats.percent * 100)}% album</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${stats.percent * 100}%` }]} />
        </View>
        <Text style={[styles.summaryMeta, { fontFamily: type.body }]}>
          {stats.poses}/{stats.poseTotal} looks · {stats.colors}/{stats.colorTotal} mochi colors
        </Text>
        {stats.discovered === 0 ? (
          <Text style={[styles.summaryMeta, { fontFamily: type.body }]}>The box already knows their names.</Text>
        ) : null}
      </View>

      <View style={styles.filters}>
        {(["all", ...TIERS, "mochi"] as Filter[]).map((item) => {
          const active = filter === item;
          const label = item === "all" ? "All" : item === "mochi" ? "Mochi" : TIER_LABEL[item];
          return (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, active && styles.chipOn]}>
              <Text style={[styles.chipText, { fontFamily: type.body }, active && styles.chipTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {filter === "mochi" ? (
        <View style={styles.grid}>
          {MOCHI_COLORS.map((color) => {
            const count = game.state.mochiColors[color.id] ?? 0;
            const found = count > 0;
            return (
              <Pressable
                key={color.id}
                style={[styles.cell, { width: cell }]}
                onPress={() => {
                  if (!found) return;
                  game.markSeen(undefined, color.id);
                  game.setOverlay({ kind: "color", colorId: color.id });
                }}
              >
                <View style={[styles.artWell, !found && styles.artLocked]}>
                  <CreatureArt colorId={color.id} locked={!found} style={styles.art} />
                  {color.rare && found ? <Text style={styles.rareMark}>✦</Text> : null}
                  {count > 1 ? <Text style={[styles.count, { fontFamily: type.strong }]}>×{count}</Text> : null}
                </View>
                <Text numberOfLines={1} style={[styles.cellName, { fontFamily: type.body }]}>
                  {color.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.grid}>
          {creatures.map((creature) => {
            const progress = game.state.creatures[creature.id];
            const found = (progress?.poses.length ?? 0) > 0;
            const pose = progress?.poses.includes(1) ? 1 : progress?.poses[0] ?? 1;
            const fresh = game.state.fresh.some((key) => key.startsWith(`c:${creature.id}`) || key.startsWith(`p:${creature.id}`));
            return (
              <Pressable
                key={creature.id}
                style={[styles.cell, { width: cell }]}
                onPress={() => {
                  if (!found) return;
                  game.markSeen(creature.id);
                  game.setOverlay({ kind: "detail", creatureId: creature.id });
                }}
              >
                <View style={[styles.artWell, !found && styles.artLocked, { borderColor: tierStyle[creature.tier].glow }]}>
                  <CreatureArt creatureId={creature.id} pose={pose} locked={!found} style={styles.art} />
                  {fresh ? <View style={styles.fresh} /> : null}
                  {(progress?.pulls ?? 0) > 1 ? (
                    <Text style={[styles.count, { fontFamily: type.strong }]}>×{progress?.pulls}</Text>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={[styles.cellName, { fontFamily: type.body }]}>
                  {creature.name}
                </Text>
                <View style={styles.pips}>
                  {[1, 2].map((look) => (
                    <View key={look} style={[styles.pip, progress?.poses.includes(look as 1 | 2) ? styles.pipOn : null]} />
                  ))}
                  {creature.id === MOCHI_ID ? (
                    <Text style={[styles.colorCount, { fontFamily: type.body }]}>
                      {stats.colors}/{stats.colorTotal}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      {showHeader ? <View style={{ height: 12 }} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  summary: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  summaryTitle: { color: colors.ink, fontSize: 24 },
  summaryPct: { color: colors.coralDeep, marginTop: 2, fontSize: 14 },
  track: { height: 8, borderRadius: 8, backgroundColor: "#F3E6D4", marginTop: 10, overflow: "hidden" },
  fill: { height: 8, backgroundColor: "#E9899A" },
  summaryMeta: { color: colors.inkSoft, marginTop: 8, fontSize: 13 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 14 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 13 },
  chipTextOn: { color: "#FFFCF8" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cell: { alignItems: "center" },
  artWell: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#FFF6EE",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  artLocked: { backgroundColor: "#F3E6D6" },
  art: { width: "86%", height: "86%" },
  cellName: { color: colors.ink, fontSize: 12, marginTop: 6 },
  pips: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  pip: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#E4D3C2" },
  pipOn: { backgroundColor: colors.coralDeep },
  count: {
    position: "absolute",
    right: 6,
    bottom: 6,
    backgroundColor: "#FFF4D2",
    color: "#8A5A00",
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 5,
    fontSize: 11,
  },
  fresh: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coralDeep,
  },
  rareMark: { position: "absolute", top: 6, left: 8, color: "#E2A322", fontSize: 12 },
  colorCount: { color: colors.inkSoft, fontSize: 10, marginLeft: 4 },
});
