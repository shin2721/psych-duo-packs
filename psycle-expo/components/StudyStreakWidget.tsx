import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import i18n from "../lib/i18n";

export type StudyActivityDay = {
  date: string;
  completed: boolean;
  isToday: boolean;
};

interface StudyStreakWidgetProps {
  streakDays: number;
  todayLessons: number;
  recentActivity: StudyActivityDay[];
  onOpenCalendar: () => void;
}

export function StudyStreakWidget({
  streakDays,
  todayLessons,
  recentActivity,
  onOpenCalendar,
}: StudyStreakWidgetProps) {
  const isJa = i18n.locale.startsWith("ja");

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.label}>{isJa ? "学習ストリーク" : "Study Streak"}</Text>
          <Text style={styles.streakValue}>
            {isJa ? `🔥 ${streakDays}日連続` : `🔥 ${streakDays}-day streak`}
          </Text>
        </View>

        <Pressable style={styles.calendarButton} onPress={onOpenCalendar}>
          <Text style={styles.calendarButtonText}>{isJa ? "カレンダー" : "Calendar"}</Text>
        </Pressable>
      </View>

      <Text style={styles.subText}>
        {isJa
          ? todayLessons > 0
            ? `今日 ${todayLessons} レッスン完了`
            : "今日はまだ学習していません"
          : todayLessons > 0
            ? `${todayLessons} lesson${todayLessons > 1 ? "s" : ""} done today`
            : "No lesson completed yet today"}
      </Text>

      <View style={styles.activityRow}>
        {recentActivity.map((day) => (
          <View
            key={day.date}
            style={[
              styles.dayCell,
              day.completed && styles.dayCellDone,
              day.isToday && styles.dayCellToday,
            ]}
          >
            {day.completed && <Ionicons name="checkmark" size={9} color="#0b1720" />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: "rgba(11, 18, 32, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(168, 255, 96, 0.35)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 10,
  },
  label: {
    fontSize: 12,
    color: theme.colors.sub,
    fontWeight: "600",
  },
  streakValue: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: "800",
    marginTop: 2,
  },
  subText: {
    fontSize: 12,
    color: theme.colors.sub,
    marginBottom: 10,
  },
  calendarButton: {
    backgroundColor: "rgba(61, 235, 246, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(61, 235, 246, 0.45)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  calendarButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3debf6",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  dayCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellDone: {
    backgroundColor: "#a8ff60",
    borderColor: "#a8ff60",
  },
  dayCellToday: {
    borderColor: "#3debf6",
  },
});
