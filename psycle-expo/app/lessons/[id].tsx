import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { theme } from "../../lib/theme";
import { useAppState } from "../../lib/state";
import { loadLessons, calculateStars, Lesson } from "../../lib/lessons";
import { QuestionRenderer } from "../../components/QuestionRenderer";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addXp, incrementQuest } = useAppState();

  // Parse lesson ID: "{unit}_lesson_{level}"
  const [unit, lessonNum] = id?.split("_lesson_") || [];
  const lessonIndex = parseInt(lessonNum || "1", 10) - 1;

  // Load lesson
  const lessons = loadLessons(unit);
  const lesson: Lesson | undefined = lessons[lessonIndex];

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>レッスンが見つかりません</Text>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>戻る</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = lesson.questions[currentQuestionIndex];
  const progress = currentQuestionIndex + 1;
  const total = lesson.questions.length;

  const handleAnswer = (isCorrect: boolean, xp: number) => {
    const newAnswers = [...answers, isCorrect];
    const newTotalXP = totalXP + xp;

    setAnswers(newAnswers);
    setTotalXP(newTotalXP);

    // Move to next question or show results
    if (currentQuestionIndex + 1 < lesson.questions.length) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 1000);
    } else {
      setTimeout(() => {
        setShowResults(true);
      }, 1000);
    }
  };

  const handleComplete = () => {
    const correctCount = answers.filter((a) => a).length;
    const stars = calculateStars(correctCount, total);

    // Add XP and update quests
    addXp(totalXP);
    incrementQuest("q_daily_3lessons");

    // Bonus quests for perfect lessons
    if (stars === 3) {
      incrementQuest("q_monthly_perfect_lessons");
    }

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
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>レッスン完了！</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3].map((i) => (
              <Text key={i} style={styles.star}>
                {i <= stars ? "⭐" : "☆"}
              </Text>
            ))}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>正答率</Text>
              <Text style={styles.statValue}>{accuracy}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>獲得XP</Text>
              <Text style={styles.statValue}>{totalXP}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={handleRetry}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                もう一度
              </Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleComplete}>
              <Text style={styles.buttonText}>完了</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <QuestionRenderer question={currentQuestion} onAnswer={handleAnswer} />
      </View>
    </SafeAreaView>
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
    backgroundColor: theme.colors.fg + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 24,
    color: theme.colors.fg,
    fontWeight: "600",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.fg + "20",
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
    color: theme.colors.fg,
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
    color: theme.colors.fg,
    marginBottom: 24,
  },
  resultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.fg,
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
    fontSize: 14,
    color: theme.colors.fg + "80",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.fg,
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
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
});
