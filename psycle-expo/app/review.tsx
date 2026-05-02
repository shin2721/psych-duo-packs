import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "../lib/theme";
import { usePracticeState, useProgressionState } from "../lib/state";
import { hapticFeedback } from "../lib/haptics";
import { getQuestionFromId } from "../lib/lessons";
import { QuestionRenderer, Question } from "../components/QuestionRenderer";
import { XPGainAnimation } from "../components/XPGainAnimation";
import { SupportStatePanel } from "../components/SupportStatePanel";
import { ReviewFeedbackBanner, ReviewIntroSection, ReviewScreenHeader } from "../components/review/ReviewSections";
import i18n from "../lib/i18n";

export default function ReviewScreen() {
    const params = useLocalSearchParams<{ mode?: string }>();
    const isReturnMode = params.mode === "return";
    const {
        mistakes,
        getDueMistakes,
        processReviewResult,
        addReviewEvent,
        completeActiveReviewSupport,
        suppressActiveReviewSupport,
        returnSessionItems,
        clearReturnSession,
    } = usePracticeState();
    const { addXp } = useProgressionState();
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
            const loadedQuestions: Question[] = [];
            const sessionItems = isReturnMode
                ? returnSessionItems.slice(0, 5)
                : getDueMistakes().slice(0, 10).map((mistake) => ({ lessonId: mistake.lessonId, itemId: mistake.id }));

            sessionItems.forEach((item) => {
                const q = getQuestionFromId(item.lessonId, item.itemId);
                if (q) {
                    loadedQuestions.push(q);
                }
            });
            setSessionQuestions(loadedQuestions);
        }
    }, [getDueMistakes, isReturnMode, isSessionActive, returnSessionItems]);

    const handleStart = () => {
        setIsSessionActive(true);
        setCurrentIndex(0);
        setClearedCount(0);
        setShowResults(false);
    };

    const handleContinue = (isCorrect: boolean, xp: number) => {
        const currentQ = sessionQuestions[currentIndex];
        const questionId = currentQ?.source_id ?? currentQ?.id;
        if (!questionId) {
            return;
        }
        const currentMistake = mistakes.find(m => m.id === questionId);
        if (currentMistake?.lessonId) {
            addReviewEvent({
                itemId: questionId,
                lessonId: currentMistake.lessonId,
                result: isCorrect ? "correct" : "incorrect",
            });
        }

        if (isCorrect) {
            // Haptic feedback
            void hapticFeedback.success();

            // Process SRS result
            processReviewResult(questionId, true);

            // Check the mistake's new box to determine next review time
            if (currentMistake) {
                const nextBox = currentMistake.box + 1;
                if (nextBox >= 5) {
                    setNextReviewInfo(i18n.t("review.mastered"));
                    setClearedCount(prev => prev + 1);
                } else {
                    setNextReviewInfo(
                        i18n.t("review.nextReview", {
                            interval: i18n.t(`review.interval.box${nextBox}`),
                        })
                    );
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
            void hapticFeedback.error();
            // Reset to Box 1
            processReviewResult(questionId, false);
            setNextReviewInfo(i18n.t("review.reviewAgainNeeded"));
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
    const introCount = isReturnMode ? returnSessionItems.length : dueCount;

    if (introCount === 0) {
        return (
            <SafeAreaView style={styles.container} testID="review-screen">
                <ReviewScreenHeader
                    title={isReturnMode ? "戻るレッスン" : String(i18n.t("review.title"))}
                    icon="arrow-back"
                    onPress={() => {
                        suppressActiveReviewSupport();
                        if (isReturnMode) {
                            clearReturnSession();
                        }
                        router.back();
                    }}
                    accessibilityLabel={`${i18n.t("common.back")}: ${isReturnMode ? "戻るレッスン" : i18n.t("review.title")}`}
                />
                <SupportStatePanel
                    icon="checkmark-circle-outline"
                    title={isReturnMode ? "戻るレッスンはありません" : String(i18n.t("review.emptyTitle"))}
                    body={isReturnMode ? "再開できる短い復習は今はありません。" : String(i18n.t("review.emptyText"))}
                    ctaLabel={String(i18n.t("review.backToCourse"))}
                    onPress={() => {
                        suppressActiveReviewSupport();
                        if (isReturnMode) {
                            clearReturnSession();
                        }
                        router.back();
                    }}
                />
            </SafeAreaView>
        );
    }

    if (showResults) {
        return (
            <SafeAreaView style={styles.container} testID="review-screen">
                <SupportStatePanel
                    icon="sparkles-outline"
                    title={isReturnMode ? "戻るレッスンを終えました" : String(i18n.t("review.doneTitle"))}
                    body={String(
                        isReturnMode
                            ? `短い復習を ${sessionQuestions.length} 問終えました。`
                            : i18n.t("review.resultSummary", {
                                total: sessionQuestions.length,
                                cleared: clearedCount,
                            })
                    )}
                    ctaLabel={String(i18n.t("review.backToCourse"))}
                    onPress={() => {
                        completeActiveReviewSupport();
                        if (isReturnMode) {
                            clearReturnSession();
                        }
                        router.back();
                    }}
                />
            </SafeAreaView>
        );
    }

    if (!isSessionActive) {
        return (
            <SafeAreaView style={styles.container} testID="review-screen">
            <ReviewScreenHeader
                title={isReturnMode ? "戻るレッスン" : String(i18n.t("review.title"))}
                icon="arrow-back"
                onPress={() => {
                    suppressActiveReviewSupport();
                    if (isReturnMode) {
                        clearReturnSession();
                    }
                    router.back();
                }}
                accessibilityLabel={`${i18n.t("common.back")}: ${isReturnMode ? "戻るレッスン" : i18n.t("review.title")}`}
            />
                <ReviewIntroSection dueCount={introCount} onStart={handleStart} />
            </SafeAreaView>
        );
    }

    const currentQuestion = sessionQuestions[currentIndex];

    return (
        <SafeAreaView style={styles.container} testID="review-screen">
            <ReviewScreenHeader
                title={isReturnMode ? "戻るレッスン" : String(i18n.t("review.title"))}
                icon="close"
                onPress={() => {
                    suppressActiveReviewSupport();
                    if (isReturnMode) {
                        clearReturnSession();
                    }
                    router.back();
                }}
                progress={(currentIndex + 1) / sessionQuestions.length}
                accessibilityLabel={`${i18n.t("common.close")}: ${isReturnMode ? "戻るレッスン" : i18n.t("review.title")}`}
            />

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
                <ReviewFeedbackBanner message={nextReviewInfo} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
});
