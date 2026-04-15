import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../lib/theme";
import { useEconomyState, useProgressionState } from "../../lib/state";
import { COURSE_THEME_COLORS } from "../../lib/courseWorldModel";
import { useAuth } from "../../lib/AuthContext";
import { GlobalHeader } from "../../components/GlobalHeader";
import { StreakCalendar } from "../../components/StreakCalendar";
import i18n from "../../lib/i18n";
import { useToast } from "../../components/ToastProvider";
import {
  EventCampaignSection,
  MonthlyQuestSection,
  QuestSection,
} from "../../components/quests/QuestSections";
import { useQuestEventImpressions } from "../../lib/quests/useQuestEventImpressions";

function getTodayKeyFromNow(nowMs: number): string {
  const date = new Date(nowMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRemaining(remainingMs: number): string {
  const safeMs = Math.max(0, remainingMs);
  const totalHours = Math.floor(safeMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${Math.max(0, hours)}h`;
}

export default function QuestsScreen() {
  const {
    xp,
    quests,
    claimQuest,
    rerollQuest,
    streakHistory,
    eventCampaign,
    eventQuests,
    selectedGenre,
  } = useProgressionState();
  const themeColor = COURSE_THEME_COLORS[selectedGenre] ?? COURSE_THEME_COLORS.mental;
  const { dailyQuestRerollRemaining } = useEconomyState();
  const { user } = useAuth();
  const { showToast } = useToast();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const scrollBottomInset = bottomTabBarHeight + theme.spacing.lg;
  const currentMonth = new Date().getMonth() + 1;
  const [nowMs, setNowMs] = useState(() => Date.now());

  const monthly = quests.filter((q) => q.type === "monthly");
  const daily = quests.filter((q) => q.type === "daily");
  const weekly = quests.filter((q) => q.type === "weekly");
  type QuestItem = (typeof quests)[number];
  const eventRemainingMs = useMemo(() => {
    if (!eventCampaign) return 0;
    const endMs = new Date(eventCampaign.endAt).getTime();
    if (!Number.isFinite(endMs)) return 0;
    return Math.max(0, endMs - nowMs);
  }, [eventCampaign, nowMs]);
  const todayKey = getTodayKeyFromNow(nowMs);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useQuestEventImpressions({
    eventCampaign,
    todayKey,
    userId: user?.id,
  });

  const showRerollError = (
    reason?:
      | "disabled"
      | "invalid_type"
      | "limit_reached"
      | "insufficient_gems"
      | "already_completed"
      | "no_candidate"
  ) => {
    const key = reason ?? "no_candidate";
    showToast(String(i18n.t(`quests.reroll.errors.${key}`)), "error");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="quests-screen">
      <GlobalHeader />
      <ScrollView
        testID="quests-scroll"
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomInset }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>{i18n.t("quests.monthTitle", { month: currentMonth })}</Text>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>

        <View testID="quests-streak-calendar">
          <StreakCalendar history={streakHistory} />
        </View>

        {eventCampaign && eventQuests.length > 0 ? (
          <EventCampaignSection
            eventCampaign={eventCampaign}
            eventQuests={eventQuests}
            eventRemainingLabel={formatRemaining(eventRemainingMs)}
            themeColor={themeColor}
          />
        ) : null}

        <MonthlyQuestSection quests={monthly as QuestItem[]} onClaim={claimQuest} themeColor={themeColor} />
        <QuestSection
          title={String(i18n.t("quests.daily"))}
          quests={daily as QuestItem[]}
          dailyQuestRerollRemaining={dailyQuestRerollRemaining}
          onClaim={claimQuest}
          themeColor={themeColor}
          onReroll={(questId) => {
            const result = rerollQuest(questId);
            if (!result.success) {
              showRerollError(result.reason);
            }
          }}
        />
        <QuestSection
          title={String(i18n.t("quests.weekly"))}
          quests={weekly as QuestItem[]}
          dailyQuestRerollRemaining={dailyQuestRerollRemaining}
          onClaim={claimQuest}
          themeColor={themeColor}
          onReroll={(questId) => {
            const result = rerollQuest(questId);
            if (!result.success) {
              showRerollError(result.reason);
            }
          }}
        />
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
});
