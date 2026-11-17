import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PalsTitle } from "@/components/PalsTitle";
import { palsTitle } from "@/game/logic";
import { useGame, useType } from "@/state/GameContext";
import { colors, useWide } from "@/theme";

export default function GameLayout() {
  const wide = useWide();
  const insets = useSafeAreaInsets();
  const type = useType();
  const { state } = useGame();
  const pals = state.playerName ? palsTitle(state.playerName) : "Your Pals";

  return (
    <View style={styles.desk}>
      <View style={[styles.frame, wide && styles.frameWide]}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: wide
              ? { display: "none" }
              : {
                  backgroundColor: colors.card,
                  borderTopColor: colors.line,
                  height: 88 + insets.bottom,
                  paddingBottom: insets.bottom,
                  paddingTop: 4,
                },
            tabBarActiveTintColor: colors.coralDeep,
            tabBarInactiveTintColor: "#B29580",
            tabBarLabelStyle: { fontFamily: type.body, fontSize: 12 },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Box",
              tabBarIcon: ({ color }) => <View style={[styles.boxIcon, { borderColor: color }]} />,
            }}
          />
          <Tabs.Screen
            name="collection"
            options={{
              title: pals,
              tabBarAccessibilityLabel: pals,
              tabBarLabel: () =>
                state.playerName ? <PalsTitle name={state.playerName} variant="tab" /> : pals,
              tabBarIcon: ({ color }) => (
                <View style={styles.paws}>
                  <View style={[styles.paw, { backgroundColor: color }]} />
                  <View style={[styles.paw, { backgroundColor: color }]} />
                </View>
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desk: { flex: 1, backgroundColor: colors.desk, alignItems: "center" },
  frame: { flex: 1, width: "100%", maxWidth: 520, backgroundColor: colors.bg },
  frameWide: { maxWidth: 1100 },
  boxIcon: { width: 16, height: 14, borderWidth: 2, borderRadius: 3 },
  paws: { flexDirection: "row", gap: 3 },
  paw: { width: 7, height: 7, borderRadius: 4 },
});
