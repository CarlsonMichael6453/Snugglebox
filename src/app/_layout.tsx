import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { Nunito_700Bold, Nunito_800ExtraBold } from "@expo-google-fonts/nunito";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GAME_NAME } from "@/config";
import { GameOverlays } from "@/components/Overlays";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { GameProvider, useGame } from "@/state/GameContext";
import { colors } from "@/theme";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    document.title = GAME_NAME;
    const id = "snugglebox-base";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent =
      "html,body,#root{height:100%;margin:0;background:#F6EFE4;} body{overflow:hidden;}";
    document.head.appendChild(style);
  }, []);

  const fontsReady = loaded || Boolean(error) || waited;
  if (!fontsReady) return <Boot />;

  return (
    <SafeAreaProvider>
      <GameProvider fontsOn={Boolean(loaded) && !error}>
        <StatusBar style="dark" />
        <Hydrated />
      </GameProvider>
    </SafeAreaProvider>
  );
}

function Hydrated() {
  const { ready, state } = useGame();
  if (!ready) return <Boot />;
  if (!state.playerName) return <WelcomeScreen />;
  return (
    <View style={styles.root}>
      <Slot />
      <GameOverlays />
    </View>
  );
}

function Boot() {
  return (
    <View style={styles.boot}>
      <Text style={styles.bootName}>{GAME_NAME}</Text>
      <Text style={styles.bootHint}>Warming the box…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.desk },
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  bootName: { color: colors.ink, fontSize: 40 },
  bootHint: { color: colors.inkSoft, marginTop: 8, fontSize: 16 },
});
