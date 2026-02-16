import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import ConfettiCannon from "react-native-confetti-cannon";
import { theme } from "../../lib/theme";
import { useAppState } from "../../lib/state";
import { loadLessons, calculateStars, Lesson } from "../../lib/lessons";
import { StarBackground } from "../../components/StarBackground";
import { QuestionRenderer, Question } from "../../components/QuestionRenderer";
import { sortQuestionsByAdaptiveDifficulty } from "../../lib/adaptiveSelection";
import { getDifficultyRating } from "../../lib/difficultyMapping";
import { XPGainAnimation } from "../../components/XPGainAnimation";
import { Analytics } from "../../lib/analytics";
import { formatCitation } from "../../lib/evidenceUtils";
import i18n from "../../lib/i18n";
import { recordQuestEvent } from "../../lib/questsV2";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addXp, addGems, skill, skillConfidence, questionsAnswered, updateSkill, recentQuestionTypes, recentAccuracy, currentStreak, recordQuestionResult, addMistake } = useAppState();

  // Parse lesson ID: "{unit}_lesson_{level}"
  const [unit, lessonNum] = id?.split("_lesson_") || [];
  const lessonIndex = parseInt(lessonNum || "1", 10) - 1;

  // Load lesson - memoized to prevent re-computation on every render
  const lessons = React.useMemo(() => loadLessons(unit), [unit]);
  const lesson: Lesson | undefined = lessons[lessonIndex];

  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Initialize questions with adaptive sorting - ONLY ONCE per lesson
  const hasInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    // Guard: Only initialize once per lesson id
    if (lesson && id !== hasInitializedRef.current) {
      hasInitializedRef.current = id || null;
      const sortedQuestions = sortQuestionsByAdaptiveDifficulty(
        lesson.questions,
        {
          userSkill: skill,
          skillConfidence,
          recentlyAnswered: [],
          recentQuestionTypes,
          recentAccuracy,
          currentStreak,
        }
      );

      // FAIL-SAFE: Enforce uniqueness by source_id
      const uniqueIds = new Set();
      const uniqueQuestions = sortedQuestions.filter(q => {
        const id = q.source_id;
        if (uniqueIds.has(id)) {
          console.warn(`[LessonScreen] Duplicate detected and filtered: ${id}`);
          return false;
        }
        uniqueIds.add(id);
        return true;
      });

      setQuestions(uniqueQuestions);
    }
  }, [lesson, id]); // Only depend on lesson and id, not skill/accuracy which change frequently
  
  // lesson_start イベント（レッスン画面入場時に1回のみ発火）
  const hasTrackedLessonStartRef = useRef<string | null>(null);
  useEffect(() => {
    if (lesson && id && id !== hasTrackedLessonStartRef.current) {
      hasTrackedLessonStartRef.current = id || null;
      Analytics.track('lesson_start', {
        lessonId: id || '',
        genreId: unit || '',
      });
    }
  }, [lesson, id, unit]);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [xpAnimation, setXpAnimation] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });

  // Confetti ref
  const confettiRef = useRef<any>(null);

  // Trigger confetti on perfect lesson
  useEffect(() => {
    if (showResults) {
      const correctCount = answers.filter((a) => a).length;
      const stars = calculateStars(correctCount, total);

      if (stars === 3) {
        // Perfect lesson - trigger confetti and haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        confettiRef.current?.start();
      }
    }
  }, [showResults]);

  if (!lesson || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{i18n.t("lessonScreen.lessonNotFound")}</Text>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>{i18n.t("lessonScreen.back")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = currentQuestionIndex + 1;
  const total = questions.length;

  const handleContinue = (isCorrect: boolean, xp: number) => {
    const newAnswers = [...answers, isCorrect];
    const newTotalXP = totalXP + xp;

    setAnswers(newAnswers);
    setTotalXP(newTotalXP);

    // Update user skill rating based on performance
    const questionDifficulty = getDifficultyRating(currentQuestion.difficulty);
    updateSkill(isCorrect, questionDifficulty);

    // Record question result for adaptive difficulty tracking
    recordQuestionResult(currentQuestion.type || 'unknown', isCorrect);

    // If incorrect, add to mistakes hub
    if (!isCorrect) {
      const mistakeId = currentQuestion.source_id || `${id || "lesson"}_q${currentQuestionIndex}`;
      addMistake(mistakeId, id || "", currentQuestion.type);
    }

    // AI Adaptive Difficulty: Reorder remaining questions based on performance
    if (currentQuestionIndex + 1 < questions.length) {
      let nextQuestions = [...questions];
      const nextIndex = currentQuestionIndex + 1;
      const currentDifficulty = currentQuestion.difficulty;
      let targetDifficulty = "medium";

      // Determine target difficulty
      if (isCorrect) {
        // Increase difficulty
        if (currentDifficulty === "easy") targetDifficulty = "medium";
        else targetDifficulty = "hard";
      } else {
        // Decrease difficulty
        if (currentDifficulty === "hard") targetDifficulty = "medium";
        else targetDifficulty = "easy";
      }

      // Find a candidate in the remaining pool
      const candidateIndex = nextQuestions.findIndex((q, i) => i >= nextIndex && q.difficulty === targetDifficulty);

      if (candidateIndex !== -1 && candidateIndex !== nextIndex) {
        console.log(`[Adaptive] Performance: ${isCorrect ? "Correct" : "Incorrect"} (${currentDifficulty}) -> Target: ${targetDifficulty}`);
        console.log(`[Adaptive] Swapping Q${nextIndex + 1} (${nextQuestions[nextIndex].difficulty}) with Q${candidateIndex + 1} (${targetDifficulty})`);

        // Swap
        const temp = nextQuestions[nextIndex];
        nextQuestions[nextIndex] = nextQuestions[candidateIndex];
        nextQuestions[candidateIndex] = temp;

        setQuestions(nextQuestions);
      } else {
        console.log(`[Adaptive] Performance: ${isCorrect ? "Correct" : "Incorrect"} (${currentDifficulty}) -> Target: ${targetDifficulty} (No swap needed/possible)`);
      }

      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }

    // Trigger XP animation if correct
    if (isCorrect) {
      setXpAnimation({ show: true, amount: xp });
    }
  };

  const handleComplete = async () => {
    const correctCount = answers.filter((a) => a).length;
    const stars = calculateStars(correctCount, total);

    // Add XP and update quest events
    await addXp(totalXP, "question");
    try {
      await recordQuestEvent({
        type: "lesson_complete",
        lessonId: id || "",
        genreId: unit || "",
      });
    } catch (error) {
      console.error("Failed to record quest event for lesson_complete:", error);
    }

    // Award gems based on performance
    addGems(stars); // 1-3 gems based on stars

    // lesson_completeイベント（ドメインの確定地点で1回のみ発火）
    Analytics.track('lesson_complete', {
      lessonId: id || '',
      genreId: unit || '',
    });

    router.back();
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTotalXP(0);
    setShowResults(false);
  };

  if (showResults) {
    const correctCount = answers.filter((a) => a).length;
    const stars = calculateStars(correctCount, total);
    const accuracy = Math.round((correctCount / total) * 100);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsScrollContainer}>
          <View style={styles.resultsContent}>
            {/* Confetti for perfect lessons */}
            {stars === 3 && (
              <ConfettiCannon
                ref={confettiRef}
                count={150}
                origin={{ x: -10, y: 0 }}
                autoStart={false}
                fadeOut
              />
            )}

            <Text style={styles.resultsTitle}>
              {stars === 3 ? i18n.t("lessonScreen.perfectTitle") : i18n.t("lesson.completeTitle")}
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3].map((i) => (
                <Text key={i} style={styles.star}>
                  {i <= stars ? "⭐" : "☆"}
                </Text>
              ))}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{i18n.t("lessonScreen.accuracyLabel")}</Text>
                <Text style={styles.statValue}>{accuracy}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{i18n.t("lessonScreen.xpLabel")}</Text>
                <Text style={styles.statValue}>{totalXP}</Text>
              </View>
            </View>

            {/* Background Research Section */}
            {lesson?.references && lesson.references.length > 0 && (
              <View style={styles.referencesContainer}>
                <Text style={styles.refHeader}>{i18n.t("lessonScreen.referencesHeader")}</Text>

                <View style={styles.refNoteContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#666" />
                  <Text style={styles.refNote}>{i18n.t("lessonScreen.referencesNote")}</Text>
                </View>

                <View style={styles.refList}>
                  {lesson.references.map((ref, i) => {
                    // Badge logic
                    let badgeColor = "#A0A9A9";
                    let badgeLabel = String(i18n.t("lessonScreen.badges.classic"));
                    if (ref.level === "gold") {
                      badgeColor = "#D4AF37";
                      badgeLabel = String(i18n.t("lessonScreen.badges.metaAnalysis"));
                    } else if (ref.level === "bronze") {
                      badgeColor = "#CD7F32";
                      badgeLabel = String(i18n.t("lessonScreen.badges.suggestive"));
                    }

                    return (
                      <View key={i} style={styles.refItem}>
                        <View style={styles.refHeaderRow}>
                          {ref.level && (
                            <View style={[styles.badgeContainer, { backgroundColor: badgeColor + "20" }]}>
                              <Text style={[styles.badgeText, { color: badgeColor }]}>
                                {ref.level === "gold" ? "🥇 " : ref.level === "silver" ? "🥈 " : "🥉 "}
                                {badgeLabel}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.refCitation}>{formatCitation(ref)}</Text>
                        </View>
                        <Text style={styles.refNoteText}>└ {ref.note}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={handleRetry}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  {i18n.t("lessonScreen.retry")}
                </Text>
              </Pressable>
                <Pressable style={styles.button} onPress={() => { void handleComplete(); }} testID="lesson-complete">
                <Text style={styles.buttonText}>{i18n.t("lessonScreen.complete")}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StarBackground combo={currentStreak} warpIn={true} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(progress / total) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progress} / {total}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <QuestionRenderer
            key={currentQuestionIndex}
            question={currentQuestion}
            onContinue={handleContinue}
          />
        </View>

        {/* XP Gain Animation Overlay */}
        {xpAnimation.show && (
          <View style={styles.xpAnimationOverlay} pointerEvents="none">
            <XPGainAnimation
              amount={xpAnimation.amount}
              onComplete={() => setXpAnimation({ show: false, amount: 0 })}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.text + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: "600",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.text + "20",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    minWidth: 48,
    textAlign: "right",
  },
  questionContainer: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 24,
  },
  resultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  resultsTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 32,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 48,
  },
  star: {
    fontSize: 48,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 48,
    marginBottom: 48,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  xpAnimationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    // Adjust position to be slightly above center or near the answer area if preferred
    paddingBottom: 100,
  },
  resultsScrollContainer: {
    flexGrow: 1,
  },
  resultsContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingBottom: 100,
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
  refNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  refNote: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },
  refList: {
    gap: 12,
  },
  refItem: {
    marginBottom: 8,
  },
  refHeaderRow: {
    flexDirection: 'column', // Citation below badge? Or row? Row wraps effectively. Let's do Citation below badge for cleanliness or Column. 
    // Actually, badge then citation.
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 2,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  refCitation: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    lineHeight: 18,
  },
  refNoteText: {
    fontSize: 12,
    color: '#666',
    paddingLeft: 4,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
