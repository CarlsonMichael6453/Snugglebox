import { useWindowDimensions } from "react-native";
import type { Tier } from "@/config";

export const colors = {
  desk: "#F6EFE4",
  bg: "#FBF6EE",
  bgDeep: "#F3E6D4",
  ink: "#6A4632",
  inkSoft: "#8D6B55",
  card: "#FFFCF8",
  line: "#EADCCB",
  coral: "#E9899A",
  coralDeep: "#C45B74",
  gold: "#E2A322",
  cream: "#FBF3E4",
};

export const tierStyle: Record<Tier, { bg: string; fg: string; glow: string }> = {
  common: { bg: "#E7F2E6", fg: "#3E6B4A", glow: "#F4B8C6" },
  rare: { bg: "#E3F2FC", fg: "#1D6394", glow: "#8EC8F8" },
  epic: { bg: "#F1E9FF", fg: "#6A45A8", glow: "#CDB6F6" },
  legendary: { bg: "#FFF1C9", fg: "#8A5A00", glow: "#FFD15C" },
};

export function useWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= 980;
}
