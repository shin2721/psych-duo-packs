import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Card, Pill, ProgressBar } from "../../components/ui";
import { StarBackground } from "../../components/StarBackground";
import { theme } from "../../lib/theme";

type CompareView = "final" | "codex" | "claude";
type OrbitNodeStatus = "done" | "locked" | "reward";
type ClaudeNodeStatus = "done" | "current" | "locked" | "reward" | "game" | "milestone";

type OrbitNode = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: OrbitNodeStatus;
  angle: number;
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const ORBIT_SIZE = Math.min(SCREEN_WIDTH - 24, 404);

const orbitNodes: OrbitNode[] = [
  { id: "check-in", label: "Check-in", icon: "sparkles", status: "done", angle: -128 },
  { id: "warm-up", label: "Warm-up", icon: "flash", status: "done", angle: -18 },
  { id: "mini-game", label: "Mini Game", icon: "game-controller", status: "locked", angle: 132 },
  { id: "reward", label: "Reward Chest", icon: "gift", status: "reward", angle: 220 },
];

const claudeTrailNodes: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
  status: ClaudeNodeStatus;
  xp?: string;
  doneLabel?: string;
  side?: "left" | "right";
}> = [
  {
    id: "check-in",
    title: "Check-in",
    description: "Rate how your mind feels before you start.",
    icon: "sparkles",
    status: "done",
    xp: "+4 XP",
    doneLabel: "Done",
    side: "left",
  },
  {
    id: "thought-catch",
    title: "Thought catch",
    description: "Name the automatic thought you want to work on.",
    icon: "scan",
    status: "done",
    xp: "+12 XP",
    doneLabel: "Done",
    side: "right",
  },
  {
    id: "breath-prep",
    title: "Breath prep",
    description: "Settle your nervous system before the lesson.",
    icon: "leaf",
    status: "done",
    xp: "+8 XP",
    doneLabel: "Done",
    side: "left",
  },
  {
    id: "reward",
    title: "Reward chest",
    description: "Gems and a custom badge wait here.",
    icon: "gift",
    status: "reward",
    side: "left",
  },
  {
    id: "game",
    title: "Evidence balance",
    description: "A mini game that weighs the evidence.",
    icon: "game-controller",
    status: "game",
    side: "right",
  },
  {
    id: "milestone",
    title: "Chapter review",
    description: "A final check with a gold badge on a clean run.",
    icon: "star",
    status: "milestone",
    side: "left",
  },
];

function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
      </Pressable>
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    </View>
  );
}

function CompareTabs({
  view,
  onChange,
}: {
  view: CompareView;
  onChange: (next: CompareView) => void;
}) {
  return (
    <View style={styles.tabsRow}>
      <Pill label="Final" active={view === "final"} onPress={() => onChange("final")} />
      <Pill label="Codex" active={view === "codex"} onPress={() => onChange("codex")} />
      <Pill label="Claude" active={view === "claude"} onPress={() => onChange("claude")} />
    </View>
  );
}

function OrbitNodeChip({
  node,
  x,
  y,
}: {
  node: OrbitNode;
  x: number;
  y: number;
}) {
  return (
    <View
      style={[
        styles.orbitNodeWrap,
        {
          left: x - 40,
          top: y - 40,
        },
      ]}
    >
      <View
        style={[
          styles.orbitNode,
          node.status === "done" && styles.orbitNodeDone,
          node.status === "locked" && styles.orbitNodeLocked,
          node.status === "reward" && styles.orbitNodeReward,
        ]}
      >
        <Ionicons
          name={node.icon}
          size={22}
          color={node.status === "done" ? "#081119" : node.status === "locked" ? theme.colors.sub : "#fff"}
        />
      </View>
      <View style={styles.orbitNodeCaption}>
        <Text style={styles.orbitNodeCaptionText}>{node.label}</Text>
      </View>
    </View>
  );
}

