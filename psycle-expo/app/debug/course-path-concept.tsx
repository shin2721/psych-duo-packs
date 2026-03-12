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

type OrbitNodeStatus = "done" | "current" | "locked" | "reward";

type OrbitNode = {
  id: string;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: OrbitNodeStatus;
  angle: number;
};

const orbitNodes: OrbitNode[] = [
  {
    id: "check-in",
    label: "Check-in",
    shortLabel: "IN",
    icon: "sparkles",
    status: "done",
    angle: -90,
  },
  {
    id: "warm-up",
    label: "Warm-up",
    shortLabel: "UP",
    icon: "flash",
    status: "done",
    angle: -18,
  },
  {
    id: "lesson",
    label: "Core Lesson",
    shortLabel: "L3",
    icon: "play",
    status: "current",
    angle: 54,
  },
  {
    id: "mini-game",
    label: "Mini Game",
    shortLabel: "GM",
    icon: "game-controller",
    status: "locked",
    angle: 126,
  },
  {
    id: "reward",
    label: "Reward Chest",
    shortLabel: "XP",
    icon: "gift",
    status: "reward",
    angle: 198,
  },
];

const genres = ["Mental", "Money", "Work", "Health", "Social", "Study"];

function OrbitPathCard() {
  const size = 300;
  const center = size / 2;
  const radius = 102;

  return (
    <Card style={styles.orbitCard}>
      <View style={styles.orbitHeader}>
        <View>
          <Text style={styles.kicker}>Today&apos;s Path</Text>
          <Text style={styles.cardTitle}>Anxiety Reframe Sprint</Text>
          <Text style={styles.cardBody}>
            One focused lesson, one quick game, one review loop. Enough structure to
            feel guided, but not a 100-node obligation.
          </Text>
        </View>
        <View style={styles.badgeBubble}>
          <Ionicons name="flame" size={18} color={theme.colors.warn} />
          <Text style={styles.badgeBubbleText}>6</Text>
        </View>
      </View>

      <View style={styles.orbitWrap} testID="course-path-concept-orbit">
        <View style={[styles.orbitRing, { width: size, height: size }]}>
          <View style={styles.orbitTrackOuter} />
          <View style={styles.orbitTrackInner} />

          {orbitNodes.map((node) => {
            const angleInRadians = (node.angle * Math.PI) / 180;
            const x = center + radius * Math.cos(angleInRadians);
            const y = center + radius * Math.sin(angleInRadians);

            return (
              <View
                key={node.id}
                style={[
                  styles.nodeWrap,
                  {
                    left: x - 32,
                    top: y - 32,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${node.label}, ${node.status}`}
                  style={[
                    styles.node,
                    node.status === "done" && styles.nodeDone,
                    node.status === "current" && styles.nodeCurrent,
                    node.status === "locked" && styles.nodeLocked,
                    node.status === "reward" && styles.nodeReward,
                  ]}
                >
                  {node.status === "done" ? (
                    <Ionicons name="checkmark" size={22} color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name={node.icon}
                        size={18}
                        color={node.status === "locked" ? theme.colors.sub : "#fff"}
                      />
                      <Text
                        style={[
                          styles.nodeLabel,
                          node.status === "locked" && styles.nodeLabelLocked,
                        ]}
                      >
                        {node.shortLabel}
                      </Text>
                    </>
                  )}
                </Pressable>
                <Text style={styles.nodeCaption}>{node.label}</Text>
              </View>
            );
          })}

          <LinearGradient
            colors={["rgba(59,130,246,0.9)", "rgba(34,211,238,0.85)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbitCore}
          >
            <Text style={styles.orbitCoreKicker}>Current</Text>
            <Text style={styles.orbitCoreTitle}>Lesson 3</Text>
            <Text style={styles.orbitCoreBody}>Turn "I&apos;m stuck" into a reframe.</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.pathMetaRow}>
        <View style={styles.pathMetaItem}>
          <Text style={styles.pathMetaValue}>7 min</Text>
          <Text style={styles.pathMetaLabel}>today&apos;s run</Text>
        </View>
        <View style={styles.pathMetaItem}>
          <Text style={styles.pathMetaValue}>+38 XP</Text>
          <Text style={styles.pathMetaLabel}>if you finish</Text>
        </View>
        <View style={styles.pathMetaItem}>
          <Text style={styles.pathMetaValue}>1 chest</Text>
          <Text style={styles.pathMetaLabel}>reward loop</Text>
        </View>
      </View>

      <View style={styles.ctaRow}>
        <Button label="Start today’s path" size="lg" onPress={() => {}} testID="course-path-concept-start" />
        <Button
          label="Browse genres"
          variant="secondary"
          size="lg"
          onPress={() => {}}
          testID="course-path-concept-browse"
        />
      </View>
    </Card>
  );
}

export default function CoursePathConceptScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="course-path-concept-screen"
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="course-path-concept-back"
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
          </Pressable>
          <View style={styles.topTextWrap}>
            <Text style={styles.screenEyebrow}>Course concept</Text>
            <Text style={styles.screenTitle}>Circular daily path mock</Text>
          </View>
        </View>

        <Text style={styles.screenBody}>
          This is the version I would explore first instead of a long always-visible
          trail. The user sees a compact ring for today, not the full curriculum.
        </Text>

        <View style={styles.genreRow}>
          {genres.map((genre, index) => (
            <Pill key={genre} label={genre} active={index === 0} onPress={() => {}} />
          ))}
        </View>

        <OrbitPathCard />

        <SectionHeader title="Why this shape" />
        <Card>
          <Text style={styles.reasonTitle}>Less map pressure, more daily clarity</Text>
          <Text style={styles.reasonBody}>
            The ring makes the day feel finishable. It keeps Duolingo&apos;s playful node
            language, but the emphasis moves from “the whole course” to “the next
            few meaningful steps.”
          </Text>
        </Card>

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
          <View style={styles.challengeTags}>
            <View style={styles.challengeTag}>
              <Ionicons name="flash" size={14} color={theme.colors.accent} />
              <Text style={styles.challengeTagText}>+120 XP</Text>
            </View>
            <View style={styles.challengeTag}>
              <Ionicons name="gift" size={14} color={theme.colors.warn} />
              <Text style={styles.challengeTagText}>gold chest</Text>
            </View>
          </View>
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
  orbitCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  orbitHeader: {
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  kicker: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: 2,
  },
  cardBody: {
    ...theme.typography.body,
    color: theme.colors.sub,
    marginTop: theme.spacing.xs,
  },
  badgeBubble: {
    minWidth: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  badgeBubbleText: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  orbitWrap: {
    alignItems: "center",
  },
  orbitRing: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  orbitTrackOuter: {
    position: "absolute",
    inset: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  orbitTrackInner: {
    position: "absolute",
    inset: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.28)",
  },
  orbitCore: {
    width: 146,
    height: 146,
    borderRadius: 73,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    shadowColor: theme.colors.primaryLight,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  orbitCoreKicker: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.82)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  orbitCoreTitle: {
    ...theme.typography.h3,
    color: "#fff",
    marginTop: 2,
  },
  orbitCoreBody: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
    textAlign: "center",
  },
  nodeWrap: {
    position: "absolute",
    width: 64,
    alignItems: "center",
    gap: 6,
  },
  node: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.line,
    gap: 2,
  },
  nodeDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  nodeCurrent: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryLight,
    transform: [{ scale: 1.08 }],
  },
  nodeLocked: {
    backgroundColor: theme.colors.bg,
    borderColor: theme.colors.line,
  },
  nodeReward: {
    backgroundColor: theme.colors.warn,
    borderColor: "#fcd34d",
  },
  nodeLabel: {
    ...theme.typography.caption,
    color: "#fff",
    fontWeight: "700",
  },
  nodeLabelLocked: {
    color: theme.colors.sub,
  },
  nodeCaption: {
    ...theme.typography.caption,
    color: theme.colors.sub,
    textAlign: "center",
  },
  pathMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  pathMetaItem: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  pathMetaValue: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  pathMetaLabel: {
    ...theme.typography.caption,
    color: theme.colors.sub,
    marginTop: 2,
  },
  ctaRow: {
    gap: theme.spacing.sm,
  },
  reasonTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  reasonBody: {
    ...theme.typography.body,
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
  challengeTags: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    flexWrap: "wrap",
  },
  challengeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  challengeTagText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
});
