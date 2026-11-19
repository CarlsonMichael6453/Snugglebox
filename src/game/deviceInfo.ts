import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

export function appVersion(): string {
  const version = Constants.expoConfig?.version;
  return typeof version === "string" && version.trim().length > 0 ? version.trim() : "1.0.0";
}

function platformSummary(): string {
  const parts = [`${Platform.OS} ${String(Platform.Version ?? "")}`.trim()];
  if (Constants.deviceName) parts.push(Constants.deviceName);
  return parts.filter(Boolean).join(" · ");
}

export function currentDeviceLabel(): string {
  if (Platform.OS === "web") {
    const agent = typeof navigator !== "undefined" ? navigator.userAgent.trim() : "";
    if (agent) return agent;
  }
  return platformSummary();
}

/** Browser user agent on web, otherwise the native webview user agent or a platform summary. */
export async function deviceLabel(): Promise<string> {
  if (Platform.OS === "web") return currentDeviceLabel();
  try {
    const agent = (await Constants.getWebViewUserAgentAsync())?.trim();
    if (agent) return agent;
  } catch {
    // A platform summary still tells us where the note came from.
  }
  return platformSummary();
}

/** Opens the mail draft during the tap. An anchor click keeps the page in place on web. */
export function openFeedbackMail(url: string): Promise<void> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return Promise.resolve();
  }
  return Linking.openURL(url).then(() => undefined);
}
