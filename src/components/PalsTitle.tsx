import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { palsTitle } from "@/game/logic";
import { useType } from "@/state/GameContext";

const BLUE = "#9FD8FF";
const PINK = "#FFB6D9";
const HALO = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

const USE_NATIVE_DRIVER = Platform.OS !== "web";

function fittedSize(available: number, chars: number, preferred: number, min: number): number {
  if (available <= 0 || chars <= 0) return preferred;
  const natural = chars * preferred * 0.66;
  if (natural <= available) return preferred;
  return Math.max(min, Math.floor(available / (chars * 0.66)));
}

export function PalsTitle({ name, variant }: { name: string; variant: "tab" | "screen" }) {
  const type = useType();
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  const label = palsTitle(name);
  const letters = Array.from(label);
  const clock = useRef(new Animated.Value(0)).current;
  const preferred = variant === "tab" ? 14 : 32;
  const min = variant === "tab" ? 10 : 16;
  const amplitude = variant === "tab" ? 3 : 6;
  const available = variant === "tab" ? Math.min(windowWidth, 520) / 2 - 28 : measured;
  const fontSize = fittedSize(available, letters.length, preferred, min);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(clock, {
        toValue: 1,
        duration: 1700,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [clock]);

  const offsets = useMemo(
    () =>
      Array.from(label).map((_, index) => {
        const phase = index * 0.09;
        return clock.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, 0.25, 0.5, 0.75, 1].map((t) => -Math.sin((t + phase) * Math.PI * 2) * amplitude),
        });
      }),
    [amplitude, clock, label],
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.row, variant === "screen" && styles.screenRow, { paddingTop: amplitude + 1 }]}
      onLayout={(event) => {
        if (variant === "screen") setMeasured(event.nativeEvent.layout.width);
      }}
    >
      {letters.map((char, index) => {
        const color = index % 2 === 0 ? BLUE : PINK;
        if (char === " ") {
          return <View key={`space-${index}`} style={{ width: fontSize * 0.34 }} />;
        }
        const textStyle = {
          fontFamily: type.display,
          fontSize,
          lineHeight: Math.round(fontSize * 1.05),
          ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
        };
        return (
          <Animated.View key={`${char}-${index}`} style={{ transform: [{ translateY: offsets[index] }] }}>
            <View>
              {HALO.map(([x, y], haloIndex) => (
                <Text
                  key={haloIndex}
                  accessible={false}
                  style={[textStyle, styles.halo, { left: x, top: y, color: "#FFFFFF" }]}
                >
                  {char}
                </Text>
              ))}
              <Text
                accessible={false}
                style={[
                  textStyle,
                  {
                    color,
                    textShadowColor: "rgba(255,255,255,0.98)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  },
                ]}
              >
                {char}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-end",
    maxWidth: "100%",
  },
  screenRow: {
    width: "100%",
    marginBottom: 8,
  },
  halo: {
    position: "absolute",
  },
});
