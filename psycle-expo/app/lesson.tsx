import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { theme } from "../lib/theme";
import { useAppState } from "../lib/state";
import { QuestionRenderer } from "../components/QuestionRenderer";
import { loadLessons } from "../lib/lessons";

export default function LessonScreen() {
  const params = useLocalSearchParams<{ file: string; genre: string }>();
  const { completeLesson, addXp, incrementQuest } = useAppState();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
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
      setQuestions(lesson.questions);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load lesson:", error);
      Alert.alert("エラー", `レッスンの読み込みに失敗しました: ${error.message}`);
      router.back();
    }
  }

  function handleAnswer(isCorrect: boolean, xp: number) {
    if (isCorrect) setCorrectCount(prev => prev + 1);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Lesson complete
      completeLesson(params.file);
      addXp(10);
      incrementQuest("q_daily_3lessons");
      Alert.alert(
        "完了！",
        `正解: ${correctCount + (isCorrect ? 1 : 0)}/${questions.length}\n+10 XP`,
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
  },
  progress: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
  },
  loading: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 100,
  },
});
