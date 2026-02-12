import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { theme } from "../../lib/theme";
import { useAppState } from "../../lib/state";
import { Card, ProgressBar, SectionHeader } from "../../components/ui";
import { Chest } from "../../components/Chest";
import { GlobalHeader } from "../../components/GlobalHeader";
import { StreakCalendar } from "../../components/StreakCalendar";
import { getStreakData } from "../../lib/streaks";
import i18n from "../../lib/i18n";

type CalendarDay = {
  date: string;
  xp: number;
  lessonsCompleted: number;
};

export default function QuestsScreen() {
  const { xp, quests, claimQuest } = useAppState();
  const [calendarHistory, setCalendarHistory] = useState<CalendarDay[]>([]);
  const currentMonth = new Date().getMonth() + 1;

  const monthly = quests.filter((q) => q.type === "monthly");
  const daily = quests.filter((q) => q.type === "daily");
  const weekly = quests.filter((q) => q.type === "weekly");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadCalendarHistory = async () => {
        const data = await getStreakData();
        const history = Object.entries(data.studyHistory || {}).map(([date, value]) => ({
          date,
          xp: value.xp || 0,
          lessonsCompleted: value.lessonsCompleted || 0,
        }));
        if (isActive) {
          setCalendarHistory(history);
        }
      };

      loadCalendarHistory().catch(console.error);
      return () => {
        isActive = false;
      };
    }, [])
  );

  const renderQuest = (q: any) => {
    const completed = q.progress >= q.need;
    const canClaim = completed && !q.claimed;

    return (
      <Card key={q.id} style={styles.questCard}>
        <View style={styles.questRow}>
          <View style={styles.questInfo}>
            <Text style={styles.questTitle}>{q.title}</Text>
            <Text style={styles.questDesc}>
              {q.progress} / {q.need}
            </Text>
            <ProgressBar value={q.progress} max={q.need} style={styles.progressBar} />
          </View>
          <Chest
            state={q.chestState}
            onOpen={canClaim ? () => claimQuest(q.id) : undefined}
            size="sm"
            label={`${q.rewardXp}`}
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlobalHeader />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{i18n.t("quests.monthTitle", { month: currentMonth })}</Text>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>

        {/* Streak Calendar */}
        <StreakCalendar history={calendarHistory} />

        {monthly.length > 0 && (
          <Card style={styles.monthlyCard}>
            <Text style={styles.monthlyLabel}>{i18n.t("quests.monthly")}</Text>
            {monthly.map((q) => (
              <View key={q.id} style={styles.monthlyRow}>
                <View style={styles.monthlyInfo}>
                  <Text style={styles.monthlyTitle}>{q.title}</Text>
                  <ProgressBar value={q.progress} max={q.need} style={styles.progressBar} />
                  <Text style={styles.monthlyProgress}>
                    {q.progress} / {q.need}
                  </Text>
                </View>
                <Chest
                  state={q.chestState}
                  onOpen={q.progress >= q.need && !q.claimed ? () => claimQuest(q.id) : undefined}
                  size="md"
                  label={`${q.rewardXp}`}
                />
              </View>
            ))}
          </Card>
        )}

        <SectionHeader title={String(i18n.t("quests.daily"))} />
        {daily.map(renderQuest)}

        {weekly.length > 0 && (
          <>
            <SectionHeader title={String(i18n.t("quests.weekly"))} />
            {weekly.map(renderQuest)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scroll: { padding: theme.spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  xpText: { fontSize: 18, fontWeight: "700", color: theme.colors.accent },
  monthlyCard: { marginBottom: theme.spacing.md, padding: theme.spacing.lg },
  monthlyLabel: { fontSize: 16, fontWeight: "700", color: theme.colors.accent, marginBottom: theme.spacing.sm },
  monthlyRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  monthlyInfo: { flex: 1 },
  monthlyTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, marginBottom: theme.spacing.xs },
  monthlyProgress: { fontSize: 12, color: theme.colors.sub, marginTop: theme.spacing.xs },
  questCard: { marginBottom: theme.spacing.sm },
  questRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  questInfo: { flex: 1 },
  questTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  questDesc: { fontSize: 12, color: theme.colors.sub, marginTop: 2 },
  progressBar: { marginTop: theme.spacing.xs },
});
