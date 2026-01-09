import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { useAppState } from "../lib/state";
import { QuestionRenderer } from "../components/QuestionRenderer";
import { loadLessons } from "../lib/lessons";

export default function LessonScreen() {
  const params = useLocalSearchParams<{ file: string; genre: string }>();
  const { completeLesson, addXp, incrementQuest } = useAppState();
  const [originalQuestions, setOriginalQuestions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [isReviewRound, setIsReviewRound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLesson();
  }, [params.file]);

  async function loadLesson() {
    try {
      setLoading(true);
      console.log("Loading lesson:", params.file);

      // Parse lesson file format: "mental_l01" -> unit: "mental", level: 1
      const match = params.file.match(/^(\w+)_l(\d+)$/);
      if (!match) {
        throw new Error(`Invalid lesson format: ${params.file}`);
      }

      const [, unit, levelStr] = match;
      const level = parseInt(levelStr, 10);
      console.log(`Parsed: unit=${unit}, level=${level}`);

      // Load lessons for this unit
      const lessons = loadLessons(unit);
      console.log(`Loaded ${lessons.length} lessons for unit ${unit}`);

      if (lessons.length === 0) {
        throw new Error(`No lessons found for unit: ${unit}`);
      }

      // Get the specific lesson (level is 1-indexed)
      const lesson = lessons[level - 1];
      if (!lesson) {
        throw new Error(`Lesson not found: ${unit} level ${level}`);
      }

      console.log("Setting questions, count:", lesson.questions.length);
      setOriginalQuestions(lesson.questions);
      setQuestions(lesson.questions);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load lesson:", error);
      Alert.alert("エラー", `レッスンの読み込みに失敗しました: ${error.message}`);
      router.back();
    }
  }

  function handleAnswer(isCorrect: boolean, xp: number) {
    const currentQuestion = questions[currentIndex];

    // If incorrect and not in review round, add to review queue
    if (!isCorrect && !isReviewRound) {
      const alreadyQueued = reviewQueue.find(q => q.id === currentQuestion.id);
      if (!alreadyQueued) {
        setReviewQueue(prev => [...prev, currentQuestion]);
        console.log("Added to review queue:", currentQuestion.id);
      }
    }

    if (isCorrect) setCorrectCount(prev => prev + 1);

    // Determine the total questions in current round
    const totalInRound = isReviewRound ? questions.length : originalQuestions.length;

    if (currentIndex < totalInRound - 1) {
      // Move to next question
      setCurrentIndex(prev => prev + 1);
    } else if (reviewQueue.length > 0 && !isReviewRound) {
      // Start review round
      console.log("Starting review round with", reviewQueue.length, "questions");
      setIsReviewRound(true);
      setQuestions(reviewQueue);
      setReviewQueue([]);
      setCurrentIndex(0);
    } else {
      // Lesson complete
      const totalQuestions = originalQuestions.length + (isReviewRound ? questions.length : 0);
      completeLesson(params.file);
      addXp(10);
      incrementQuest("q_daily_3lessons");
      Alert.alert(
        "完了！",
        `正解: ${correctCount + (isCorrect ? 1 : 0)}/${totalQuestions}\n+10 XP`,
        [{ text: "OK", onPress: () => router.push("/(tabs)/course") }]
      );
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>読み込み中...</Text>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>エラー: 質問が見つかりません</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        {isReviewRound && (
          <View style={styles.reviewBadge}>
            <Ionicons name="refresh" size={14} color="#fff" />
            <Text style={styles.reviewText}>復習</Text>
          </View>
        )}
        <Text style={styles.progress}>
          {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      <QuestionRenderer
        key={currentIndex}
        question={currentQuestion}
        onContinue={handleAnswer}
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
});
