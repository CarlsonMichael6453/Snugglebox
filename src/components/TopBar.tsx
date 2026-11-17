import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GAME_NAME, GAME_TAGLINE } from "@/config";
import { useGame, useType } from "@/state/GameContext";
import { colors } from "@/theme";

export function TopBar() {
  const insets = useSafeAreaInsets();
  const type = useType();
  const { state, setOverlay } = useGame();

  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.titleBlock}>
        <Text style={[styles.name, { fontFamily: type.display }]}>{GAME_NAME}</Text>
        <Text style={[styles.tag, { fontFamily: type.body }]}>{GAME_TAGLINE}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Stardust and drop rates" onPress={() => setOverlay({ kind: "rates" })} style={styles.dust}>
          <Text style={[styles.dustText, { fontFamily: type.strong }]}>✦ {state.stardust}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => setOverlay({ kind: "settings" })} style={styles.gear}>
          <View style={styles.gearDot} />
          <View style={styles.gearRing} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: { flexShrink: 1 },
  name: { color: colors.ink, fontSize: 28, letterSpacing: 0.2 },
  tag: { color: colors.inkSoft, fontSize: 13, marginTop: -2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  dust: {
    backgroundColor: "#FFF4D2",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#F0D48A",
  },
  dustText: { color: "#8A5A00", fontSize: 15 },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  gearRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.inkSoft,
  },
  gearDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inkSoft,
  },
});
