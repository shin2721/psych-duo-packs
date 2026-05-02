import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { genres } from "../../lib/data";
import type { IoniconName } from "../../lib/ioniconName";
import { useOnboarding } from "../../lib/OnboardingContext";
import { hapticFeedback } from "../../lib/haptics";
import { Analytics } from "../../lib/analytics";
import { getFirstLessonTargetForGenre, saveOnboardingSelectedGenres } from "../../lib/onboardingSelection";
import i18n from "../../lib/i18n";
import { useProgressionState } from "../../lib/state";

export default function InterestsScreen() {
    const router = useRouter();
    const { completeOnboarding } = useOnboarding();
    const { setSelectedGenre } = useProgressionState();
    const e2eAnalyticsMode = process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === "1";
    const [selectedGenres, setSelectedGenres] = useState<string[]>(e2eAnalyticsMode ? ["mental"] : []);

    const toggleGenre = (genreId: string) => {
        void hapticFeedback.light();
        setSelectedGenres(prev =>
            prev.includes(genreId)
                ? prev.filter(id => id !== genreId)
                : [...prev, genreId]
        );
    };

    const handleContinue = async () => {
        const genresToSave = selectedGenres.length > 0 ? selectedGenres : (e2eAnalyticsMode ? ["mental"] : []);

        // Save selected genres before completing onboarding so the first course state can use it.
        const savedGenres = await saveOnboardingSelectedGenres(genresToSave);
        const primaryGenreId = savedGenres[0] ?? "mental";
        const firstLessonTarget = getFirstLessonTargetForGenre(primaryGenreId);
        setSelectedGenre(primaryGenreId);
        Analytics.track("onboarding_genres_selected", {
            selectedGenres: savedGenres,
            primaryGenreId,
            selectionCount: savedGenres.length,
            source: "onboarding_interests",
        });
        Analytics.track("onboarding_first_lesson_targeted", {
            genreId: firstLessonTarget.genreId,
            lessonFile: firstLessonTarget.lessonFile,
            source: "onboarding_interests",
        });

        // Complete onboarding (updates context and AsyncStorage)
        void hapticFeedback.success();
        await completeOnboarding();

        // Navigation is handled by RootLayout based on state change, 
        // but we can also explicitly navigate if needed.
        // RootLayout priority 2 will catch the state change and redirect to /auth if no session.
    };

    const iconMap: Record<string, IoniconName> = {
        brain: "sparkles",
        sparkles: "sparkles",
        cash: "cash",
        briefcase: "briefcase",
        fitness: "fitness",
        people: "people",
        book: "book",
    };

    const getGenreLabel = (genreId: string, fallback: string) => {
        const key = `onboarding.genres.${genreId}`;
        const translated = i18n.t(key);
        return translated === key ? fallback : translated;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel={`${i18n.t("common.back")}: ${i18n.t("onboarding.interests.title")}`}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.title} testID="onboarding-interests-title">{i18n.t("onboarding.interests.title")}</Text>
                <Text style={styles.subtitle}>
                    {i18n.t("onboarding.interests.subtitle")}
                </Text>

                <View style={styles.grid}>
                    {genres.map(genre => {
                        const isSelected = selectedGenres.includes(genre.id);
                        return (
                            <Pressable
                                key={genre.id}
                                style={[
                                    styles.genreCard,
                                    isSelected && styles.genreCardSelected,
                                ]}
                                onPress={() => toggleGenre(genre.id)}
                                testID={`onboarding-genre-${genre.id}`}
                                accessibilityRole="button"
                                accessibilityLabel={getGenreLabel(genre.id, genre.label)}
                                accessibilityState={{ selected: isSelected }}
                            >
                                <Ionicons
                                    name={iconMap[genre.icon]}
                                    size={40}
                                    color={isSelected ? "#fff" : theme.colors.primary}
                                />
                                <Text
                                    style={[
                                        styles.genreLabel,
                                        isSelected && styles.genreLabelSelected,
                                    ]}
                                >
                                    {getGenreLabel(genre.id, genre.label)}
                                </Text>
                                {isSelected && (
                                    <View style={styles.checkmark}>
                                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Pressable
                    style={[
                        styles.button,
                        !e2eAnalyticsMode && selectedGenres.length === 0 && styles.buttonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!e2eAnalyticsMode && selectedGenres.length === 0}
                    accessibilityRole="button"
                    accessibilityLabel={String(i18n.t("onboarding.interests.continue"))}
                    accessibilityHint={String(i18n.t("onboarding.interests.subtitle"))}
                    accessibilityState={{ disabled: !e2eAnalyticsMode && selectedGenres.length === 0 }}
                    testID="onboarding-finish"
                >
                    <Text style={styles.buttonText}>{i18n.t("onboarding.interests.continue")}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
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
        padding: theme.spacing.md,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: theme.spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.sub,
        marginBottom: theme.spacing.xl,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.md,
    },
    genreCard: {
        width: "47%",
        aspectRatio: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    genreCardSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    genreLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
        textAlign: "center",
    },
    genreLabelSelected: {
        color: "#fff",
    },
    checkmark: {
        position: "absolute",
        top: theme.spacing.sm,
        right: theme.spacing.sm,
    },
    footer: {
        padding: theme.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: theme.colors.line,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.lg,
        gap: theme.spacing.sm,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.surface,
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
});
