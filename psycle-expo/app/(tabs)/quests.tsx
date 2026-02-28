import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../../lib/theme";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/AuthContext";
import { Analytics } from "../../lib/analytics";
import { Card, ProgressBar, SectionHeader } from "../../components/ui";
import { Chest } from "../../components/Chest";
import { GlobalHeader } from "../../components/GlobalHeader";
import { StreakCalendar } from "../../components/StreakCalendar";
import i18n from "../../lib/i18n";

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
    dailyQuestRerollRemaining,
    streakHistory,
    eventCampaign,
    eventQuests,
  } = useAppState();
  const { user } = useAuth();
  const currentMonth = new Date().getMonth() + 1;
  const [nowMs, setNowMs] = useState(() => Date.now());

  const monthly = quests.filter((q) => q.type === "monthly");
  const daily = quests.filter((q) => q.type === "daily");
  const weekly = quests.filter((q) => q.type === "weekly");
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

  useEffect(() => {
    if (!eventCampaign) return;
    const userId = user?.id ?? "local";
    const key = `event_campaign_impressions_${userId}_${eventCampaign.id}`;

    const trackEventSectionShown = async () => {
      let nextState = {
        eventShownDate: null as string | null,
        communityGoalShownDate: null as string | null,
      };

      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<typeof nextState>;
          nextState = {
            eventShownDate:
              typeof parsed.eventShownDate === "string" ? parsed.eventShownDate : null,
            communityGoalShownDate:
              typeof parsed.communityGoalShownDate === "string"
                ? parsed.communityGoalShownDate
                : null,
          };
        }
      } catch (error) {
        console.error("[EventCampaign] Failed to read impression state:", error);
      }

      let hasUpdate = false;

      if (nextState.eventShownDate !== todayKey) {
        Analytics.track("event_shown", {
          eventId: eventCampaign.id,
          source: "quests_tab",
        });
        nextState.eventShownDate = todayKey;
        hasUpdate = true;
      }

      if (nextState.communityGoalShownDate !== todayKey) {
        Analytics.track("community_goal_shown", {
          eventId: eventCampaign.id,
          targetLessons: eventCampaign.communityTargetLessons,
          source: "quests_tab",
        });
        nextState.communityGoalShownDate = todayKey;
        hasUpdate = true;
      }

      if (hasUpdate) {
        try {
          await AsyncStorage.setItem(key, JSON.stringify(nextState));
        } catch (error) {
          console.error("[EventCampaign] Failed to persist impression state:", error);
        }
      }
    };

    trackEventSectionShown().catch((error) => {
      console.error("[EventCampaign] Failed to track impressions:", error);
    });
  }, [eventCampaign, todayKey, user?.id]);

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
    Alert.alert(String(i18n.t("common.error")), String(i18n.t(`quests.reroll.errors.${key}`)));
  };

  const renderQuest = (q: any) => {
    const completed = q.progress >= q.need;
    const canClaim = completed && !q.claimed;
    const title = q.titleKey ? String(i18n.t(q.titleKey)) : q.title;
    const canReroll = q.type === "daily" || q.type === "weekly";

    return (
      <Card key={q.id} style={styles.questCard}>
        <View style={styles.questRow}>
          <View style={styles.questInfo}>
            <Text style={styles.questTitle}>{title}</Text>
            <Text style={styles.questDesc}>
              {q.progress} / {q.need}
            </Text>
            <ProgressBar value={q.progress} max={q.need} style={styles.progressBar} />
            {canReroll && (
              <View style={styles.rerollRow}>
                <Pressable
                  style={({ pressed }) => [styles.rerollButton, pressed && styles.rerollButtonPressed]}
                  onPress={() => {
                    const result = rerollQuest(q.id);
                    if (!result.success) {
                      showRerollError(result.reason);
                    }
                  }}
                >
                  <Text style={styles.rerollButtonText}>{i18n.t("quests.reroll.cta")}</Text>
                </Pressable>
                <Text style={styles.rerollRemaining}>
                  {i18n.t("quests.reroll.remaining", { count: dailyQuestRerollRemaining })}
                </Text>
              </View>
            )}
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
        <StreakCalendar history={streakHistory} />

        {eventCampaign && eventQuests.length > 0 && (
          <Card style={styles.eventCard}>
            <View style={styles.eventHeaderRow}>
              <Text style={styles.eventTitle}>{i18n.t(eventCampaign.titleKey)}</Text>
              <Text style={styles.eventRemaining}>
                {i18n.t("quests.event.remaining", {
                  time: formatRemaining(eventRemainingMs),
                })}
              </Text>
            </View>
            <Text style={styles.eventCommunityGoal}>
              {i18n.t("quests.event.communityGoal", {
                target: eventCampaign.communityTargetLessons,
              })}
            </Text>
            <View style={styles.eventQuestList}>
              {eventQuests.map((quest) => {
                const completed = quest.claimed || quest.progress >= quest.need;
                return (
                  <View key={quest.id} style={styles.eventQuestRow}>
                    <View style={styles.eventQuestInfo}>
                      <Text style={styles.eventQuestTitle}>{i18n.t(quest.titleKey)}</Text>
                      <Text style={styles.eventQuestProgress}>
                        {quest.progress} / {quest.need}
                      </Text>
                      <ProgressBar value={quest.progress} max={quest.need} style={styles.progressBar} />
                    </View>
                    <View style={styles.eventQuestReward}>
                      <Text style={styles.eventQuestGems}>+{quest.rewardGems} Gems</Text>
                      {completed && (
                        <Text style={styles.eventQuestCompleted}>{i18n.t("quests.event.completed")}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {monthly.length > 0 && (
          <Card style={styles.monthlyCard}>
            <Text style={styles.monthlyLabel}>{i18n.t("quests.monthly")}</Text>
            {monthly.map((q) => (
              <View key={q.id} style={styles.monthlyRow}>
                <View style={styles.monthlyInfo}>
                  <Text style={styles.monthlyTitle}>
                    {q.titleKey ? String(i18n.t(q.titleKey)) : q.title}
                  </Text>
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
  eventCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderColor: theme.colors.accent,
    borderWidth: 1,
  },
  eventHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  eventRemaining: {
    fontSize: 12,
    color: theme.colors.warn,
    fontWeight: "700",
  },
  eventCommunityGoal: {
    fontSize: 13,
    color: theme.colors.sub,
    marginBottom: theme.spacing.sm,
  },
  eventQuestList: {
    gap: theme.spacing.sm,
  },
  eventQuestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  eventQuestInfo: {
    flex: 1,
  },
  eventQuestTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  eventQuestProgress: {
    fontSize: 12,
    color: theme.colors.sub,
    marginTop: 2,
  },
  eventQuestReward: {
    alignItems: "flex-end",
    minWidth: 84,
  },
  eventQuestGems: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  eventQuestCompleted: {
    fontSize: 11,
    color: theme.colors.success,
    marginTop: 4,
    fontWeight: "700",
  },
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
  rerollRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  rerollButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  rerollButtonPressed: {
    opacity: 0.7,
  },
  rerollButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  rerollRemaining: {
    fontSize: 11,
    color: theme.colors.sub,
  },
});
