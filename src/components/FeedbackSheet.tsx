import { useEffect, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FEEDBACK_EMAIL, GAME_NAME } from "@/config";
import { appVersion, currentDeviceLabel, deviceLabel, openFeedbackMail } from "@/game/deviceInfo";
import {
  FEEDBACK_MESSAGE_LIMIT,
  buildMailto,
  canSubmitNote,
  feedbackBody,
  feedbackSubject,
  optionalEmailError,
  type NoteKind,
  type Thumb,
} from "@/game/playerFeedback";
import { useGame, useType } from "@/state/GameContext";
import { colors } from "@/theme";

function Scrim({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <View style={styles.scrim}>
      <Pressable style={styles.scrimHit} onPress={onClose} accessibilityLabel="Close" />
      {children}
    </View>
  );
}

export function EnjoyPrompt() {
  const game = useGame();
  const type = useType();
  const tier = game.presentation?.tier;
  const friend = tier === "epic" ? "An Epic friend" : tier === "legendary" ? "A Legendary friend" : null;
  const happy = friend ? `${friend} just hopped out.` : "That box was a good one.";

  return (
    <Scrim onClose={() => game.setOverlay(null)}>
      <View style={styles.prompt}>
        <Text style={[styles.spark, { fontFamily: type.display }]}>✦</Text>
        <Text style={[styles.title, { fontFamily: type.display }]}>Enjoying {GAME_NAME}?</Text>
        <Text style={[styles.copy, { fontFamily: type.body }]}>{happy} A short note would mean a lot.</Text>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            onPress={() => game.setOverlay({ kind: "feedback", thumb: "up" })}
            style={styles.primary}
          >
            <Text style={[styles.primaryText, { fontFamily: type.display }]}>Yes</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => game.setOverlay(null)} style={styles.secondary}>
            <Text style={[styles.secondaryText, { fontFamily: type.strong }]}>Not now</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={game.dismissRatingForever} style={styles.quiet}>
          <Text style={[styles.quietText, { fontFamily: type.body }]}>Don't ask again</Text>
        </Pressable>
      </View>
    </Scrim>
  );
}

export function FeedbackSheet({ initialThumb }: { initialThumb: Thumb | null }) {
  const game = useGame();
  const type = useType();
  const [kind, setKind] = useState<NoteKind>("feedback");
  const [thumb, setThumb] = useState<Thumb | null>(initialThumb);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [device, setDevice] = useState(currentDeviceLabel);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [mailError, setMailError] = useState(false);
  const version = appVersion();
  const emailError = optionalEmailError(email);
  const ready = canSubmitNote({ kind, thumb, message, email }) && !sending;
  const prompt = kind === "bug" ? "What happened?" : "A little note";

  useEffect(() => {
    let live = true;
    void deviceLabel().then((value) => {
      if (live) setDevice(value);
    });
    return () => {
      live = false;
    };
  }, []);

  function submit() {
    if (!canSubmitNote({ kind, thumb, message, email }) || sending) return;
    setSending(true);
    setMailError(false);
    const url = buildMailto(
      FEEDBACK_EMAIL,
      feedbackSubject(kind),
      feedbackBody({
        thumb,
        message,
        email,
        version,
        device: device || currentDeviceLabel() || "unknown",
      }),
    );
    void openFeedbackMail(url).then(
      () => {
        game.rememberFeedbackSent();
        setSent(true);
      },
      () => {
        setSending(false);
        setMailError(true);
      },
    );
  }

  if (sent) {
    return (
      <Scrim onClose={() => game.setOverlay(null)}>
        <View style={styles.sheet}>
          <Text style={[styles.spark, { fontFamily: type.display }]}>✦</Text>
          <Text style={[styles.title, { fontFamily: type.display }]}>Thank you</Text>
          <Text style={[styles.copy, { fontFamily: type.body }]}>
            Your mail app has a draft ready. Send it, and the box will be extra snuggly.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => game.setOverlay(null)} style={styles.primaryFull}>
            <Text style={[styles.primaryText, { fontFamily: type.display }]}>Close</Text>
          </Pressable>
        </View>
      </Scrim>
    );
  }

  return (
    <Scrim onClose={() => game.setOverlay(null)}>
      <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { fontFamily: type.display }]}>
          {kind === "bug" ? "Report a bug" : "Feedback"}
        </Text>
        <View style={styles.toggle}>
          <KindButton label="Feedback" selected={kind === "feedback"} onPress={() => setKind("feedback")} />
          <KindButton
            label="Bug"
            accessibilityLabel="Report a bug"
            selected={kind === "bug"}
            onPress={() => setKind("bug")}
          />
        </View>
        <Text style={[styles.label, { fontFamily: type.body }]}>How does it feel?</Text>
        <View style={styles.thumbs}>
          <ThumbButton label="Love it" glyph="👍" selected={thumb === "up"} onPress={() => setThumb("up")} />
          <ThumbButton label="Not quite" glyph="👎" selected={thumb === "down"} onPress={() => setThumb("down")} />
        </View>
        <Text style={[styles.label, { fontFamily: type.body }]}>{prompt}</Text>
        <TextInput
          value={message}
          onChangeText={(value) => setMessage(value.slice(0, FEEDBACK_MESSAGE_LIMIT))}
          multiline
          placeholder={kind === "bug" ? "What happened, and what did you expect?" : "The box, the pals, a wish…"}
          placeholderTextColor="#C4A894"
          accessibilityLabel={prompt}
          textAlignVertical="top"
          style={[styles.input, styles.message, { fontFamily: type.body }]}
        />
        <Text style={[styles.label, { fontFamily: type.body }]}>Email if you'd like a reply</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#C4A894"
          accessibilityLabel="Email, optional"
          style={[styles.input, { fontFamily: type.body }]}
        />
        {emailError ? <Text style={[styles.error, { fontFamily: type.body }]}>{emailError}</Text> : null}
        <Text style={[styles.meta, { fontFamily: type.body }]}>
          Version {version} and this device are added for you. Sending opens your mail app.
        </Text>
        {mailError ? (
          <Text style={[styles.error, { fontFamily: type.body }]}>
            The mail app didn't open. You can write to {FEEDBACK_EMAIL}.
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={!ready}
          onPress={submit}
          style={[styles.primaryFull, !ready && styles.disabled]}
        >
          <Text style={[styles.primaryText, { fontFamily: type.display }]}>
            {kind === "bug" ? "Send bug report" : "Send note"}
          </Text>
        </Pressable>
      </ScrollView>
    </Scrim>
  );
}

