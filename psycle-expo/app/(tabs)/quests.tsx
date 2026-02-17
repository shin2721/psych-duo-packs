import React, { useCallback, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { theme } from "../../lib/theme";
import { useAppState } from "../../lib/state";
import { Card, ProgressBar, SectionHeader } from "../../components/ui";
import { Chest } from "../../components/Chest";
import { GlobalHeader } from "../../components/GlobalHeader";
import { StreakCalendar } from "../../components/StreakCalendar";
import {
  getStreakData,
  getStudyStreakRiskStatus,
  markStreakVisibilityShown,
} from "../../lib/streaks";
import i18n from "../../lib/i18n";
import {
  ActionJournalComposer,
  JournalResult,
  TryOption,
  getActionJournalComposer,
  submitActionJournal,
} from "../../lib/actionJournal";
import { Analytics } from "../../lib/analytics";
import {
  autoClaimEligibleQuestRewards,
  QuestBoard,
  QuestAutoClaimResult,
  QuestBoardItem,
  getQuestBoard,
} from "../../lib/questsV2";

type CalendarDay = {
  date: string;
  xp: number;
  lessonsCompleted: number;
};

export default function QuestsScreen() {
  const { xp, selectedGenre, addXp, addGems, grantFreezes, awardBadgeById } = useAppState();
  const [calendarHistory, setCalendarHistory] = useState<CalendarDay[]>([]);
  const [journalComposer, setJournalComposer] = useState<ActionJournalComposer | null>(null);
  const [questBoard, setQuestBoard] = useState<QuestBoard | null>(null);
  const [selectedTryOptionId, setSelectedTryOptionId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<JournalResult | null>(null);
  const [journalNote, setJournalNote] = useState("");
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);
  const [openingChestIds, setOpeningChestIds] = useState<string[]>([]);
  const [inlineNoticeLines, setInlineNoticeLines] = useState<string[]>([]);
  const [isEditingTodayEntry, setIsEditingTodayEntry] = useState(false);
  const questClaimedSnapshotRef = useRef<Record<string, boolean>>({});
  const [streakVisibility, setStreakVisibility] = useState<{
    riskType: "safe_today" | "break_streak" | "consume_freeze";
    studyStreak: number;
    freezesRemaining: number;
    todayStudied: boolean;
  } | null>(null);
  const currentMonth = new Date().getMonth() + 1;

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

      const loadJournalComposer = async () => {
        const composer = await getActionJournalComposer(selectedGenre);
        if (!isActive) return;

        setJournalComposer(composer);

        const hasCurrentTryOption = composer.todayEntry
          ? composer.tryOptions.some((option) => option.id === composer.todayEntry?.tryOptionId)
          : false;
        const initialTryOptionId = hasCurrentTryOption
          ? composer.todayEntry?.tryOptionId || null
          : composer.tryOptions[0]?.id || null;
        const initialResult = composer.todayEntry
          ? (hasCurrentTryOption ? composer.todayEntry.result : null)
          : (initialTryOptionId === "not_tried" ? "not_tried" : null);

        setSelectedTryOptionId(initialTryOptionId);
        setSelectedResult(initialResult);
        setJournalNote(composer.todayEntry?.note || "");
        setIsEditingTodayEntry(!composer.todayEntry);

        Analytics.track("action_journal_opened", {
          source: "quests_tab",
          genreId: selectedGenre,
          hasTodayEntry: Boolean(composer.todayEntry),
        });
      };

      const loadQuestBoard = async () => {
        const board = await getQuestBoard();
        if (!isActive) return;
        setQuestBoardWithTransitions(board);
        Analytics.track("quest_board_opened", {
          source: "quests_tab",
          dailyCompleted: board.bundleStatus.daily.completedCount,
          dailyTotal: board.bundleStatus.daily.totalCount,
          weeklyCompleted: board.bundleStatus.weekly.completedCount,
          weeklyTotal: board.bundleStatus.weekly.totalCount,
          monthlyCompleted: board.bundleStatus.monthly.completedCount,
          monthlyTotal: board.bundleStatus.monthly.totalCount,
          hasXpBoostTicket: board.xpBoost.hasTicket,
          xpBoostActive: board.xpBoost.active,
        });
      };

      const loadStreakVisibility = async () => {
        const status = await getStudyStreakRiskStatus();
        if (!isActive) return;
        setStreakVisibility(status);
        const shownRecorded = await markStreakVisibilityShown("quests_tab");
        if (shownRecorded) {
          Analytics.track("streak_visibility_shown", {
            source: "quests_tab",
            riskType: status.riskType,
            studyStreak: status.studyStreak,
            freezesRemaining: status.freezesRemaining,
            todayStudied: status.todayStudied,
          });
        }
      };

      Promise.all([loadCalendarHistory(), loadJournalComposer(), loadQuestBoard(), loadStreakVisibility()]).catch(console.error);
      return () => {
        isActive = false;
      };
    }, [selectedGenre])
  );

  function buildClaimSnapshot(board: QuestBoard): Record<string, boolean> {
    const snapshot: Record<string, boolean> = {};
    [...board.daily, ...board.weekly, ...board.monthly].forEach((item) => {
      snapshot[item.id] = item.claimed;
    });
    return snapshot;
  }

  function setQuestBoardWithTransitions(board: QuestBoard) {
    const previousSnapshot = questClaimedSnapshotRef.current;
    const nextSnapshot = buildClaimSnapshot(board);
    const hasPrevious = Object.keys(previousSnapshot).length > 0;

    if (hasPrevious) {
      const justClaimed = Object.keys(nextSnapshot).filter(
        (questId) => nextSnapshot[questId] && !previousSnapshot[questId]
      );
      if (justClaimed.length > 0) {
        setOpeningChestIds((prev) => [...new Set([...prev, ...justClaimed])]);
        setTimeout(() => {
          setOpeningChestIds((prev) => prev.filter((id) => !justClaimed.includes(id)));
        }, 1200);
      }
    }

    questClaimedSnapshotRef.current = nextSnapshot;
    setQuestBoard(board);
  }

  function showInlineNotice(lines: string[]) {
    if (lines.length === 0) return;
    setInlineNoticeLines(lines);
    setTimeout(() => {
      setInlineNoticeLines([]);
    }, 3500);
  }

  async function applyAutoClaimRewards(result: QuestAutoClaimResult): Promise<string[]> {
    const lines: string[] = [];

    if (result.claimedGems > 0) {
      addGems(result.claimedGems);
      lines.push(i18n.t("quests.v2.autoClaimGems", { gems: result.claimedGems }));
    }
    if (result.weeklyFreezesGranted > 0) {
      await grantFreezes(result.weeklyFreezesGranted);
      lines.push(i18n.t("quests.v2.autoClaimFreeze", { count: result.weeklyFreezesGranted }));
    }
    if (result.monthlyBadgeId) {
      await awardBadgeById(result.monthlyBadgeId);
      lines.push(i18n.t("quests.v2.autoClaimBadge"));
    }
    if (result.dailyTicketGranted) {
      lines.push(i18n.t("quests.v2.dailyBundleGranted"));
    }
    if (result.dailyTicketQueued) {
      lines.push(i18n.t("quests.v2.boostTicketQueued", { date: result.dailyTicketQueuedValidDate || "-" }));
    }
    if (result.dailyTicketBlocked) {
      lines.push(i18n.t("quests.v2.autoClaimTicketBlocked"));
    }

    return lines;
  }

  const isNotTriedSelected = selectedTryOptionId === "not_tried";
  const resultOptions: JournalResult[] = isNotTriedSelected
    ? ["not_tried"]
    : ([-2, -1, 0, 1, 2] as JournalResult[]);

  function getTryLabel(option: TryOption): string {
    if (option.id === "not_tried") return i18n.t("quests.actionJournal.notTried");
    return option.label;
  }

  function getStreakVisibilityBody(): string {
    if (!streakVisibility) return "";
    if (streakVisibility.riskType === "safe_today") return i18n.t("course.streakVisibility.safeToday");
    if (streakVisibility.riskType === "consume_freeze") return i18n.t("course.streakVisibility.consumeFreeze");
    return i18n.t("course.streakVisibility.breakStreak");
  }

  function handleStreakVisibilityPress() {
    if (!streakVisibility) return;
    Analytics.track("streak_visibility_clicked", {
      source: "quests_tab",
      riskType: streakVisibility.riskType,
      studyStreak: streakVisibility.studyStreak,
      freezesRemaining: streakVisibility.freezesRemaining,
      todayStudied: streakVisibility.todayStudied,
    });
    router.push("/(tabs)/course");
  }

  function getResultLabel(result: JournalResult): string {
    if (result === "not_tried") return i18n.t("quests.actionJournal.resultNotTried");
    if (result === -2) return i18n.t("quests.actionJournal.resultScale.minus2");
    if (result === -1) return i18n.t("quests.actionJournal.resultScale.minus1");
    if (result === 0) return i18n.t("quests.actionJournal.resultScale.zero");
    if (result === 1) return i18n.t("quests.actionJournal.resultScale.plus1");
    return i18n.t("quests.actionJournal.resultScale.plus2");
  }

  function handleTryOptionPress(option: TryOption) {
    setSelectedTryOptionId(option.id);
    if (option.id === "not_tried") {
      setSelectedResult("not_tried");
      return;
    }
    if (selectedResult === "not_tried") {
      setSelectedResult(null);
    }
  }

  async function handleSubmitJournal() {
    if (!journalComposer || !selectedTryOptionId) {
      Alert.alert(i18n.t("common.error"), i18n.t("quests.actionJournal.validationTry"));
      return;
    }

    if (!selectedResult) {
      Alert.alert(i18n.t("common.error"), i18n.t("quests.actionJournal.validationResult"));
      return;
    }

    const option = journalComposer.tryOptions.find((item) => item.id === selectedTryOptionId);
    if (!option) {
      Alert.alert(i18n.t("common.error"), i18n.t("quests.actionJournal.validationTry"));
      return;
    }

    const resultToSubmit: JournalResult = selectedTryOptionId === "not_tried" ? "not_tried" : selectedResult;
    if (selectedTryOptionId !== "not_tried" && resultToSubmit === "not_tried") {
      Alert.alert(i18n.t("common.error"), i18n.t("quests.actionJournal.validationResult"));
      return;
    }

    try {
      setIsSubmittingJournal(true);
      const submitResult = await submitActionJournal({
        genreId: selectedGenre,
        tryOptionId: selectedTryOptionId,
        tryLabel: option.label,
        result: resultToSubmit,
        note: journalNote,
      });

      if (submitResult.xpAwarded && submitResult.rewardXp > 0) {
        await addXp(submitResult.rewardXp, "journal");
      }

      const autoClaimResult = await autoClaimEligibleQuestRewards({ source: "journal_submit" });
      const autoClaimLines = await applyAutoClaimRewards(autoClaimResult);

      Analytics.track("action_journal_submitted", {
        source: "quests_tab",
        genreId: selectedGenre,
        tryOptionId: selectedTryOptionId,
        tryOrigin: option.origin,
        tryPosition: option.position,
        result: resultToSubmit,
        noteAttached: Boolean(journalNote.trim()),
        xpAwarded: submitResult.xpAwarded,
        rewardXp: submitResult.rewardXp,
      });

      const composer = await getActionJournalComposer(selectedGenre);
      setJournalComposer(composer);
      const hasCurrentTryOption = composer.todayEntry
        ? composer.tryOptions.some((item) => item.id === composer.todayEntry?.tryOptionId)
        : false;
      setSelectedTryOptionId(hasCurrentTryOption ? composer.todayEntry?.tryOptionId || null : composer.tryOptions[0]?.id || null);
      setSelectedResult(hasCurrentTryOption ? composer.todayEntry?.result || resultToSubmit : null);
      setJournalNote(composer.todayEntry?.note || journalNote);
      setIsEditingTodayEntry(false);
      await refreshQuestBoard();
      showInlineNotice([
        i18n.t("quests.actionJournal.submitted"),
        ...autoClaimLines,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.t("common.error");
      Alert.alert(i18n.t("common.error"), message);
    } finally {
      setIsSubmittingJournal(false);
    }
  }

  function handleEditTodayEntry() {
    if (!journalComposer?.todayEntry) return;
    const hasCurrentTryOption = journalComposer.tryOptions.some(
      (item) => item.id === journalComposer.todayEntry?.tryOptionId
    );
    setSelectedTryOptionId(
      hasCurrentTryOption
        ? journalComposer.todayEntry.tryOptionId
        : journalComposer.tryOptions[0]?.id || null
    );
    setSelectedResult(
      hasCurrentTryOption
        ? journalComposer.todayEntry.result
        : journalComposer.tryOptions[0]?.id === "not_tried"
          ? "not_tried"
          : null
    );
    setJournalNote(journalComposer.todayEntry.note || "");
    setIsEditingTodayEntry(true);
  }

  function getQuestTitle(item: QuestBoardItem): string {
    const map: Record<string, string> = {
      daily_lesson_1: String(i18n.t("quests.v2.dailyLesson1")),
      daily_lesson_3: String(i18n.t("quests.v2.dailyLesson3")),
      daily_journal_1: String(i18n.t("quests.v2.dailyJournal1")),
      weekly_study_days_5: String(i18n.t("quests.v2.weeklyStudyDays5")),
      weekly_lessons_15: String(i18n.t("quests.v2.weeklyLessons15")),
      weekly_journal_3: String(i18n.t("quests.v2.weeklyJournal3")),
      monthly_study_days_20: String(i18n.t("quests.v2.monthlyStudyDays20")),
      monthly_lessons_60: String(i18n.t("quests.v2.monthlyLessons60")),
    };
    return map[item.id] || item.id;
  }

  function getChestState(item: QuestBoardItem): "closed" | "opening" | "opened" {
    if (item.claimed) {
      if (openingChestIds.includes(item.id)) return "opening";
      return "opened";
    }
    return "closed";
  }

  async function refreshQuestBoard() {
    const board = await getQuestBoard();
    setQuestBoardWithTransitions(board);
  }

  const daily = questBoard?.daily || [];
  const weekly = questBoard?.weekly || [];
  const monthly = questBoard?.monthly || [];

  const renderQuest = (q: QuestBoardItem) => {
    return (
      <Card key={q.id} style={styles.questCard}>
        <View style={styles.questRow}>
          <View style={styles.questInfo}>
            <Text style={styles.questTitle}>{getQuestTitle(q)}</Text>
            <Text style={styles.questDesc}>
              {q.progress} / {q.target}
            </Text>
            <ProgressBar value={q.progress} max={q.target} style={styles.progressBar} />
          </View>
          <Chest
            state={getChestState(q)}
            size="sm"
            label={`${q.rewardGems}`}
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

        {questBoard && (
          <Card style={styles.bundleStatusCard}>
            <Text style={styles.bundleStatusTitle}>{i18n.t("quests.v2.statusTitle")}</Text>
            <Text style={styles.bundleStatusText}>
              {i18n.t("quests.v2.dailyProgress", {
                done: questBoard.bundleStatus.daily.completedCount,
                total: questBoard.bundleStatus.daily.totalCount,
              })}
            </Text>
            <Text style={styles.bundleStatusText}>
              {questBoard.xpBoost.active
                ? i18n.t("quests.v2.boostActive", {
                  minutes: Math.max(1, Math.ceil(questBoard.xpBoost.remainingMs / 60000)),
                })
                : questBoard.xpBoost.hasTicket
                  ? i18n.t("quests.v2.boostTicketReady", { date: questBoard.xpBoost.validDate || "-" })
                  : i18n.t("quests.v2.boostNoTicket")}
            </Text>
            {questBoard.xpBoost.queuedValidDate && (
              <Text style={styles.bundleStatusText}>
                {i18n.t("quests.v2.boostTicketQueued", { date: questBoard.xpBoost.queuedValidDate })}
              </Text>
            )}
          </Card>
        )}

        {inlineNoticeLines.length > 0 && (
          <Card style={styles.inlineNoticeCard}>
            <Text style={styles.inlineNoticeTitle}>{i18n.t("quests.v2.autoClaimSummary")}</Text>
            {inlineNoticeLines.map((line, idx) => (
              <Text key={`${line}_${idx}`} style={styles.inlineNoticeLine}>
                • {line}
              </Text>
            ))}
          </Card>
        )}

        <Card style={styles.journalCard}>
          <Text style={styles.journalTitle}>{i18n.t("quests.actionJournal.title")}</Text>
          <Text style={styles.journalSubtitle}>{i18n.t("quests.actionJournal.subtitle")}</Text>
          {journalComposer?.todayEntry && !isEditingTodayEntry ? (
            <View style={styles.journalSummaryBox}>
              <Text style={styles.journalSummaryLabel}>{i18n.t("quests.actionJournal.submitted")}</Text>
              <Text style={styles.journalSummaryItem}>
                {i18n.t("quests.actionJournal.tryLabel")}:{" "}
                {journalComposer.todayEntry.tryOptionId === "not_tried"
                  ? i18n.t("quests.actionJournal.notTried")
                  : journalComposer.todayEntry.tryLabel}
              </Text>
              <Text style={styles.journalSummaryItem}>
                {i18n.t("quests.actionJournal.resultLabel")}:{" "}
                {getResultLabel(journalComposer.todayEntry.result)}
              </Text>
              {journalComposer.todayEntry.note ? (
                <Text style={styles.journalSummaryItem}>
                  {journalComposer.todayEntry.note}
                </Text>
              ) : null}
              <Text style={styles.journalSubmittedText}>{i18n.t("quests.actionJournal.reward")}</Text>
              <Pressable style={styles.journalEditButton} onPress={handleEditTodayEntry}>
                <Text style={styles.journalEditButtonText}>{i18n.t("quests.actionJournal.edit")}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.journalFieldLabel}>{i18n.t("quests.actionJournal.tryLabel")}</Text>
              <View style={styles.journalChipWrap}>
                {(journalComposer?.tryOptions || []).map((option) => {
                  const selected = selectedTryOptionId === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[styles.journalChip, selected && styles.journalChipSelected]}
                      onPress={() => handleTryOptionPress(option)}
                    >
                      <Text style={[styles.journalChipText, selected && styles.journalChipTextSelected]}>
                        {getTryLabel(option)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.journalFieldLabel}>{i18n.t("quests.actionJournal.resultLabel")}</Text>
              <View style={styles.journalChipWrap}>
                {resultOptions.map((result) => {
                  const selected = selectedResult === result;
                  return (
                    <Pressable
                      key={String(result)}
                      style={[styles.journalChip, selected && styles.journalChipSelected]}
                      onPress={() => setSelectedResult(result)}
                    >
                      <Text style={[styles.journalChipText, selected && styles.journalChipTextSelected]}>
                        {getResultLabel(result)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                multiline
                value={journalNote}
                onChangeText={setJournalNote}
                placeholder={i18n.t("quests.actionJournal.notePlaceholder")}
                placeholderTextColor={theme.colors.sub}
                style={styles.journalNoteInput}
              />

              {journalComposer?.todayEntry && (
                <Text style={styles.journalSubmittedText}>
                  {i18n.t("quests.actionJournal.reward")}
                </Text>
              )}

              <Pressable
                style={[styles.journalSubmitButton, isSubmittingJournal && styles.journalSubmitButtonDisabled]}
                onPress={handleSubmitJournal}
                disabled={isSubmittingJournal}
              >
                <Text style={styles.journalSubmitButtonText}>
                  {isSubmittingJournal ? i18n.t("common.loading") : i18n.t("quests.actionJournal.submit")}
                </Text>
              </Pressable>
            </>
          )}
        </Card>

        {streakVisibility && (
          <Card style={styles.streakVisibilityCard}>
            <Text style={styles.streakVisibilityTitle}>{i18n.t("course.streakVisibility.title")}</Text>
            <Text style={styles.streakVisibilityBody}>{getStreakVisibilityBody()}</Text>
            <Pressable style={styles.streakVisibilityButton} onPress={handleStreakVisibilityPress}>
              <Text style={styles.streakVisibilityButtonText}>{i18n.t("course.streakVisibility.cta")}</Text>
            </Pressable>
          </Card>
        )}

        {/* Streak Calendar */}
        <StreakCalendar history={calendarHistory} />

        {monthly.length > 0 && (
          <Card style={styles.monthlyCard}>
            <Text style={styles.monthlyLabel}>{i18n.t("quests.monthly")}</Text>
            {monthly.map((q) => (
              <View key={q.id} style={styles.monthlyRow}>
                <View style={styles.monthlyInfo}>
                  <Text style={styles.monthlyTitle}>{getQuestTitle(q)}</Text>
                  <ProgressBar value={q.progress} max={q.target} style={styles.progressBar} />
                  <Text style={styles.monthlyProgress}>
                    {q.progress} / {q.target}
                  </Text>
                </View>
                <Chest
                  state={getChestState(q)}
                  size="md"
                  label={`${q.rewardGems}`}
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
  bundleStatusCard: { marginBottom: theme.spacing.md, padding: theme.spacing.md },
  bundleStatusTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.text },
  bundleStatusText: { marginTop: 4, fontSize: 12, color: theme.colors.sub },
  inlineNoticeCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(41, 183, 124, 0.35)",
    backgroundColor: "rgba(41, 183, 124, 0.10)",
  },
  inlineNoticeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  inlineNoticeLine: {
    marginTop: 3,
    fontSize: 12,
    color: theme.colors.sub,
    lineHeight: 17,
  },
  journalCard: { marginBottom: theme.spacing.md, padding: theme.spacing.md },
  journalTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.text },
  journalSubtitle: { fontSize: 12, color: theme.colors.sub, marginTop: 4, marginBottom: theme.spacing.sm },
  journalFieldLabel: { fontSize: 12, fontWeight: "700", color: theme.colors.text, marginTop: theme.spacing.xs, marginBottom: 6 },
  journalChipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  journalChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  journalChipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(6,182,212,0.2)",
  },
  journalChipText: { fontSize: 12, color: theme.colors.sub, fontWeight: "600" },
  journalChipTextSelected: { color: theme.colors.text },
  journalNoteInput: {
    marginTop: theme.spacing.sm,
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.03)",
    color: theme.colors.text,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 9,
    textAlignVertical: "top",
  },
  journalSubmittedText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.sub,
  },
  journalSubmitButton: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: theme.colors.accent,
  },
  journalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  journalSubmitButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#06131a",
  },
  journalSummaryBox: {
    marginTop: theme.spacing.xs,
    borderRadius: 12,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 6,
  },
  journalSummaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  journalSummaryItem: {
    fontSize: 12,
    color: theme.colors.text,
  },
  journalEditButton: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    paddingVertical: 8,
  },
  journalEditButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text,
  },
  streakVisibilityCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.35)",
    backgroundColor: "rgba(6,182,212,0.08)",
  },
  streakVisibilityTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
  streakVisibilityBody: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.sub,
  },
  streakVisibilityButton: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "rgba(6,182,212,0.22)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.5)",
  },
  streakVisibilityButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9ef7ff",
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
});