function CodexOrbitConcept() {
  const center = ORBIT_SIZE / 2;
  const radius = ORBIT_SIZE / 2 - 54;

  return (
    <View style={styles.sectionGap}>
      <View style={styles.copyBlock}>
        <Text style={styles.sectionEyebrow}>Tonight&apos;s loop</Text>
        <Text style={styles.sectionTitle}>Anxiety Reframe</Text>
        <Text style={styles.sectionBody}>One focused loop you can finish tonight.</Text>
      </View>

      <View style={styles.codexOrbitWrap}>
        <View style={styles.orbitTimeChip}>
          <Ionicons name="flash" size={14} color={theme.colors.accent} />
          <Text style={styles.orbitTimeText}>7 min session</Text>
        </View>

        <View
          style={[
            styles.orbitShell,
            {
              width: ORBIT_SIZE,
              height: ORBIT_SIZE,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(58,173,255,0.28)", "rgba(58,173,255,0)", "rgba(168,255,96,0.12)"]}
            start={{ x: 0.15, y: 0.1 }}
            end={{ x: 0.9, y: 0.95 }}
            style={styles.orbitHalo}
          />
          <View style={styles.ringOuter} />
          <View style={styles.ringMiddle} />
          <View style={styles.ringInner} />

          {orbitNodes.map((node) => {
            const angleInRadians = (node.angle * Math.PI) / 180;
            const x = center + radius * Math.cos(angleInRadians);
            const y = center + radius * Math.sin(angleInRadians);

            return <OrbitNodeChip key={node.id} node={node} x={x} y={y} />;
          })}

          <LinearGradient
            colors={["rgba(39,111,255,0.98)", "rgba(51,220,255,0.92)"]}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.coreOrb}
          >
            <Text style={styles.coreKicker}>Tonight&apos;s lesson</Text>
            <Text style={styles.coreTitle}>Lesson 3</Text>
            <Text style={styles.coreBody}>Turn one stuck thought into a workable reframe.</Text>
            <View style={styles.coreXpChip}>
              <Ionicons name="flash" size={16} color="#081119" />
              <Text style={styles.coreXpText}>+38 XP</Text>
            </View>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.ctaStack}>
        <Button label="Enter today’s orbit" size="lg" onPress={() => {}} />
        <Pressable style={styles.secondaryLink} onPress={() => {}}>
          <Text style={styles.secondaryLinkText}>Browse genres</Text>
        </Pressable>
      </View>

      <Card style={styles.weeklyShell}>
        <View style={styles.weeklyHeader}>
          <View style={styles.weeklyTextWrap}>
            <Text style={styles.sectionEyebrow}>Weekly challenge</Text>
            <Text style={styles.weeklyTitle}>Three focused sessions this week</Text>
          </View>
          <Text style={styles.weeklyCount}>3/5</Text>
        </View>
        <ProgressBar value={3} max={5} style={styles.weeklyBar} />
      </Card>
    </View>
  );
}

function ClaudeTrailNode({
  title,
  description,
  icon,
  status,
  xp,
  doneLabel,
}: {
  title: string;
  description: string;
  icon: string;
  status: Exclude<ClaudeNodeStatus, "current">;
  xp?: string;
  doneLabel?: string;
}) {
  const circleStyle =
    status === "done"
      ? styles.claudeNodeCircleDone
      : status === "reward"
        ? styles.claudeNodeCircleReward
        : status === "game"
          ? styles.claudeNodeCircleGame
          : status === "milestone"
            ? styles.claudeNodeCircleMilestone
            : styles.claudeNodeCircleLocked;

  return (
    <View style={styles.claudeNodeRow}>
      <View style={[styles.claudeNodeCircle, circleStyle]}>
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={status === "done" ? "#081119" : theme.colors.text}
        />
        {status === "done" ? (
          <View style={styles.claudeDoneBadge}>
            <Ionicons name="checkmark" size={10} color="#081119" />
          </View>
        ) : null}
      </View>
      <View style={styles.claudeNodeBody}>
        <Text
          style={[
            styles.claudeNodeTitle,
            status === "locked" && styles.claudeNodeTitleLocked,
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.claudeNodeDescription,
            status === "locked" && styles.claudeNodeDescriptionLocked,
          ]}
        >
          {description}
        </Text>
        {xp || doneLabel ? (
          <View style={styles.claudeNodeMetaRow}>
            {xp ? (
              <View style={styles.claudeXpBadge}>
                <Text style={styles.claudeXpBadgeText}>{xp}</Text>
              </View>
            ) : null}
            {doneLabel ? <Text style={styles.claudeDoneText}>{doneLabel}</Text> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ClaudeTrailConcept() {
  return (
    <View style={styles.sectionGap}>
      <View style={styles.copyBlock}>
        <Text style={styles.sectionEyebrow}>Chapter 1 · Mental</Text>
        <Text style={styles.sectionTitle}>Cognitive reframe</Text>
        <Text style={styles.sectionBody}>A clearer trail that shows what is done, what is next, and what is still waiting.</Text>
      </View>

      <View style={styles.claudeProgressRow}>
        <View style={styles.claudeProgressRing}>
          <View style={styles.claudeProgressRingInner}>
            <Text style={styles.claudeProgressRingText}>3/7</Text>
          </View>
        </View>
        <View style={styles.claudeProgressInfo}>
          <Text style={styles.claudeProgressTitle}>4 lessons left</Text>
          <Text style={styles.claudeProgressSubtitle}>Finish this chapter to unlock a star badge.</Text>
        </View>
      </View>

      <View style={styles.claudeTrailShell}>
        <View style={styles.claudeSpine} />
        <View style={styles.claudeSpineDone} />

        {claudeTrailNodes.slice(0, 3).map((node) => (
          <ClaudeTrailNode
            key={node.id}
            title={node.title}
            description={node.description}
            icon={node.icon}
            status={node.status as Exclude<ClaudeNodeStatus, "current">}
            xp={node.xp}
            doneLabel={node.doneLabel}
          />
        ))}

        <Card style={styles.claudeHeroCard}>
          <View style={styles.claudeHeroInner}>
            <View style={styles.claudeCurrentCircle}>
              <Ionicons name="leaf" size={24} color="#fff" />
            </View>
            <View style={styles.claudeHeroContent}>
              <Text style={styles.claudeHeroTitle}>Reframe lesson</Text>
              <Text style={styles.claudeHeroBody}>
                Recast a difficult event from a more workable angle.
              </Text>
              <View style={styles.claudeHeroMetaRow}>
                <View style={styles.claudeHeroMetaPill}>
                  <Text style={styles.claudeHeroMetaText}>+24 XP</Text>
                </View>
                <View style={styles.claudeHeroMetaPillMuted}>
                  <Text style={styles.claudeHeroMetaTextMuted}>5 min</Text>
                </View>
                <View style={styles.claudeHeroMetaPillWarm}>
                  <Text style={styles.claudeHeroMetaTextWarm}>MCQ</Text>
                </View>
              </View>
              <Button label="Start lesson" size="md" onPress={() => {}} style={styles.claudeHeroButton} />
            </View>
          </View>
        </Card>

        <View style={styles.claudeDividerRow}>
          <View style={styles.claudeDividerLine} />
          <Text style={styles.claudeDividerLabel}>Continue</Text>
          <View style={styles.claudeDividerLine} />
        </View>

        {claudeTrailNodes.slice(3).map((node) => (
          <ClaudeTrailNode
            key={node.id}
            title={node.title}
            description={node.description}
            icon={node.icon}
            status={node.status as Exclude<ClaudeNodeStatus, "current">}
          />
        ))}

        <View style={styles.claudeNextChapterHint}>
          <Text style={styles.sectionEyebrow}>Chapter 2</Text>
          <Text style={styles.claudeNextChapterTitle}>Emotion literacy</Text>
          <Text style={styles.claudeNextChapterBody}>The next chapter is already peeking through below the current run.</Text>
        </View>
      </View>
    </View>
  );
}

function FinalHybridConcept() {
  const finalNodes = [
    { id: "arrival", label: "Arrive", icon: "sparkles" as const, state: "done" as const, angle: -132 },
    { id: "lesson", label: "Reframe", icon: "leaf" as const, state: "current" as const, angle: -18 },
    { id: "play", label: "Play", icon: "game-controller" as const, state: "locked" as const, angle: 128 },
    { id: "reward", label: "Collect", icon: "gift" as const, state: "reward" as const, angle: 222 },
  ];
  const stageSize = 268;
  const center = stageSize / 2;
  const radius = stageSize / 2 - 42;

  return (
    <View style={styles.sectionGap}>
      <View style={styles.copyBlock}>
        <Text style={styles.sectionEyebrow}>Tonight&apos;s focus</Text>
        <Text style={styles.sectionTitle}>Anxiety Reframe</Text>
        <Text style={styles.sectionBody}>A compact orbit that feels like Psycle, not a task list.</Text>
      </View>

      <Card style={styles.finalOrbitCard}>
        <View style={styles.finalPathHeader}>
          <View style={styles.finalPathHeaderCopy}>
            <Text style={styles.sectionEyebrow}>Tonight&apos;s orbit</Text>
            <Text style={styles.finalPathTitle}>Four clear steps</Text>
          </View>
          <View style={styles.finalProgressChip}>
            <Text style={styles.finalProgressText}>2 of 4</Text>
          </View>
        </View>

        <View style={styles.finalOrbitStage}>
          <View style={styles.finalOrbitHalo} />
          <View style={styles.finalOrbitRingOuter} />
          <View style={styles.finalOrbitRingInner} />

          {finalNodes.map((node) => {
            const angleInRadians = (node.angle * Math.PI) / 180;
            const x = center + radius * Math.cos(angleInRadians);
            const y = center + radius * Math.sin(angleInRadians);

            return (
              <View
                key={node.id}
                style={[
                  styles.finalNodeWrap,
                  {
                    left: x - 32,
                    top: y - 32,
                  },
                ]}
              >
                <View
                  style={[
                    styles.finalNode,
                    node.state === "done" && styles.finalNodeDone,
                    node.state === "current" && styles.finalNodeCurrent,
                    node.state === "locked" && styles.finalNodeLocked,
                    node.state === "reward" && styles.finalNodeReward,
                  ]}
                >
                  <Ionicons
                    name={node.icon}
                    size={20}
                    color={
                      node.state === "done" || node.state === "current"
                        ? "#081119"
                        : node.state === "reward"
                          ? "#fff"
                          : theme.colors.sub
                    }
                  />
                </View>
                <Text style={styles.finalNodeLabel}>{node.label}</Text>
              </View>
            );
          })}

          <LinearGradient
            colors={["rgba(52,120,255,0.98)", "rgba(53,209,255,0.9)"]}
            start={{ x: 0.12, y: 0.12 }}
            end={{ x: 0.88, y: 1 }}
            style={styles.finalCoreOrb}
          >
            <Text style={styles.finalCoreKicker}>Current lesson</Text>
            <Text style={styles.finalCoreTitle}>Lesson 3</Text>
            <Text style={styles.finalCoreBody}>Turn one stuck thought into a workable reframe.</Text>
          </LinearGradient>
        </View>

        <View style={styles.finalStatRow}>
          <View style={styles.finalStatChip}>
            <Ionicons name="time-outline" size={14} color={theme.colors.accent} />
            <Text style={styles.finalStatText}>7 min</Text>
          </View>
          <View style={styles.finalStatChip}>
            <Ionicons name="flash" size={14} color={theme.colors.accent} />
            <Text style={styles.finalStatText}>+38 XP</Text>
          </View>
          <View style={styles.finalStatChip}>
            <Ionicons name="gift" size={14} color="#ffbf3c" />
            <Text style={styles.finalStatText}>1 chest</Text>
          </View>
        </View>

        <Button
          label="Enter tonight’s orbit"
          size="lg"
          onPress={() => {}}
          style={styles.finalPrimaryButton}
        />
      </Card>

      <Card style={styles.weeklyShell}>
        <View style={styles.weeklyHeader}>
          <View style={styles.weeklyTextWrap}>
            <Text style={styles.sectionEyebrow}>Weekly challenge</Text>
            <Text style={styles.weeklyTitle}>Three focused sessions this week</Text>
          </View>
          <Text style={styles.weeklyCount}>3/5</Text>
        </View>
        <ProgressBar value={3} max={5} style={styles.weeklyBar} />
      </Card>
    </View>
  );
}

export default function CourseConceptsCompareScreen() {
  const [view, setView] = useState<CompareView>("final");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StarBackground combo={6} />

      <View style={styles.topGlow} pointerEvents="none" />
      <View style={styles.bottomGlow} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="course-concepts-compare-screen"
      >
        <Header title="Course concepts" subtitle="Compare in simulator" />
        <CompareTabs view={view} onChange={setView} />
        {view === "final" ? (
          <FinalHybridConcept />
        ) : view === "codex" ? (
          <CodexOrbitConcept />
        ) : (
          <ClaudeTrailConcept />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  topGlow: {
    position: "absolute",
    top: -110,
    left: SCREEN_WIDTH * 0.46,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(51,220,255,0.18)",
  },
  bottomGlow: {
    position: "absolute",
    bottom: 120,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(168,255,96,0.09)",
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.lg,
  },
  headerRow: {
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
    backgroundColor: "rgba(7,16,33,0.78)",
    borderWidth: 1,
    borderColor: "rgba(73,103,161,0.5)",
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  tabsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  sectionGap: {
    gap: theme.spacing.lg,
  },
  copyBlock: {
    gap: 6,
  },
  sectionEyebrow: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  sectionBody: {
    ...theme.typography.label,
    color: "rgba(216,228,245,0.74)",
  },
  codexOrbitWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: ORBIT_SIZE + 18,
  },
  orbitTimeChip: {
    position: "absolute",
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(4,14,33,0.88)",
    borderWidth: 1,
    borderColor: "rgba(74,108,166,0.42)",
    zIndex: 4,
  },
  orbitTimeText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  orbitShell: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  orbitHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    transform: [{ scale: 1.18 }],
  },
  ringOuter: {
    position: "absolute",
    inset: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(87,123,192,0.4)",
  },
  ringMiddle: {
    position: "absolute",
    inset: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(122,175,255,0.26)",
  },
  ringInner: {
    position: "absolute",
    inset: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(168,255,96,0.16)",
  },
  orbitNodeWrap: {
    position: "absolute",
    width: 84,
    alignItems: "center",
    gap: 6,
    zIndex: 3,
  },
  orbitNode: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9,22,48,0.92)",
    borderWidth: 2,
    borderColor: "rgba(74,108,166,0.72)",
  },
  orbitNodeDone: {
    backgroundColor: "#b5ff64",
    borderColor: "#e7ffaf",
    shadowColor: "#b5ff64",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  orbitNodeLocked: {
    backgroundColor: "rgba(4,15,35,0.95)",
    borderColor: "rgba(65,89,136,0.55)",
  },
  orbitNodeReward: {
    backgroundColor: "rgba(255,174,47,0.94)",
    borderColor: "#ffec9d",
  },
  orbitNodeCaption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(8,17,33,0.84)",
    borderWidth: 1,
    borderColor: "rgba(63,94,151,0.28)",
  },
  orbitNodeCaptionText: {
    ...theme.typography.caption,
    color: "rgba(216,228,245,0.82)",
    textAlign: "center",
  },
  coreOrb: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    shadowColor: "rgba(51,220,255,0.9)",
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    zIndex: 2,
    gap: 8,
  },
  coreKicker: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.82)",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  coreTitle: {
    ...theme.typography.h2,
    color: "#fff",
    textAlign: "center",
  },
  coreBody: {
    ...theme.typography.label,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    maxWidth: 138,
  },
  coreXpChip: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  coreXpText: {
    ...theme.typography.label,
    color: "#081119",
  },
  ctaStack: {
    gap: theme.spacing.sm,
  },
  secondaryLink: {
    alignSelf: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  secondaryLinkText: {
    ...theme.typography.label,
    color: theme.colors.primary,
  },
  weeklyShell: {
    marginTop: theme.spacing.md,
  },
  weeklyHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  weeklyTextWrap: {
    flex: 1,
    gap: 2,
  },
  weeklyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  weeklyCount: {
    ...theme.typography.h2,
    color: theme.colors.accent,
  },
  weeklyBar: {
    marginTop: theme.spacing.sm,
  },
  claudeProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  claudeProgressRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.colors.accent,
    padding: 3,
    backgroundColor: "rgba(7,16,33,0.7)",
  },
  claudeProgressRingInner: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  claudeProgressRingText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: "800",
  },
  claudeProgressInfo: {
    flex: 1,
    gap: 2,
  },
  claudeProgressTitle: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  claudeProgressSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.sub,
  },
  claudeTrailShell: {
    position: "relative",
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  claudeSpine: {
    position: "absolute",
    left: theme.spacing.xs + 24,
    top: 18,
    bottom: 40,
    width: 2,
    borderRadius: 999,
    backgroundColor: "rgba(76,94,132,0.28)",
  },
  claudeSpineDone: {
    position: "absolute",
    left: theme.spacing.xs + 24,
    top: 18,
    width: 2,
    height: 210,
    borderRadius: 999,
    backgroundColor: "rgba(192,132,252,0.55)",
  },
  claudeNodeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    zIndex: 2,
  },
  claudeNodeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,16,33,0.9)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  claudeNodeCircleDone: {
    backgroundColor: "rgba(192,132,252,0.14)",
    borderColor: "rgba(192,132,252,0.25)",
  },
  claudeNodeCircleReward: {
    backgroundColor: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.22)",
  },
  claudeNodeCircleGame: {
    backgroundColor: "rgba(129,140,248,0.12)",
    borderColor: "rgba(129,140,248,0.22)",
  },
  claudeNodeCircleMilestone: {
    backgroundColor: "rgba(251,191,36,0.08)",
    borderColor: "rgba(251,191,36,0.16)",
  },
  claudeNodeCircleLocked: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  claudeDoneBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#34d399",
    borderWidth: 2,
    borderColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  claudeNodeBody: {
    flex: 1,
    paddingTop: 4,
    gap: 2,
  },
  claudeNodeTitle: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  claudeNodeTitleLocked: {
    color: "rgba(111,125,152,0.72)",
  },
  claudeNodeDescription: {
    ...theme.typography.caption,
    color: theme.colors.sub,
  },
  claudeNodeDescriptionLocked: {
    color: "rgba(111,125,152,0.42)",
  },
  claudeNodeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  claudeXpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(192,132,252,0.08)",
  },
  claudeXpBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.accent,
  },
  claudeDoneText: {
    ...theme.typography.caption,
    color: "#34d399",
  },
  claudeHeroCard: {
    padding: 0,
    overflow: "hidden",
  },
  claudeHeroInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: "rgba(14,18,30,0.86)",
    borderWidth: 1,
    borderColor: "rgba(192,132,252,0.14)",
  },
  claudeCurrentCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  claudeHeroContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  claudeHeroTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  claudeHeroBody: {
    ...theme.typography.caption,
    color: theme.colors.sub,
    lineHeight: 18,
  },
  claudeHeroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  claudeHeroMetaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(192,132,252,0.1)",
  },
  claudeHeroMetaPillMuted: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  claudeHeroMetaPillWarm: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(251,146,60,0.12)",
  },
  claudeHeroMetaText: {
    ...theme.typography.caption,
    color: theme.colors.accent,
  },
  claudeHeroMetaTextMuted: {
    ...theme.typography.caption,
    color: theme.colors.sub,
  },
  claudeHeroMetaTextWarm: {
    ...theme.typography.caption,
    color: "#fb923c",
  },
  claudeHeroButton: {
    marginTop: theme.spacing.sm,
  },
  claudeDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  claudeDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(76,94,132,0.28)",
  },
  claudeDividerLabel: {
    ...theme.typography.caption,
    color: "rgba(111,125,152,0.72)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  claudeNextChapterHint: {
    paddingHorizontal: theme.spacing.xs,
    gap: 4,
    marginTop: theme.spacing.md,
  },
  claudeNextChapterTitle: {
    ...theme.typography.h3,
    color: "rgba(111,125,152,0.72)",
  },
  claudeNextChapterBody: {
    ...theme.typography.caption,
    color: "rgba(111,125,152,0.52)",
  },
  finalHeroCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  finalHeroTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  finalHeroBody: {
    ...theme.typography.label,
    color: "rgba(216,228,245,0.74)",
  },
  finalStatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  finalStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(6,19,41,0.92)",
    borderWidth: 1,
    borderColor: "rgba(73,103,161,0.28)",
  },
  finalStatText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  finalPrimaryButton: {
    width: "100%",
  },
  finalPathCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  finalPathHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  finalPathHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  finalPathTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  finalPathStage: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    minHeight: 96,
    paddingTop: theme.spacing.xs,
  },
  finalPathLine: {
    position: "absolute",
    top: 28,
    left: 28,
    right: 28,
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(73,103,161,0.28)",
  },
  finalPathNodeWrap: {
    width: 72,
    alignItems: "center",
    gap: 8,
    zIndex: 2,
  },
  finalPathNode: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,19,41,0.96)",
    borderWidth: 1.5,
    borderColor: "rgba(73,103,161,0.38)",
  },
  finalPathNodeDone: {
    backgroundColor: "#b5ff64",
    borderColor: "#e7ffaf",
    shadowColor: "#b5ff64",
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  finalPathNodeCurrent: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: theme.colors.accent,
    borderColor: "#aef6ff",
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  finalPathNodeNext: {
    backgroundColor: "rgba(9,22,48,0.98)",
    borderColor: "rgba(87,123,192,0.38)",
  },
  finalPathNodeReward: {
    backgroundColor: "rgba(255,174,47,0.96)",
    borderColor: "#ffec9d",
  },
  finalPathNodeLabel: {
    ...theme.typography.caption,
    color: "rgba(216,228,245,0.72)",
    textAlign: "center",
  },
  finalPathNodeLabelCurrent: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  finalPathFocusCard: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(6,19,41,0.92)",
    borderWidth: 1,
    borderColor: "rgba(73,103,161,0.22)",
  },
  finalPathFocusKicker: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  finalPathFocusTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  finalPathFocusBody: {
    ...theme.typography.label,
    color: theme.colors.sub,
  },
  finalPathFocusMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  finalPathFocusMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  finalPathFocusMetaText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  finalOrbitCard: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    overflow: "hidden",
  },
  finalOrbitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  finalOrbitTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    maxWidth: 220,
  },
  finalProgressChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(6,19,41,0.92)",
    borderWidth: 1,
    borderColor: "rgba(73,103,161,0.28)",
  },
  finalProgressText: {
    ...theme.typography.caption,
    color: theme.colors.sub,
  },
  finalOrbitStage: {
    height: 268,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  finalOrbitHalo: {
    position: "absolute",
    width: 268,
    height: 268,
    borderRadius: 999,
    backgroundColor: "rgba(54,127,255,0.14)",
    transform: [{ scale: 1.08 }],
  },
  finalOrbitRingOuter: {
    position: "absolute",
    width: 252,
    height: 252,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(87,123,192,0.38)",
  },
  finalOrbitRingInner: {
    position: "absolute",
    width: 188,
    height: 188,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(168,255,96,0.18)",
  },
  finalNodeWrap: {
    position: "absolute",
    width: 64,
    alignItems: "center",
    gap: 6,
    zIndex: 3,
  },
  finalNode: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,17,38,0.96)",
    borderWidth: 2,
    borderColor: "rgba(65,89,136,0.55)",
  },
  finalNodeDone: {
    backgroundColor: "#b5ff64",
    borderColor: "#e7ffaf",
    shadowColor: "#b5ff64",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  finalNodeCurrent: {
    backgroundColor: "#7ce8ff",
    borderColor: "#d4fbff",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  finalNodeLocked: {
    backgroundColor: "rgba(5,17,38,0.96)",
    borderColor: "rgba(65,89,136,0.55)",
  },
  finalNodeReward: {
    backgroundColor: "rgba(255,174,47,0.96)",
    borderColor: "#ffec9d",
  },
  finalNodeLabel: {
    ...theme.typography.caption,
    color: "rgba(216,228,245,0.84)",
    textAlign: "center",
  },
  finalCoreOrb: {
    width: 152,
    height: 152,
    borderRadius: 76,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 6,
    shadowColor: "rgba(34,211,238,0.85)",
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 2,
  },
  finalCoreKicker: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.78)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  finalCoreTitle: {
    ...theme.typography.h2,
    color: "#fff",
    textAlign: "center",
  },
  finalCoreBody: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    maxWidth: 116,
  },
  trailShell: {
    position: "relative",
    paddingVertical: theme.spacing.md,
    minHeight: 520,
    justifyContent: "center",
  },
  trailSpine: {
    position: "absolute",
    top: 18,
    bottom: 18,
    alignSelf: "center",
    width: 3,
    borderRadius: 999,
    backgroundColor: "rgba(91,123,186,0.36)",
  },
  trailRow: {
    minHeight: 72,
    justifyContent: "center",
  },
  trailRowLeft: {
    alignItems: "flex-start",
    paddingLeft: 18,
  },
  trailRowRight: {
    alignItems: "flex-end",
    paddingRight: 18,
  },
  trailNodeWrap: {
    width: 126,
    alignItems: "center",
    gap: 10,
  },
  trailNode: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4,15,35,0.95)",
    borderWidth: 2,
    borderColor: "rgba(65,89,136,0.55)",
  },
  trailNodeDone: {
    backgroundColor: "#b5ff64",
    borderColor: "#e7ffaf",
  },
  trailNodeCurrent: {
    backgroundColor: theme.colors.primary,
    borderColor: "#94bfff",
    shadowColor: theme.colors.primaryLight,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  trailNodeLocked: {
    backgroundColor: "rgba(4,15,35,0.95)",
    borderColor: "rgba(65,89,136,0.55)",
  },
  trailNodeLabel: {
    ...theme.typography.label,
    color: theme.colors.text,
    textAlign: "center",
  },
  compareNotesCard: {
    gap: theme.spacing.sm,
  },
  compareNotesBody: {
    ...theme.typography.label,
    color: theme.colors.sub,
  },
});
