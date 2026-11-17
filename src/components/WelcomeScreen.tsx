import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GAME_NAME } from "@/config";
import { sanitizeName } from "@/game/logic";
import { useGame, useType } from "@/state/GameContext";
import { colors } from "@/theme";

export function WelcomeScreen() {
  const game = useGame();
  const type = useType();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const clean = sanitizeName(draft);

  function submit() {
    if (!clean) {
      setHint("Type a name first. A short one is perfect.");
      return;
    }
    game.setPlayerName(clean);
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.card}>
          <View style={styles.boxWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={styles.bowRow}>
              <View style={styles.bow} />
              <View style={styles.knot} />
              <View style={styles.bow} />
            </View>
            <LinearGradient colors={["#F8C9D4", "#F3A9BA"]} style={styles.lid} />
            <LinearGradient colors={["#E9899A", "#D86B80"]} style={styles.body}>
              <View style={styles.ribbon} />
              <View style={styles.face}>
                <View style={styles.eyes}>
                  <View style={styles.eye} />
                  <View style={styles.eye} />
                </View>
                <View style={styles.smile} />
              </View>
            </LinearGradient>
          </View>

          <Text style={[styles.kicker, { fontFamily: type.body }]}>{GAME_NAME}</Text>
          <Text style={[styles.title, { fontFamily: type.display }]}>Welcome</Text>
          <Text style={[styles.copy, { fontFamily: type.body }]}>
            The box is yours. It just needs a name for the lid, so your pals know who they belong to.
          </Text>

          <TextInput
            value={draft}
            onChangeText={(value) => {
              setDraft(value);
              if (hint) setHint(null);
            }}
            onSubmitEditing={submit}
            maxLength={20}
            placeholder="Your name"
            placeholderTextColor="#C4A894"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="done"
            accessibilityLabel="Your name"
            style={[styles.input, { fontFamily: type.display }]}
          />

          <Pressable accessibilityRole="button" onPress={submit} style={styles.button}>
            <Text style={[styles.buttonText, { fontFamily: type.display }]}>That's me</Text>
          </Pressable>
          <Text style={[styles.hint, { fontFamily: type.body }]}>
            {hint ?? "Saved on this device, with the rest of your collection."}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: "center",
  },
  boxWrap: { alignItems: "center", marginBottom: 8 },
  bowRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: -6 },
  bow: {
    width: 22,
    height: 16,
    borderRadius: 12,
    backgroundColor: colors.cream,
    marginHorizontal: -2,
  },
  knot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.coralDeep,
    marginBottom: 3,
    zIndex: 1,
  },
  lid: {
    width: 132,
    height: 36,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginBottom: -6,
  },
  body: {
    width: 124,
    height: 78,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ribbon: {
    position: "absolute",
    width: 16,
    top: 0,
    bottom: 0,
    backgroundColor: colors.cream,
  },
  face: { alignItems: "center", zIndex: 1 },
  eyes: { flexDirection: "row", gap: 14 },
  eye: { width: 7, height: 8, borderRadius: 4, backgroundColor: "#6A4632" },
  smile: {
    marginTop: 6,
    width: 12,
    height: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#6A4632",
  },
  kicker: { color: colors.coralDeep, fontSize: 13, marginTop: 8 },
  title: { color: colors.ink, fontSize: 36, marginTop: 2 },
  copy: { color: colors.inkSoft, fontSize: 15, textAlign: "center", lineHeight: 21, marginTop: 6 },
  input: {
    width: "100%",
    marginTop: 16,
    backgroundColor: "#FFF9F4",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F3C9D4",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    color: colors.ink,
    textAlign: "center",
  },
  button: {
    width: "100%",
    marginTop: 12,
    backgroundColor: colors.coralDeep,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonText: { color: "#FFFCF8", fontSize: 20 },
  hint: { color: colors.inkSoft, fontSize: 13, textAlign: "center", marginTop: 10, lineHeight: 18 },
});
