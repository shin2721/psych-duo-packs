import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Card, Pill, ProgressBar, SectionHeader } from "../../components/ui";
import { theme } from "../../lib/theme";

type FlowStepStatus = "done" | "current" | "next" | "reward";

type FlowStep = {
  id: string;
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: FlowStepStatus;
  xp?: string;
};

const genres = ["Mental", "Money", "Work", "Health", "Social", "Study"];

const flowSteps: FlowStep[] = [
  {
    id: "check-in",
    title: "Check-in",
    body: "30 sec mood lock-in",
    icon: "sparkles",
    status: "done",
    xp: "+4",
  },
  {
    id: "lesson",
    title: "Lesson 3",
    body: "Turn “I’m stuck” into a reframe",
    icon: "play",
    status: "current",
    xp: "+24",
  },
  {
    id: "mini-game",
    title: "Mini game",
    body: "Breath + evidence combo",
    icon: "game-controller",
    status: "next",
    xp: "+8",
  },
  {
    id: "reward",
    title: "Reward chest",
    body: "Claim gems and move on",
    icon: "gift",
    status: "reward",
    xp: "1 chest",
  },
];

function FlowStepCard({ step, index }: { step: FlowStep; index: number }) {
  const isDone = step.status === "done";
  const isCurrent = step.status === "current";
  const isReward = step.status === "reward";

  return (
    <View style={styles.flowRow}>
      <View style={styles.flowRail}>
        <View
          style={[
            styles.flowDot,
            isDone && styles.flowDotDone,
            isCurrent && styles.flowDotCurrent,
            isReward && styles.flowDotReward,
          ]}
        >
          {isDone ? (
            <Ionicons name="checkmark" size={18} color="#fff" />
          ) : (
            <Ionicons
              name={step.icon}
              size={18}
              color={step.status === "next" ? theme.colors.sub : "#fff"}
            />
          )}
        </View>
        {index !== flowSteps.length - 1 ? <View style={styles.flowLine} /> : null}
      </View>

      <Card
        style={StyleSheet.flatten([
          styles.flowCard,
          isCurrent ? styles.flowCardCurrent : null,
          isReward ? styles.flowCardReward : null,
        ])}
      >
        <View style={styles.flowCardTop}>
          <View style={styles.flowTextWrap}>
            <Text style={styles.flowTitle}>{step.title}</Text>
            <Text style={styles.flowBody}>{step.body}</Text>
          </View>
          <Text style={styles.flowMeta}>{step.xp}</Text>
        </View>
      </Card>
    </View>
  );
}

