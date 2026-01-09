import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { theme } from "../lib/theme";
import { useAppState } from "../lib/state";
import { getQuestionFromId } from "../lib/lessons";
import { QuestionRenderer, Question } from "../components/QuestionRenderer";
import { XPGainAnimation } from "../components/XPGainAnimation";

export default function ReviewScreen() {
    const { mistakes, getDueMistakes, processReviewResult, addXp } = useAppState();
    const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [clearedCount, setClearedCount] = useState(0);
    const [xpAnimation, setXpAnimation] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
    const [nextReviewInfo, setNextReviewInfo] = useState<string | null>(null);

    // Prepare review session
    useEffect(() => {
        if (!isSessionActive) {
            const dueItems = getDueMistakes();
            const loadedQuestions: Question[] = [];
            // Limit to 10 questions for a session
            const sessionMistakes = dueItems.slice(0, 10);

            sessionMistakes.forEach(m => {
                const q = getQuestionFromId(m.lessonId, m.id);
                if (q) {
                    loadedQuestions.push(q);
                }
            });
            setSessionQuestions(loadedQuestions);
        }
    }, [isSessionActive, getDueMistakes]);

    const handleStart = () => {
        setIsSessionActive(true);
        setCurrentIndex(0);
        setClearedCount(0);
        setShowResults(false);
    };

    const handleContinue = (isCorrect: boolean, xp: number) => {
        const currentQ = sessionQuestions[currentIndex];

        if (isCorrect) {
            // Haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Process SRS result
            processReviewResult(currentQ.source_id, true);

            // Check the mistake's new box to determine next review time
            const mistake = mistakes.find(m => m.id === currentQ.source_id);
            if (mistake) {
                const intervals = ["すぐに", "1日後", "3日後", "7日後", "14日後", "完全にマスター！"];
                const nextBox = mistake.box + 1;
                if (nextBox > 5) {
                    setNextReviewInfo("完全にマスター！");
                    setClearedCount(prev => prev + 1);
                } else {
                    setNextReviewInfo(`次の復習: ${intervals[nextBox]}`);
                }
            }

            // Add small XP reward
            addXp(xp);
            setXpAnimation({ show: true, amount: xp });
            setTimeout(() => {
                setXpAnimation({ show: false, amount: 0 });
                setNextReviewInfo(null);
            }, 2000);

        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            // Reset to Box 1
            processReviewResult(currentQ.source_id, false);
            setNextReviewInfo("もう一度復習が必要です");
            setTimeout(() => setNextReviewInfo(null), 2000);
        }

        // Move to next question after delay
        setTimeout(() => {
            if (currentIndex < sessionQuestions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setShowResults(true);
                setIsSessionActive(false);
            }
        }, 2000);
    };

    const dueCount = getDueMistakes().length;

    if (dueCount === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Text style={styles.title}>苦手克服</Text>
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="checkmark-circle-outline" size={80} color={theme.colors.success} />
                    <Text style={styles.emptyTitle}>素晴らしい！</Text>
                    <Text style={styles.emptyText}>現在、復習が必要な問題はありません。</Text>
                    <Pressable style={styles.button} onPress={() => router.back()}>
                        <Text style={styles.buttonText}>コースに戻る</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    if (showResults) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>復習完了！</Text>
                    <Text style={styles.resultText}>
                        {sessionQuestions.length}問中、{clearedCount}問を克服しました！
                    </Text>
                    <Pressable style={styles.button} onPress={() => router.back()}>
                        <Text style={styles.buttonText}>完了</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    if (!isSessionActive) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Text style={styles.title}>苦手克服</Text>
                </View>
                <View style={styles.introContainer}>
                    <View style={styles.statsCard}>
                        <Text style={styles.statsNumber}>{dueCount}</Text>
                        <Text style={styles.statsLabel}>復習待ちの問題</Text>
                    </View>
                    <Text style={styles.description}>
                        間違えた問題を復習して、知識を定着させましょう。
                        2回連続で正解すると「克服」とみなされます。
                    </Text>
                    <Pressable style={styles.button} onPress={handleStart}>
                        <Text style={styles.buttonText}>復習を開始 ({Math.min(dueCount, 10)}問)</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const currentQuestion = sessionQuestions[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                </Pressable>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }
                        ]}
                    />
                </View>
            </View>

            {currentQuestion && (
                <QuestionRenderer
                    question={currentQuestion}
                    onContinue={handleContinue}
                />
            )}

            {xpAnimation.show && (
                <XPGainAnimation amount={xpAnimation.amount} />
            )}

            {nextReviewInfo && (
                <View style={styles.reviewFeedback}>
                    <Text style={styles.reviewFeedbackText}>{nextReviewInfo}</Text>
                </View>
            )}
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
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: 4,
        marginLeft: theme.spacing.md,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: theme.colors.primary,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.xl,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: theme.colors.text,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.sub,
        textAlign: "center",
        marginBottom: theme.spacing.xl,
    },
    introContainer: {
        flex: 1,
        padding: theme.spacing.xl,
        justifyContent: "center",
        alignItems: "center",
    },
    statsCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.xl,
        borderRadius: theme.radius.lg,
        alignItems: "center",
        marginBottom: theme.spacing.xl,
        width: "100%",
    },
    statsNumber: {
        fontSize: 48,
        fontWeight: "bold",
        color: theme.colors.primary,
    },
    statsLabel: {
        fontSize: 16,
        color: theme.colors.sub,
    },
    description: {
        fontSize: 16,
        color: theme.colors.text,
        textAlign: "center",
        marginBottom: theme.spacing.xl,
        lineHeight: 24,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radius.md, // Use md or lg, assuming full was meant to be large
        width: "100%",
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    resultContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.xl,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    resultText: {
        fontSize: 18,
        color: theme.colors.sub,
        marginBottom: theme.spacing.xl,
    },
    reviewFeedback: {
        position: "absolute",
        bottom: 120,
        left: 0,
        right: 0,
        alignItems: "center",
    },
    reviewFeedbackText: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.primary,
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.lg,
    },
});
