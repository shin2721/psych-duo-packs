import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, ProgressBar, SectionHeader } from "../ui";
import { Chest } from "../Chest";
import { theme } from "../../lib/theme";
import i18n from "../../lib/i18n";

export interface QuestCardItem {
  id: string;
  type: "daily" | "weekly" | "monthly";
  title: string;
  titleKey?: string;
  progress: number;
  need: number;
  rewardXp: number;
  claimed?: boolean;
  chestState: "closed" | "opening" | "opened";
}

export interface EventQuestCardItem {
  id: string;
  titleKey: string;
  progress: number;
  need: number;
  rewardGems: number;
  claimed?: boolean;
}

export function QuestCard({
  quest,
  dailyQuestRerollRemaining,
  onClaim,
  onReroll,
  themeColor,
}: {
  quest: QuestCardItem;
  dailyQuestRerollRemaining: number;
  onClaim: (questId: string) => void;
  onReroll: (questId: string) => void;
  themeColor?: string;
}) {
  const completed = quest.progress >= quest.need;
  const canClaim = completed && !quest.claimed;
  const title = quest.titleKey ? String(i18n.t(quest.titleKey)) : quest.title;
  const canReroll = quest.type === "daily" || quest.type === "weekly";
  const canRerollAction = canReroll && !completed && dailyQuestRerollRemaining > 0;

  return (
    <View key={quest.id} testID={`quest-card-${quest.type}-${quest.id}`}>
      <Card style={styles.questCard}>
        <View style={styles.questRow}>
          <View style={styles.questInfo}>
            <Text style={styles.questTitle} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
            <Text style={styles.questDesc}>
              {quest.progress} / {quest.need}
            </Text>
            <ProgressBar value={quest.progress} max={quest.need} style={styles.progressBar} color={themeColor} />
            {canReroll ? (
              <View style={styles.rerollRow}>
                <Pressable
                  disabled={!canRerollAction}
                  testID={`quest-reroll-${quest.id}`}
                  style={({ pressed }) => [
                    styles.rerollButton,
                    !canRerollAction && styles.rerollButtonDisabled,
                    pressed && canRerollAction && styles.rerollButtonPressed,
                  ]}
                  onPress={() => {
                    if (!canRerollAction) return;
                    onReroll(quest.id);
                  }}
                >
                  <Text style={styles.rerollButtonText}>{i18n.t("quests.reroll.cta")}</Text>
                </Pressable>
                <Text style={styles.rerollRemaining}>
                  {i18n.t("quests.reroll.remaining", { count: dailyQuestRerollRemaining })}
                </Text>
              </View>
            ) : null}
          </View>
          <Chest
            state={quest.chestState}
            onOpen={canClaim ? () => onClaim(quest.id) : undefined}
            size="sm"
            label={`${quest.rewardXp}`}
            testID={`quest-chest-${quest.id}`}
          />
        </View>
      </Card>
    </View>
  );
}

export function QuestSection({
  title,
  quests,
  dailyQuestRerollRemaining,
  onClaim,
  onReroll,
  themeColor,
}: {
  title: string;
  quests: QuestCardItem[];
  dailyQuestRerollRemaining: number;
  onClaim: (questId: string) => void;
  onReroll: (questId: string) => void;
  themeColor?: string;
}) {
  if (quests.length === 0) return null;

  return (
    <>
      <SectionHeader title={title} />
      {quests.map((quest) => (
        <QuestCard
          key={quest.id}
          quest={quest}
          dailyQuestRerollRemaining={dailyQuestRerollRemaining}
          onClaim={onClaim}
          onReroll={onReroll}
          themeColor={themeColor}
        />
      ))}
    </>
  );
}

export function MonthlyQuestSection({
  quests,
  onClaim,
  themeColor,
}: {
  quests: QuestCardItem[];
  onClaim: (questId: string) => void;
  themeColor?: string;
}) {
  if (quests.length === 0) return null;

  return (
    <View testID="quests-monthly-card">
      <Card style={styles.monthlyCard}>
        <Text style={styles.monthlyLabel}>{i18n.t("quests.monthly")}</Text>
        {quests.map((quest) => (
          <View key={quest.id} style={styles.monthlyRow} testID={`quests-monthly-${quest.id}`}>
            <View style={styles.monthlyInfo}>
              <Text style={styles.monthlyTitle}>
                {quest.titleKey ? String(i18n.t(quest.titleKey)) : quest.title}
              </Text>
              <ProgressBar value={quest.progress} max={quest.need} style={styles.progressBar} color={themeColor} />
              <Text style={styles.monthlyProgress}>
                {quest.progress} / {quest.need}
              </Text>
            </View>
            <Chest
              state={quest.chestState}
              onOpen={quest.progress >= quest.need && !quest.claimed ? () => onClaim(quest.id) : undefined}
              size="md"
              label={`${quest.rewardXp}`}
              testID={`quest-chest-${quest.id}`}
            />
          </View>
        ))}
      </Card>
    </View>
  );
}

export function EventCampaignSection({
  eventCampaign,
  eventQuests,
  eventRemainingLabel,
  themeColor,
}: {
  eventCampaign: {
    titleKey: string;
    communityTargetLessons: number;
  };
  eventQuests: EventQuestCardItem[];
  eventRemainingLabel: string;
  themeColor?: string;
}) {
  if (eventQuests.length === 0) return null;

  return (
    <View testID="quests-event-card">
      <Card style={styles.eventCard}>
        <View style={styles.eventHeaderRow}>
          <Text style={styles.eventTitle}>{i18n.t(eventCampaign.titleKey)}</Text>
          <Text style={styles.eventRemaining}>
            {i18n.t("quests.event.remaining", { time: eventRemainingLabel })}
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
              <View key={quest.id} style={styles.eventQuestRow} testID={`quests-event-${quest.id}`}>
                <View style={styles.eventQuestInfo}>
                  <Text style={styles.eventQuestTitle}>{i18n.t(quest.titleKey)}</Text>
                  <Text style={styles.eventQuestProgress}>
                    {quest.progress} / {quest.need}
                  </Text>
                  <ProgressBar value={quest.progress} max={quest.need} style={styles.progressBar} color={themeColor} />
                </View>
                <View style={styles.eventQuestReward}>
                  <Text style={styles.eventQuestGems}>+{quest.rewardGems} Gems</Text>
                  {completed ? (
                    <Text style={styles.eventQuestCompleted}>{i18n.t("quests.event.completed")}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
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
  monthlyCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  monthlyLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.accent,
    marginBottom: theme.spacing.sm,
  },
  monthlyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  monthlyInfo: {
    flex: 1,
  },
  monthlyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  monthlyProgress: {
    fontSize: 12,
    color: theme.colors.sub,
    marginTop: theme.spacing.xs,
  },
  questCard: {
    marginBottom: theme.spacing.sm,
  },
  questRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  questDesc: {
    fontSize: 12,
    color: theme.colors.sub,
    marginTop: 2,
  },
  progressBar: {
    marginTop: theme.spacing.xs,
  },
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
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  rerollButtonPressed: {
    opacity: 0.7,
  },
  rerollButtonDisabled: {
    opacity: 0.4,
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
