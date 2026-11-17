import { Image, type ImageStyle, type StyleProp } from "react-native";
import { creatureArt, mochiArt, silhouettes } from "@/data/images";
import type { Pose } from "@/game/logic";

export function CreatureArt({
  creatureId,
  pose = 1,
  colorId,
  locked = false,
  style,
}: {
  creatureId?: string;
  pose?: Pose;
  colorId?: string;
  locked?: boolean;
  style?: StyleProp<ImageStyle>;
}) {
  const source = colorId
    ? locked
      ? silhouettes.mochi
      : mochiArt[colorId]
    : creatureId
      ? locked
        ? silhouettes[`${creatureId}-${pose}`]
        : creatureArt[`${creatureId}-${pose}`]
      : undefined;

  if (!source) return null;
  return <Image source={source} style={style} resizeMode="contain" accessibilityIgnoresInvertColors />;
}