function KindButton({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const type = useType();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={[styles.kind, selected && styles.kindOn]}
    >
      <Text style={[styles.kindText, { fontFamily: type.strong, color: selected ? "#FFFCF8" : colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ThumbButton({
  label,
  glyph,
  selected,
  onPress,
}: {
  label: string;
  glyph: string;
  selected: boolean;
  onPress: () => void;
}) {
  const type = useType();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={[styles.thumb, selected && styles.thumbOn]}
    >
      <Text style={styles.glyph}>{glyph}</Text>
      <Text style={[styles.thumbLabel, { fontFamily: type.strong, color: selected ? colors.coralDeep : colors.ink }]}>
        {label}
      </Text>
    </Pressable>
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
  prompt: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 18,
    alignItems: "center",
  },
  sheetScroll: { width: "100%", maxWidth: 440, maxHeight: "86%" },
  sheet: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 18,
  },
  spark: { color: colors.gold, fontSize: 22, textAlign: "center" },
  title: { color: colors.ink, fontSize: 30, textAlign: "center", marginTop: 2 },
  copy: { color: colors.inkSoft, fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 21 },
  label: { color: colors.ink, fontSize: 15, marginTop: 14 },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#F6EFE6",
    borderRadius: 999,
    padding: 4,
    marginTop: 14,
    gap: 4,
  },
  kind: { flex: 1, borderRadius: 999, paddingVertical: 8, alignItems: "center" },
  kindOn: { backgroundColor: colors.coralDeep },
  kindText: { fontSize: 15 },
  thumbs: { flexDirection: "row", gap: 10, marginTop: 8 },
  thumb: {
    flex: 1,
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 10,
    backgroundColor: "#F6EFE6",
    borderWidth: 2,
    borderColor: "#F6EFE6",
  },
  thumbOn: { backgroundColor: "#F8D0D8", borderColor: colors.coral },
  glyph: { fontSize: 28 },
  thumbLabel: { fontSize: 14, marginTop: 2 },
  input: {
    marginTop: 8,
    backgroundColor: "#FFF9F4",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F3C9D4",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  message: { minHeight: 96 },
  meta: { color: colors.inkSoft, fontSize: 13, marginTop: 10, lineHeight: 18 },
  error: { color: colors.coralDeep, fontSize: 13, marginTop: 6 },
  row: { flexDirection: "row", gap: 10, marginTop: 16, width: "100%" },
  primary: {
    flex: 1,
    backgroundColor: colors.coralDeep,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryFull: {
    backgroundColor: colors.coralDeep,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },
  primaryText: { color: "#FFFCF8", fontSize: 18 },
  secondary: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F6EFE6",
  },
  secondaryText: { color: colors.ink, fontSize: 16 },
  quiet: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 8 },
  quietText: { color: colors.inkSoft, fontSize: 14 },
  disabled: { opacity: 0.55 },
});
