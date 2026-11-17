import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Tier } from "@/config";
import type { Phase } from "@/state/GameContext";
import { colors, tierStyle } from "@/theme";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

const SPARKS = Array.from({ length: 14 }, (_, index) => ({
  angle: (index / 14) * Math.PI * 2 + 0.15,
  distance: 78 + (index % 4) * 18,
  size: 7 + (index % 3) * 3,
}));

export function MysteryBox({
  phase,
  tier,
  disabled,
  onPress,
}: {
  phase: Phase;
  tier: Tier | null;
  disabled: boolean;
  onPress: () => void;
}) {
  const bob = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const lid = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    const spin = Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER }),
    );
    loop.start();
    spin.start();
    return () => {
      loop.stop();
      spin.stop();
    };
  }, [bob, orbit]);

  useEffect(() => {
    if (phase === "idle") {
      wobble.setValue(0);
      glow.setValue(0);
      lid.setValue(0);
      burst.setValue(0);
      return;
    }
    if (phase === "shake") {
      lid.setValue(0);
      burst.setValue(0);
      Animated.timing(glow, { toValue: 1, duration: 780, useNativeDriver: USE_NATIVE_DRIVER }).start();
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 1, duration: 55, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(wobble, { toValue: -1, duration: 55, useNativeDriver: USE_NATIVE_DRIVER }),
        ]),
        { iterations: 8 },
      );
      loop.start();
      return () => loop.stop();
    }
    if (phase === "pop" || phase === "reveal") {
      wobble.setValue(0);
      glow.setValue(1);
      Animated.parallel([
        Animated.timing(lid, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(burst, { toValue: 1, duration: 560, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start();
    }
  }, [burst, glow, lid, phase, wobble]);

  const sparks = useMemo(
    () =>
      SPARKS.map((spark) => ({
        ...spark,
        x: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(spark.angle) * spark.distance] }),
        y: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(spark.angle) * spark.distance] }),
        opacity: burst.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
      })),
    [burst],
  );

  const glowColor = tier ? tierStyle[tier].glow : colors.coral;
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const rotate = wobble.interpolate({ inputRange: [-1, 1], outputRange: ["-8deg", "8deg"] });
  const lidY = lid.interpolate({ inputRange: [0, 1], outputRange: [0, -78] });
  const lidSpin = lid.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-16deg"] });
  const orbitSpin = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open the mystery box"
      accessibilityState={{ disabled: disabled || phase === "shake" || phase === "pop" }}
      disabled={disabled || phase === "shake" || phase === "pop"}
      onPress={onPress}
      style={styles.hit}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          { backgroundColor: glowColor, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.9] }) },
        ]}
      />
      {phase === "idle" ? (
        <Animated.View pointerEvents="none" style={[styles.orbit, { transform: [{ rotate: orbitSpin }] }]}>
          <View style={[styles.spark, { top: 8, left: 108 }]} />
          <View style={[styles.spark, { bottom: 30, left: 16 }]} />
          <View style={[styles.spark, { bottom: 24, right: 18 }]} />
        </Animated.View>
      ) : null}
      <View style={styles.shadow} />
      <Animated.View style={{ transform: [{ translateY: phase === "idle" ? bobY : 0 }, { rotate }] }}>
        <Animated.View style={[styles.lidWrap, { transform: [{ translateY: lidY }, { rotate: lidSpin }] }]}>
          <View style={styles.bowRow}>
            <View style={styles.bow} />
            <View style={styles.knot} />
            <View style={styles.bow} />
          </View>
          <LinearGradient colors={["#F8C9D4", "#F3A9BA"]} style={styles.lid} />
          <View style={styles.lidRibbon} />
        </Animated.View>
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
      </Animated.View>
      {sparks.map((spark, index) => (
        <Animated.View
          key={index}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              width: spark.size,
              height: spark.size,
              borderRadius: spark.size / 2,
              backgroundColor: index % 3 === 0 ? "#FFE7A8" : glowColor,
              opacity: spark.opacity,
              transform: [{ translateX: spark.x }, { translateY: spark.y }],
            },
          ]}
        />
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 250,
    height: 270,
    alignItems: "center",
    justifyContent: "flex-end",
    alignSelf: "center",
  },
  glow: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    bottom: 28,
  },
  orbit: {
    position: "absolute",
    width: 230,
    height: 230,
    bottom: 16,
  },
  spark: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F2C14E",
  },
  shadow: {
    position: "absolute",
    bottom: 10,
    width: 150,
    height: 22,
    borderRadius: 20,
    backgroundColor: "rgba(120, 72, 42, 0.16)",
  },
  lidWrap: {
    alignItems: "center",
    zIndex: 2,
    marginBottom: -14,
  },
  bowRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: -10,
  },
  bow: {
    width: 28,
    height: 22,
    borderRadius: 14,
    backgroundColor: colors.cream,
    marginHorizontal: -2,
  },
  knot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.coralDeep,
    marginBottom: 4,
    zIndex: 1,
  },
  lid: {
    width: 196,
    height: 58,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  lidRibbon: {
    position: "absolute",
    bottom: 0,
    width: 28,
    height: 58,
    backgroundColor: colors.cream,
  },
  body: {
    width: 186,
    height: 132,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ribbon: {
    position: "absolute",
    width: 26,
    top: 0,
    bottom: 0,
    backgroundColor: colors.cream,
  },
  face: {
    alignItems: "center",
    zIndex: 1,
  },
  eyes: {
    flexDirection: "row",
    gap: 18,
  },
  eye: {
    width: 10,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6A4632",
  },
  smile: {
    marginTop: 8,
    width: 16,
    height: 8,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#6A4632",
  },
  particle: {
    position: "absolute",
    bottom: 120,
  },
});