export default function CourseFocusConceptScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="course-focus-concept-screen"
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="course-focus-concept-back"
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
          </Pressable>
          <View style={styles.topTextWrap}>
            <Text style={styles.screenEyebrow}>Course concept</Text>
            <Text style={styles.screenTitle}>Focus lane daily path</Text>
          </View>
        </View>

        <Text style={styles.screenBody}>
          This is my own direction: one strong “today” lane, not a giant map and not a
          decorative ring. The user should feel pulled into one finishable session.
        </Text>

        <View style={styles.genreRow}>
          {genres.map((genre, index) => (
            <Pill key={genre} label={genre} active={index === 0} onPress={() => {}} />
          ))}
        </View>

        <LinearGradient
          colors={["rgba(59,130,246,0.28)", "rgba(34,211,238,0.12)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroShell}
        >
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroEyebrow}>Today’s focus</Text>
                <Text style={styles.heroTitle}>Anxiety Reframe Sprint</Text>
                <Text style={styles.heroBody}>
                  Built for the moment when the user wants one clear next move, not the
                  full curriculum.
                </Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeValue}>7 min</Text>
                <Text style={styles.heroBadgeLabel}>finishable</Text>
              </View>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>+38 XP</Text>
                <Text style={styles.heroStatLabel}>session reward</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>1 chest</Text>
                <Text style={styles.heroStatLabel}>completion loop</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>3/5</Text>
                <Text style={styles.heroStatLabel}>weekly target</Text>
              </View>
            </View>

            <Button
              label="Start today’s focus"
              size="lg"
              onPress={() => {}}
              testID="course-focus-concept-start"
            />
          </Card>
        </LinearGradient>

        <SectionHeader title="Session lane" />
        <Card style={styles.flowShell}>
          {flowSteps.map((step, index) => (
            <FlowStepCard key={step.id} step={step} index={index} />
          ))}
        </Card>

        <SectionHeader title="Why this works" />
        <View style={styles.reasonGrid}>
          <Card style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>Less cognitive load</Text>
            <Text style={styles.reasonBody}>
              The user sees one lane, one next step, one reward loop.
            </Text>
          </Card>
          <Card style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>Genre freedom stays</Text>
            <Text style={styles.reasonBody}>
              Genre chips stay on top, but the body only commits to today.
            </Text>
          </Card>
        </View>

        <SectionHeader title="Weekly challenge" />
        <Card>
          <View style={styles.challengeHeader}>
            <View>
              <Text style={styles.challengeTitle}>Three focused sessions this week</Text>
              <Text style={styles.challengeBody}>Mental reframe, one review, one mini game.</Text>
            </View>
            <Text style={styles.challengeCount}>3/5</Text>
          </View>
          <ProgressBar value={3} max={5} style={styles.challengeBar} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  topTextWrap: {
    flex: 1,
  },
  screenEyebrow: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  screenTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  screenBody: {
    ...theme.typography.body,
    color: theme.colors.sub,
  },
  genreRow: {
    flexDirection: "row",
    marginRight: -theme.spacing.sm,
  },
  heroShell: {
    borderRadius: theme.radius.xl,
    padding: 1,
  },
  heroCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.22)",
  },
  heroHeader: {
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  heroEyebrow: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginTop: 4,
  },
  heroBody: {
    ...theme.typography.body,
    color: theme.colors.sub,
    marginTop: theme.spacing.xs,
    maxWidth: 500,
  },
  heroBadge: {
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(15,23,42,0.88)",
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  heroBadgeValue: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  heroBadgeLabel: {
    ...theme.typography.caption,
    color: theme.colors.sub,
  },
  heroStats: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  heroStat: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  heroStatValue: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  heroStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.sub,
    marginTop: 2,
  },
  flowShell: {
    paddingVertical: theme.spacing.sm,
  },
  flowRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  flowRail: {
    width: 40,
    alignItems: "center",
  },
  flowDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.line,
  },
  flowDotDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  flowDotCurrent: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryLight,
  },
  flowDotReward: {
    backgroundColor: theme.colors.warn,
    borderColor: "#fcd34d",
  },
  flowLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.line,
    marginVertical: 6,
  },
  flowCard: {
    flex: 1,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  flowCardCurrent: {
    borderColor: "rgba(96,165,250,0.55)",
    backgroundColor: "#132440",
  },
  flowCardReward: {
    borderColor: "rgba(245,158,11,0.45)",
  },
  flowCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  flowTextWrap: {
    flex: 1,
  },
  flowTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  flowBody: {
    ...theme.typography.caption,
    color: theme.colors.sub,
    marginTop: 4,
  },
  flowMeta: {
    ...theme.typography.label,
    color: theme.colors.accent,
  },
  reasonGrid: {
    gap: theme.spacing.sm,
  },
  reasonCard: {
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  reasonTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  reasonBody: {
    ...theme.typography.caption,
    color: theme.colors.sub,
    marginTop: theme.spacing.xs,
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    alignItems: "flex-start",
  },
  challengeTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  challengeBody: {
    ...theme.typography.caption,
    color: theme.colors.sub,
    marginTop: 4,
  },
  challengeCount: {
    ...theme.typography.h2,
    color: theme.colors.accent,
  },
  challengeBar: {
    marginTop: theme.spacing.md,
  },
});
