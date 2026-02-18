import { Platform } from "react-native";

type WidgetRecentDay = {
  date: string;
  lessonsCompleted: number;
  xp: number;
};

export type WidgetStudyPayload = {
  studyStreak: number;
  todayLessons: number;
  todayXP: number;
  totalXP: number;
  streakRiskType: "safe_today" | "break_streak" | "consume_freeze";
  streakRiskMessageJa: string;
  streakRiskMessageEn: string;
  recentDays: WidgetRecentDay[];
  updatedAtMs: number;
};

let setWidgetDataBridge: ((payload: string) => void) | null = null;

if (Platform.OS === "ios") {
  try {
    const widgetBridge = require("@bittingz/expo-widgets") as {
      setWidgetData?: (payload: string) => void;
    };
    if (typeof widgetBridge.setWidgetData === "function") {
      setWidgetDataBridge = widgetBridge.setWidgetData;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[WidgetSync] expo-widgets bridge is unavailable on this build", error);
    }
  }
}

export function syncWidgetStudyData(payload: WidgetStudyPayload): void {
  if (Platform.OS !== "ios" || !setWidgetDataBridge) return;
  try {
    setWidgetDataBridge(JSON.stringify(payload));
  } catch (error) {
    if (__DEV__) {
      console.warn("[WidgetSync] failed to sync widget payload", error);
    }
  }
}
