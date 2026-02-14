import { setWidgetData } from "@bittingz/expo-widgets";
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

export function syncWidgetStudyData(payload: WidgetStudyPayload): void {
  if (Platform.OS !== "ios") return;
  try {
    setWidgetData(JSON.stringify(payload));
  } catch (error) {
    if (__DEV__) {
      console.warn("[WidgetSync] failed to sync widget payload", error);
    }
  }
}
