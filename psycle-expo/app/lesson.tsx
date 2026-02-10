import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { useAppState } from "../lib/state";
import { QuestionRenderer } from "../components/QuestionRenderer";
import { loadLessons, Lesson } from "../lib/lessons";
import { ScrollView, TouchableOpacity } from "react-native";
import { StarBackground } from "../components/StarBackground";
import { VictoryConfetti } from "../components/VictoryConfetti";
import { FireflyLoader } from "../components/FireflyLoader";
import { logFeltBetter, logInterventionInteraction, hasLoggedShownThisSession, markShownLogged, resetSessionTracking } from "../lib/dogfood";
import { getEvidenceSummary, getTryValueColor } from "../lib/evidenceSummary";
import { recordActionExecution, recordStudyCompletion, addXP, XP_REWARDS } from "../lib/streaks";
import { consumeFocus } from "../lib/focus";
import { FirstExecutedCelebration } from "../components/FirstExecutedCelebration";
import { hasCompletedFirstExecuted, markFirstExecutedComplete } from "../lib/onboarding";
import { Analytics } from "../lib/analytics";
import { formatCitation } from "../lib/evidenceUtils";
import i18n from "../lib/i18n";

export default function LessonScreen() {
  const params = useLocalSearchParams<{ file: string; genre: string }>();
  const fileParam = params.file; // Extract to primitive string
  const { completeLesson, addXp, incrementQuest, consumeEnergy, tryTriggerStreakEnergyBonus, energy, maxEnergy } = useAppState();
  const [originalQuestions, setOriginalQuestions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [isReviewRound, setIsReviewRound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [combo, setCombo] = useState(0); // Added for fever effect
  const [showResearchDetails, setShowResearchDetails] = useState(false); // Collapsible research details
  const [feltBetterSubmitted, setFeltBetterSubmitted] = useState(false); // Track if felt_better submitted
  const [lastShownInterventionId, setLastShownInterventionId] = useState<string | null>(null); // 最後にshownになった介入ID
  const [showFirstExecutedCelebration, setShowFirstExecutedCelebration] = useState(false); // 初回executed達成お祝い
  const hasLoadedRef = useRef<string | null>(null);
  const lessonStartTrackedRef = useRef<string | null>(null); // lesson_start多重発火防止
  const lessonCompleteTrackedRef = useRef<string | null>(null); // lesson_complete多重発火防止
  const listSeparator = i18n.locale.startsWith("ja") ? "、" : ", ";

  useEffect(() => {
    // Only load if file changed and we haven't loaded this file yet
    if (fileParam && fileParam !== hasLoadedRef.current) {
      if (__DEV__) console.log("[lesson.tsx] MOUNTED with params:", params);
      hasLoadedRef.current = fileParam;
      loadLesson();
    }
  }, [fileParam]);

  async function loadLesson() {
    try {
      setLoading(true);

      // 周回ごとにshownカウントをリセット（同一アプリ起動でも周回でshown++される）
      resetSessionTracking();

      // ゲーミフィケーション: Focus消費（ソフト制限：0でもブロックしない）
      consumeFocus(1).catch(console.error);

      if (__DEV__) console.log("Loading lesson:", params.file);

      // Extract unit (e.g. mental_l01 -> mental, mental_review_bh1 -> mental)
      const unitMatch = params.file.match(/^([a-z]+)_/);
      if (!unitMatch) throw new Error(`Invalid file format: ${params.file}`);
      const unit = unitMatch[1];

      // Load lessons for this unit
      const lessons = loadLessons(unit);

      // Find lesson logic:
      // 1. Exact ID match (for review nodes like mental_review_bh1)
      let lesson = lessons.find(l => l.id === params.file);

      // 2. If not found, try legacy level mapping (mental_l01 -> level 1)
      if (!lesson) {
        const levelMatch = params.file.match(/_l(\d+)$/);
        if (levelMatch) {
          const level = parseInt(levelMatch[1], 10);
          lesson = lessons.find(l => l.level === level && (l.nodeType === 'lesson' || !l.nodeType));
        }
      }

      if (!lesson) {
        throw new Error(`Lesson not found: ${params.file}`);
      }

      // Hard gate: energy is consumed once per lesson start.
      const hasEnoughEnergy = consumeEnergy(1);
      if (!hasEnoughEnergy) {
        setLoading(false);
        const genreId = params.file.match(/^([a-z]+)_/)?.[1] || 'unknown';
        Analytics.track("energy_blocked", {
          lessonId: params.file,
          genreId,
          energy,
          maxEnergy,
        });
        Alert.alert(
          i18n.t("common.error"),
          i18n.locale.startsWith("ja")
            ? "エネルギーが足りません。回復を待つか、ショップでサブスクを有効にしてください。"
            : "Not enough energy. Wait for refill or activate subscription in Shop.",
          [{
            text: i18n.t("common.ok"),
            onPress: () => {
              Analytics.track("shop_open_from_energy", { source: "lesson_blocked", lessonId: params.file });
              router.replace("/(tabs)/shop");
            }
          }]
        );
        return;
      }

      if (__DEV__) console.log("Setting questions, count:", lesson.questions.length);
      setCurrentLesson(lesson);
      setOriginalQuestions(lesson.questions);
      setQuestions(lesson.questions);
      setLoading(false);

      // Analytics: lesson_start (同一lessonIdで2回送らない)
      if (lessonStartTrackedRef.current !== params.file) {
        lessonStartTrackedRef.current = params.file;
        const genreId = params.file.match(/^([a-z]+)_/)?.[1] || 'unknown';
        Analytics.track('lesson_start', {
          lessonId: params.file,
          genreId,
        });
        if (__DEV__) console.log('[Analytics] lesson_start:', params.file);
      }
    } catch (error) {
      console.error("Failed to load lesson:", error);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(i18n.t("lesson.errorTitle"), i18n.t("lesson.loadFailed", { message }));
      router.back();
    }
  }

  // Intervention問題が表示されたときにshownをログ
  const currentQuestion = questions[currentIndex];
  useEffect(() => {
    if (!currentQuestion) return;

    const details = currentQuestion.expanded_details;
    if (details?.claim_type === 'intervention') {
      const questionId = currentQuestion.id; // source_idは研究出典、idが介入識別子

      // セッション内で既にshownログ済みならスキップ
      if (!hasLoggedShownThisSession(questionId)) {
        markShownLogged(questionId);

        // バリアント情報（デフォルトでoriginal）
        const variant = details.variant || { id: "original", label: i18n.t("lesson.originalVariantLabel") };

        logInterventionInteraction(
          params.file,
          questionId,
          variant,
          'shown'
        );

        // felt_better帰属用に最後のintervention IDを記録
        setLastShownInterventionId(questionId);

        if (__DEV__) console.log('[Dogfood] Logged shown:', questionId);
      }
    }
  }, [currentQuestion?.source_id, currentQuestion?.id]);

  async function handleAnswer(isCorrect: boolean, xp: number) {
    const questionInHandler = questions[currentIndex];
    const genreId = params.file.match(/^([a-z]+)_/)?.[1] || 'unknown';

    // If incorrect and not in review round, add to review queue
    if (!isCorrect) {
      Analytics.track('question_incorrect', {
        lessonId: params.file,
        genreId,
        questionId: questionInHandler?.id || `unknown_${currentIndex}`,
        questionType: questionInHandler?.type || 'unknown',
        questionIndex: currentIndex,
        isReviewRound,
      });

      if (!isReviewRound) {
        const alreadyQueued = reviewQueue.find(q => q.id === questionInHandler.id);
        if (!alreadyQueued) {
          setReviewQueue(prev => [...prev, questionInHandler]);
          if (__DEV__) console.log("Added to review queue:", questionInHandler.id);
        }
      }
    }

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      const nextStreak = correctStreak + 1;
      setCorrectStreak(nextStreak);

      // Every 5 consecutive correct answers: 10% chance to recover +1 energy (max once/day).
      if (nextStreak % 5 === 0) {
        const recovered = tryTriggerStreakEnergyBonus(nextStreak);
        if (__DEV__ && recovered) {
          console.log("[Energy] streak bonus recovered +1");
        }
      }
    } else {
      setCorrectStreak(0);
    }

    // Determine the total questions in current round
    const totalInRound = isReviewRound ? questions.length : originalQuestions.length;

    if (currentIndex < totalInRound - 1) {
      // Move to next question
      setCurrentIndex(prev => prev + 1);
    } else if (reviewQueue.length > 0 && !isReviewRound) {
      // Start review round
      if (__DEV__) console.log("Starting review round with", reviewQueue.length, "questions");
      setIsReviewRound(true);
      setQuestions(reviewQueue);
      setReviewQueue([]);
      setCurrentIndex(0);
    } else {
      // Lesson complete
      completeLesson(params.file);
      addXp(currentLesson?.nodeType === 'review_blackhole' ? 50 : 10); // Bonus XP or standard
      incrementQuest("q_daily_3lessons");

      // ゲーミフィケーション: Study Streak + XP
      await recordStudyCompletion();
      await addXP(XP_REWARDS.LESSON_COMPLETE);

      // Analytics: lesson_complete (同一lessonIdで2回送らない)
      if (lessonCompleteTrackedRef.current !== params.file) {
        lessonCompleteTrackedRef.current = params.file;
        Analytics.track('lesson_complete', {
          lessonId: params.file,
          genreId,
        });
        if (__DEV__) console.log('[Analytics] lesson_complete:', params.file);
      }

      setIsComplete(true);
    }
  }

  // Intervention: attempted ハンドラ
  const [activeInterventionId, setActiveInterventionId] = useState<string | null>(null);

  async function handleInterventionAttempted(questionId: string) {
    const details = currentQuestion?.expanded_details;
    const variant = details?.variant || { id: 'original', label: i18n.t("lesson.originalVariantLabel") };

    logInterventionInteraction(params.file, questionId, variant, 'attempted');
    setActiveInterventionId(questionId); // felt_better帰属用

    // ゲーミフィケーション: attempted で XP
    await addXP(XP_REWARDS.ATTEMPTED);

    if (__DEV__) console.log('[Dogfood] Logged attempted:', questionId, '(+10 XP)');
  }

  // Intervention: executed ハンドラ
  async function handleInterventionExecuted(questionId: string) {
    const details = currentQuestion?.expanded_details;
    const variant = details?.variant || { id: 'original', label: i18n.t("lesson.originalVariantLabel") };

    logInterventionInteraction(params.file, questionId, variant, 'executed');

    // ゲーミフィケーション: Action Streak + XP
    await recordActionExecution();
    await addXP(XP_REWARDS.EXECUTED);

    // 初回executed達成チェック
    const wasFirstExecuted = !(await hasCompletedFirstExecuted());
    if (wasFirstExecuted) {
      await markFirstExecutedComplete();
      setShowFirstExecutedCelebration(true);
    }

    if (__DEV__) console.log('[Dogfood] Logged executed:', questionId, wasFirstExecuted ? '(FIRST!)' : '', '(+25 XP, Action Streak updated)');
  }

  if (isComplete) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }} testID="lesson-complete-screen">
        {/* Background Effects */}
        <StarBackground />
        <VictoryConfetti />

        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
          <ScrollView contentContainerStyle={styles.completionContainer}>
            <Text style={styles.completionTitle}>{i18n.t("lesson.completeTitle")}</Text>
            <Text style={styles.completionSub}>+{currentLesson?.nodeType === 'review_blackhole' ? 50 : 10} XP</Text>

            {/* Felt Better Rating */}
            {!feltBetterSubmitted && lastShownInterventionId && (
              <View style={styles.feltBetterContainer}>
                <Text style={styles.feltBetterTitle}>{i18n.t("lesson.howDoYouFeelNow")}</Text>
                <View style={styles.feltBetterRow}>
                  {[
                    { value: -2 as const, emoji: "😢", label: i18n.t("lesson.mood.veryBad") },
                    { value: -1 as const, emoji: "😕", label: i18n.t("lesson.mood.aLittleBad") },
                    { value: 0 as const, emoji: "😐", label: i18n.t("lesson.mood.noChange") },
                    { value: 1 as const, emoji: "😊", label: i18n.t("lesson.mood.aLittleBetter") },
                    { value: 2 as const, emoji: "😄", label: i18n.t("lesson.mood.good") },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.feltBetterButton}
                      onPress={async () => {
                        // activeInterventionId優先（attempted押した介入）、fallbackでlastShown
                        const targetId = activeInterventionId || lastShownInterventionId;
                        if (targetId) {
                          await logFeltBetter(params.file, targetId, item.value);
                          setFeltBetterSubmitted(true);
                        }
                      }}
                    >
                      <Text style={styles.feltBetterEmoji}>{item.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {feltBetterSubmitted && (
              <View style={styles.feltBetterThanks}>
                <Text style={styles.feltBetterThanksText}>{i18n.t("lesson.feedbackThanks")}</Text>
              </View>
            )}

            {/* Layer 2: Research Background - Expandable Depth */}
            {(() => {
              const meta = currentLesson?.research_meta;
              const ref = currentLesson?.references?.[0];

              // Aggregate expanded_details from questions (use first available)
              const expandedDetails = originalQuestions.find(q => q.expanded_details)?.expanded_details;

              // Get evidence summary for "まず試す価値" display
              const evidenceSummary = getEvidenceSummary(expandedDetails);
              const tryValueColor = getTryValueColor(evidenceSummary.tryValue);

              // Claim type labels (Japanese)
              const claimTypeLabels: Record<string, string> = {
                observation: i18n.t("lesson.claimType.observation"),
                theory: i18n.t("lesson.claimType.theory"),
                intervention: i18n.t("lesson.claimType.intervention"),
              };

              // Evidence type labels (Japanese)
              const evidenceTypeLabels: Record<string, string> = {
                direct: i18n.t("lesson.evidenceType.direct"),
                indirect: i18n.t("lesson.evidenceType.indirect"),
                theoretical: i18n.t("lesson.evidenceType.theoretical"),
              };

              return (
                <View style={styles.breakdownContainer}>
                  {/* まず試す価値 Summary (Always Visible) */}
                  <View style={styles.tryValueSummary}>
                    {/* 判断の一言（最上段） */}
                    <Text style={styles.actionHint}>{evidenceSummary.actionHint}</Text>

                    {/* intervention のみバッジ行を表示（theory/observation は迷いを生むので非表示） */}
                    {expandedDetails?.claim_type === 'intervention' && (
                      <>
                        <View style={styles.tryValueRow}>
                          <Text style={styles.tryValueLabel}>{evidenceSummary.valueLabel}：</Text>
                          <View style={[styles.tryValueBadge, { backgroundColor: tryValueColor }]}>
                            <Text style={styles.tryValueText}>{evidenceSummary.tryValue}</Text>
                          </View>
                        </View>
                        <Text style={styles.basisLabel}>
                          {i18n.t("lesson.basisLabelPrefix")}
                          {evidenceSummary.basisLabel}
                        </Text>
                      </>
                    )}
                    <Text style={styles.safetyNote}>{evidenceSummary.note}</Text>
                  </View>

                  {/* Toggle for details */}
                  <TouchableOpacity
                    onPress={() => setShowResearchDetails(!showResearchDetails)}
                    style={styles.detailsToggle}
                  >
                    <Text style={styles.detailsToggleText}>
                      {showResearchDetails ? i18n.t("lesson.closeDetails") : i18n.t("lesson.showDetails")}
                    </Text>
                  </TouchableOpacity>

                  {/* Expandable Details */}
                  {showResearchDetails && expandedDetails && (
                    <>
                      {/* Reading Guide */}
                      <Text style={styles.readingGuide}>{i18n.t("lesson.readingGuide")}</Text>

                      {/* Best For - FIRST (users want to know "is this relevant to me?") */}
                      {expandedDetails.best_for && expandedDetails.best_for.length > 0 && (
                        <View style={styles.applicabilitySection}>
                          <Text style={styles.applicabilityHeader}>{i18n.t("lesson.bestForHeader")}</Text>
                          <Text style={styles.applicabilityText}>
                            {expandedDetails.best_for.join(listSeparator)}
                          </Text>
                        </View>
                      )}

                      {/* Limitations - SECOND */}
                      {expandedDetails.limitations && expandedDetails.limitations.length > 0 && (
                        <View style={styles.limitationsSection}>
                          <Text style={styles.limitationsHeader}>{i18n.t("lesson.limitationsHeader")}</Text>
                          <Text style={styles.limitationsText}>
                            {expandedDetails.limitations.join(listSeparator)}
                          </Text>
                        </View>
                      )}

                      {/* Claim/Evidence Chips - small, transparent */}
                      <View style={styles.chipRow}>
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>
                            {claimTypeLabels[expandedDetails.claim_type] || expandedDetails.claim_type}
                          </Text>
                        </View>
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>
                            {evidenceTypeLabels[expandedDetails.evidence_type] || expandedDetails.evidence_type}
                          </Text>
                        </View>
                      </View>

                      {/* Intervention-specific: Tiny Metric */}
                      {expandedDetails.tiny_metric && (
                        <View style={styles.interventionSection}>
                          <Text style={styles.interventionHeader}>{i18n.t("lesson.intervention.effectHeader")}</Text>
                          <Text style={styles.interventionText}>
                            {i18n.t("lesson.intervention.beforePrefix")} {expandedDetails.tiny_metric.before_prompt}
                          </Text>
                          <Text style={styles.interventionText}>
                            {i18n.t("lesson.intervention.afterPrefix")} {expandedDetails.tiny_metric.after_prompt}
                          </Text>
                          <Text style={[styles.interventionText, { color: theme.colors.success }]}>
                            {i18n.t("lesson.intervention.successPrefix")} {expandedDetails.tiny_metric.success_rule}
                          </Text>
                          <Text style={[styles.interventionText, { color: theme.colors.warn }]}>
                            {i18n.t("lesson.intervention.stopPrefix")} {expandedDetails.tiny_metric.stop_rule}
                          </Text>
                        </View>
                      )}

                      {/* Intervention-specific: Comparator */}
                      {expandedDetails.comparator && (
                        <View style={styles.interventionSection}>
                          <Text style={styles.interventionHeader}>{i18n.t("lesson.intervention.comparatorHeader")}</Text>
                          <Text style={styles.interventionText}>
                            {i18n.t("lesson.intervention.comparatorPrefix")} {expandedDetails.comparator.baseline}
                          </Text>
                          <Text style={[styles.interventionText, { color: theme.colors.sub }]}>
                            {i18n.t("lesson.intervention.costPrefix")} {expandedDetails.comparator.cost}
                          </Text>
                        </View>
                      )}

                      {/* Intervention-specific: Fallback */}
                      {expandedDetails.fallback && (
                        <View style={styles.interventionSection}>
                          <Text style={styles.interventionHeader}>{i18n.t("lesson.intervention.fallbackHeader")}</Text>
                          <Text style={styles.interventionText}>
                            {expandedDetails.fallback.when}
                          </Text>
                          <Text style={[styles.interventionText, { color: theme.colors.accent }]}>
                            → {expandedDetails.fallback.next}
                          </Text>
                        </View>
                      )}

                      {/* Citation Role (only in expandable) */}
                      <TouchableOpacity
                        onPress={() => setShowResearchDetails(!showResearchDetails)}
                        style={styles.detailsToggle}
                      >
                        <Text style={styles.detailsToggleText}>
                          {showResearchDetails ? i18n.t("lesson.closeDetails") : i18n.t("lesson.showCitationRole")}
                        </Text>
                      </TouchableOpacity>

                      {showResearchDetails && (
                        <View style={styles.disclaimerBox}>
                          <Ionicons name="book-outline" size={16} color={theme.colors.sub} />
                          <View style={{ flex: 1 }}>
                            {expandedDetails.citation_role && (
                              <Text style={styles.disclaimerText}>
                                {i18n.t("lesson.citationRolePrefix")} {expandedDetails.citation_role}
                              </Text>
                            )}
                            {expandedDetails.try_this && (
                              <Text style={[styles.disclaimerText, { marginTop: 8 }]}>
                                {i18n.t("lesson.tryThisPrefix")} {expandedDetails.try_this}
                              </Text>
                            )}
                            <Text style={[styles.disclaimerText, { marginTop: 8, color: '#888' }]}>
                              {i18n.t("lesson.disclaimerEffectSize")}
                            </Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}

                  {/* Priority 2: Fallback to research_meta (when no expandedDetails) */}
                  {!expandedDetails && meta && (
                    <>
                      <View style={styles.theoryBox}>
                        <Text style={styles.theoryName}>{meta.theory}</Text>
                        <Text style={styles.theoryAuthors}>
                          {meta.primary_authors.join(" & ")}（{meta.year}）
                        </Text>
                      </View>

                      <View style={styles.supportList}>
                        <Text style={styles.supportItem}>
                          {i18n.t("lesson.metaSupportYears", { years: meta.support.years_in_use })}
                        </Text>
                        <Text style={styles.supportItem}>
                          {i18n.t("lesson.metaSupportTheory")}
                        </Text>
                      </View>

                      {meta.best_for && meta.best_for.length > 0 && (
                        <View style={styles.applicabilitySection}>
                          <Text style={styles.applicabilityHeader}>{i18n.t("lesson.bestForHeader")}</Text>
                          <Text style={styles.applicabilityText}>
                            {meta.best_for.join(listSeparator)}
                          </Text>
                        </View>
                      )}

                      {meta.limitations && meta.limitations.length > 0 && (
                        <View style={styles.limitationsSection}>
                          <Text style={styles.limitationsHeader}>{i18n.t("lesson.limitationsHeader")}</Text>
                          <Text style={styles.limitationsText}>
                            {meta.limitations.join(listSeparator)}
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        onPress={() => setShowResearchDetails(!showResearchDetails)}
                        style={styles.detailsToggle}
                      >
                        <Text style={styles.detailsToggleText}>
                          {showResearchDetails ? i18n.t("lesson.closeDetails") : i18n.t("lesson.showDetails")}
                        </Text>
                      </TouchableOpacity>

                      {showResearchDetails && (
                        <View style={styles.disclaimerBox}>
                          <Ionicons name="information-circle-outline" size={16} color="#999" />
                          <Text style={styles.disclaimerText}>
                            {i18n.t("lesson.disclaimerEffectSize")}
                            {"\n"}
                            {i18n.t("lesson.disclaimerGeneralTrend")}
                          </Text>
                        </View>
                      )}
                    </>
                  )}

                  {/* Priority 3: Minimal fallback (when no expandedDetails and no meta) */}
                  {!expandedDetails && !meta && ref && (
                    <View style={styles.theorySection}>
                      <Text style={styles.theoryText}>
                        {i18n.t("lesson.basedOnResearchPrefix")}
                        {"\n"}
                        {formatCitation(ref)}
                        {i18n.t("lesson.basedOnResearchSuffix")}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}

            <TouchableOpacity onPress={() => router.replace("/(tabs)/course")} style={styles.continueButton} testID="lesson-complete-continue">
              <Text style={styles.continueText}>{i18n.t("lesson.continue")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View >
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: "center", justifyContent: "center" }} testID="lesson-loading-screen">
        <StarBackground />
        <FireflyLoader />
        <Text style={[styles.loading, { marginTop: 20 }]}>{i18n.t("common.loading")}</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container} testID="lesson-error-screen">
        <Text style={styles.loading}>{i18n.t("lesson.questionNotFound")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="lesson-screen">
      {/* Background with Fever Effect */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <StarBackground combo={combo} />
      </View>

      <View style={styles.header}>
        {isReviewRound && (
          <View style={styles.reviewBadge}>
            <Ionicons name="refresh" size={14} color="#fff" />
            <Text style={styles.reviewText}>{i18n.t("lesson.reviewBadge")}</Text>
          </View>
        )}
        <Text style={styles.progress} testID="lesson-progress">
          {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      <QuestionRenderer
        key={currentIndex}
        question={currentQuestion}
        onContinue={handleAnswer}
        onComboChange={setCombo}
        onInterventionAttempted={handleInterventionAttempted}
        onInterventionExecuted={handleInterventionExecuted}
      />

      {/* 初回executed達成お祝いモーダル */}
      <FirstExecutedCelebration
        visible={showFirstExecutedCelebration}
        onDismiss={() => setShowFirstExecutedCelebration(false)}
        xpEarned={XP_REWARDS.EXECUTED}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  reviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  progress: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  loading: {
    fontSize: 18,
    color: theme.colors.sub,
    textAlign: "center",
    marginTop: 100,
  },
  completionContainer: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 40,
    marginBottom: 8,
  },
  completionSub: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  referencesContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  refList: {
    gap: 8,
    marginBottom: 16,
  },
  refText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  refNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  refNote: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gradeSummaryContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradeSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  gradeRow: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  gradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gradeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  gradeCount: {
    fontSize: 14,
    color: theme.colors.sub,
    fontWeight: '600',
  },
  gradeDesc: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    lineHeight: 18,
  },
  gradeHint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  gradeBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  gradeBadge: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    minWidth: 70,
  },
  gradeBadgeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  gradeBadgeCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  // Layer 2 Breakdown styles
  breakdownContainer: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.sub,
    lineHeight: 18,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  contextNote: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 20,
  },
  evidenceSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    paddingTop: 16,
    marginBottom: 16,
  },
  referencesSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    paddingTop: 16,
  },
  // Psycle Philosophy styles
  philosophyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  philosophyBody: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  coreMessage: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  coreMessageText: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  theorySection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginBottom: 16,
  },
  theoryHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  theoryText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  stanceBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
    padding: 14,
    marginBottom: 16,
    borderRadius: 8,
  },
  stanceText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    fontWeight: '500',
  },
  // Evidence Breakdown styles
  introText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  evidenceBreakdown: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  evidenceRow: {
    gap: 4,
  },
  evidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  evidenceCount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  evidenceDesc: {
    fontSize: 13,
    color: theme.colors.sub,
    marginLeft: 8,
  },
  // Research Meta styles (Psycle-style)
  theoryBox: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  theoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  theoryAuthors: {
    fontSize: 14,
    color: '#666',
  },
  supportList: {
    marginBottom: 16,
    gap: 8,
  },
  supportItem: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
  },
  confidenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  coreSummary: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  criteriaNote: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  detailsToggle: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailsToggleText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  // Best for / Limitations styles
  applicabilitySection: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  applicabilityHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
    marginBottom: 4,
  },
  applicabilityText: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
  },
  limitationsSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  limitationsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.warn,
    marginBottom: 4,
  },
  limitationsText: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
  },
  // Reading Guide
  readingGuide: {
    fontSize: 12,
    color: theme.colors.sub,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  // Chips for claim/evidence type
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  chipText: {
    fontSize: 11,
    color: theme.colors.sub,
    fontWeight: '500',
  },
  // Intervention-specific styles
  interventionSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  interventionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent,
    marginBottom: 8,
  },
  interventionText: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  // Felt Better Rating styles
  feltBetterContainer: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
  },
  feltBetterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  feltBetterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  feltBetterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  feltBetterEmoji: {
    fontSize: 24,
  },
  feltBetterThanks: {
    width: '100%',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  feltBetterThanksText: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '500',
  },
  // Try Value Summary styles
  tryValueSummary: {
    marginBottom: 16,
  },
  actionHint: {
    fontSize: 15,
    fontWeight: '500',
    color: '#60a5fa',
    marginBottom: 12,
    lineHeight: 20,
  },
  tryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tryValueLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tryValueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  tryValueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  basisLabel: {
    fontSize: 13,
    color: theme.colors.sub,
    marginBottom: 4,
  },
  safetyNote: {
    fontSize: 12,
    color: '#888',
  },
});
