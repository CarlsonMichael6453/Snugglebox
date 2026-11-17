import { Redirect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CollectionPane } from "@/components/CollectionPane";
import { TopBar } from "@/components/TopBar";
import { colors, useWide } from "@/theme";

export default function CollectionScreen() {
  const wide = useWide();
  if (wide) return <Redirect href="/" />;
  return (
    <View style={styles.screen}>
      <TopBar />
      <CollectionPane />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
