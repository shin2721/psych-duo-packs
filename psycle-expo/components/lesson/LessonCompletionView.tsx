import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { theme } from "../../lib/theme";
import { StarBackground } from "../StarBackground";
import { getEvidenceSummary } from "../../lib/evidenceSummary";
import { XP_REWARDS } from "../../lib/streaks";
import i18n from "../../lib/i18n";
import type { Lesson } from "../../lib/lessons";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

const TILE_XP = "#E5A93C";
const TILE_HITS = "#38BDF8";
const TILE_EVIDENCE = "#22C55E";

/** 数字のタイル。枠色だけを変えて、中は同じ濃色地に大きな数字を置く。 */
function StatTile(props: { accent: string; delay: number; label: string; testID?: string; value: string }) {
  const appear = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(appear, {
      delay: props.delay,
      duration: 260,
      easing: Easing.out(Easing.back(1.6)),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [appear, props.delay]);

  return (
    <Animated.View
      style={[
        styles.tile,
        { borderColor: props.accent },
        {
          opacity: appear,
          transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }],
        },
      ]}
      testID={props.testID}
    >
      <Text style={[styles.tileLabel, { color: props.accent }]}>{props.label}</Text>
      <Text style={styles.tileValue}>{props.value}</Text>
    </Animated.View>
  );
}

export function LessonCompletionView(props: {
  completionBottomInset: number;
  // 当たった数。能力ラベルは付けない（偶然率の違う問題の合算はスコアにならない）。
  correctCount?: number;
  currentLesson: Lesson | null;
  originalQuestions: Question[];
  onDismissDoubleXpNudge: () => void;
  onPressPurchaseDoubleXp: () => void;
  showDoubleXpNudge: boolean;
}) {
  const expandedDetails = props.originalQuestions.find((q) => q.expanded_details)?.expanded_details;
  const evidenceSummary = getEvidenceSummary(expandedDetails);
  const completedQuestionCount = props.originalQuestions.length;
  const recapAction = resolveCompletionRecapAction(
    props.originalQuestions,
    evidenceSummary.actionHint,
    props.currentLesson?.metadata?.takeaway_action
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }} testID="lesson-complete-screen">
      <StarBackground />

      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <ScrollView
          testID="lesson-complete-scroll"
          contentContainerStyle={[styles.container, { paddingBottom: props.completionBottomInset }]}
        >
          <Text style={styles.title}>{i18n.t("lesson.completeTitle")}</Text>

          {/* 数字だけを主役にする。説明文を添えると、その瞬間ただの報告書になる。 */}
          <View style={styles.tileRow} testID="lesson-complete-recap">
            <StatTile
              accent={TILE_XP}
              delay={0}
              label={String(i18n.t("lesson.completionRecap.xp"))}
              value={`+${XP_REWARDS.LESSON_COMPLETE}`}
            />
            {typeof props.correctCount === "number" ? (
              <StatTile
                accent={TILE_HITS}
                delay={110}
                label={String(i18n.t("lesson.completionRecap.hits"))}
                testID="lesson-complete-hits"
                value={`${props.correctCount}/${completedQuestionCount}`}
              />
            ) : null}
            <StatTile
              accent={TILE_EVIDENCE}
              delay={220}
              label={String(i18n.t("lesson.completionRecap.evidence"))}
              value={evidenceSummary.tryValue}
            />
          </View>

          {/* この画面に残す唯一の文章。持ち帰る一手を主役に置く。 */}
          <View style={styles.actionCard}>
            <Text style={styles.actionLabel}>{i18n.t("lesson.completionRecap.nextPromise")}</Text>
            <Text style={styles.actionText}>{recapAction}</Text>
          </View>

          {props.showDoubleXpNudge ? (
            <View style={styles.nudgeCard} testID="lesson-complete-double-xp">
              <Text style={styles.nudgeTitle}>{i18n.t("lesson.doubleXpNudge.title")}</Text>
              <Text style={styles.nudgeBody}>{i18n.t("lesson.doubleXpNudge.body")}</Text>
              <View style={styles.nudgeActions}>
                <TouchableOpacity onPress={props.onDismissDoubleXpNudge} style={styles.nudgeDismiss}>
                  <Text style={styles.nudgeDismissText}>{i18n.t("lesson.doubleXpNudge.dismiss")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={props.onPressPurchaseDoubleXp} style={styles.nudgeCta}>
                  <Text style={styles.nudgeCtaText}>{i18n.t("lesson.doubleXpNudge.cta")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(props.completionBottomInset, 20) }]}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/course")}
            style={styles.continueButton}
            testID="lesson-complete-continue"
            accessibilityRole="button"
            accessibilityLabel={String(i18n.t("lesson.continue"))}
          >
            <Text style={styles.continueText}>{i18n.t("lesson.continue")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 32,
  },
  title: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 36,
    textAlign: "center",
  },
  tileRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginBottom: 36,
  },
  tile: {
    alignItems: "center",
    backgroundColor: "rgba(9, 16, 32, 0.72)",
    borderRadius: 16,
    borderWidth: 2,
    flex: 1,
    paddingVertical: 14,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  tileValue: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  actionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  actionLabel: {
    color: theme.colors.sub,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  actionText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 30,
  },
  nudgeCard: {
    backgroundColor: "rgba(229, 169, 60, 0.10)",
    borderColor: "rgba(229, 169, 60, 0.28)",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 20,
    padding: 18,
  },
  nudgeTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  nudgeBody: {
    color: theme.colors.sub,
    fontSize: 14,
    lineHeight: 21,
  },
  nudgeActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  nudgeDismiss: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
  },
  nudgeDismissText: {
    color: theme.colors.sub,
    fontSize: 14,
    fontWeight: "700",
  },
  nudgeCta: {
    flex: 1,
    alignItems: "center",
    backgroundColor: TILE_XP,
    borderRadius: 12,
    paddingVertical: 12,
  },
  nudgeCtaText: {
    color: "#101828",
    fontSize: 14,
    fontWeight: "800",
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 8,
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
  },
  continueText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
