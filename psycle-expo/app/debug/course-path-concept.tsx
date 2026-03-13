import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Pill, ProgressBar } from "../../components/ui";
import { StarBackground } from "../../components/StarBackground";
import { theme } from "../../lib/theme";

type OrbitNodeStatus = "done" | "locked" | "reward";

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
    shortLabel: "",
    icon: "sparkles",
    status: "done",
    angle: -128,
  },
  {
    id: "warm-up",
    label: "Warm-up",
    shortLabel: "",
    icon: "flash",
    status: "done",
    angle: -20,
  },
  {
    id: "mini-game",
    label: "Mini Game",
    shortLabel: "",
    icon: "game-controller",
    status: "locked",
    angle: 132,
  },
  {
    id: "reward",
    label: "Reward Chest",
    shortLabel: "",
    icon: "gift",
    status: "reward",
    angle: 220,
  },
];

const genres = ["Mental", "Money", "Work", "Health", "Social", "Study"];
const SCREEN_WIDTH = Dimensions.get("window").width;
const ORBIT_SIZE = Math.min(SCREEN_WIDTH - 44, 372);

function OrbitNodeChip({ node, x, y }: { node: OrbitNode; x: number; y: number }) {
  return (
    <View
      style={[
        styles.nodeWrap,
        {
          left: x - 37,
          top: y - 37,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${node.label}, ${node.status}`}
        style={[
          styles.node,
          node.status === "done" && styles.nodeDone,
          node.status === "locked" && styles.nodeLocked,
          node.status === "reward" && styles.nodeReward,
        ]}
      >
        {node.status === "done" ? (
          <Ionicons name={node.icon} size={20} color="#081119" />
        ) : (
          <>
            <Ionicons
              name={node.icon}
              size={20}
              color={node.status === "locked" ? theme.colors.sub : "#fff"}
            />
            {node.shortLabel ? (
              <Text
                style={[
                  styles.nodeLabel,
                  node.status === "locked" && styles.nodeLabelLocked,
                ]}
              >
                {node.shortLabel}
              </Text>
            ) : null}
          </>
        )}
      </Pressable>
      <Text style={styles.nodeCaption}>{node.label}</Text>
    </View>
  );
}

function OrbitHero() {
  const center = ORBIT_SIZE / 2;
  const radius = ORBIT_SIZE / 2 - 52;

  return (
    <View style={styles.heroSection}>
      <View style={styles.heroCopy}>
        <Text style={styles.eyebrow}>Tonight&apos;s loop</Text>
        <Text style={styles.heroTitle}>Anxiety Reframe Orbit</Text>
        <Text style={styles.heroBody}>
          One orbit to finish tonight: arrive, reframe, play, collect.
        </Text>
      </View>

      <View style={styles.orbitStage} testID="course-path-concept-orbit">
        <View style={styles.orbitMistLeft} />
        <View style={styles.orbitMistRight} />

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
            colors={["rgba(58,173,255,0.28)", "rgba(58,173,255,0)", "rgba(168,255,96,0.16)"]}
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
            <Text style={styles.coreBody}>
              Turn &quot;I am stuck&quot; into one workable thought.
            </Text>
            <View style={styles.coreReward}>
              <Ionicons name="flash" size={14} color="#081119" />
              <Text style={styles.coreRewardText}>+38 XP when you close the orbit</Text>
            </View>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaValue}>7 min</Text>
          <Text style={styles.metaLabel}>today&apos;s orbit</Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaValue}>1 lesson</Text>
          <Text style={styles.metaLabel}>plus one mini game</Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaValue}>1 chest</Text>
          <Text style={styles.metaLabel}>reward at the end</Text>
        </View>
      </View>

      <View style={styles.ctaStack}>
        <Button
          label="Enter today’s orbit"
          size="lg"
          onPress={() => {}}
          testID="course-path-concept-start"
        />
        <Button
          label="Switch genre"
          variant="secondary"
          size="lg"
          onPress={() => {}}
          testID="course-path-concept-switch"
        />
      </View>
    </View>
  );
}

export default function CoursePathConceptScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StarBackground combo={6} />

      <View style={styles.topGlow} pointerEvents="none" />
      <View style={styles.bottomGlow} pointerEvents="none" />

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
            <Text style={styles.screenTitle}>Circular daily orbit</Text>
          </View>
        </View>

        <View style={styles.genreRow}>
          {genres.map((genre, index) => (
            <Pill key={genre} label={genre} active={index === 0} onPress={() => {}} />
          ))}
        </View>

        <OrbitHero />

        <View style={styles.weeklyShell}>
          <View style={styles.weeklyHeader}>
            <View>
              <Text style={styles.weeklyEyebrow}>Weekly challenge</Text>
              <Text style={styles.weeklyTitle}>Three focused sessions this week</Text>
            </View>
            <Text style={styles.weeklyCount}>3/5</Text>
          </View>
          <ProgressBar value={3} max={5} style={styles.weeklyBar} />
          <View style={styles.weeklyTagRow}>
            <View style={styles.weeklyTag}>
              <Ionicons name="flash" size={14} color={theme.colors.accent} />
              <Text style={styles.weeklyTagText}>+120 XP</Text>
            </View>
            <View style={styles.weeklyTag}>
              <Ionicons name="gift" size={14} color={theme.colors.warn} />
              <Text style={styles.weeklyTagText}>gold chest</Text>
            </View>
          </View>
        </View>
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
    left: SCREEN_WIDTH * 0.44,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(51,220,255,0.18)",
  },
  bottomGlow: {
    position: "absolute",
    bottom: 160,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(168,255,96,0.09)",
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
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
    backgroundColor: "rgba(7,16,33,0.78)",
    borderWidth: 1,
    borderColor: "rgba(73,103,161,0.5)",
  },
  topTextWrap: {
    flex: 1,
  },
  screenEyebrow: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  screenTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  genreRow: {
    flexDirection: "row",
    marginRight: -theme.spacing.sm,
  },
  heroSection: {
    borderRadius: 34,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    overflow: "hidden",
    backgroundColor: "rgba(4,14,33,0.84)",
    borderWidth: 1,
    borderColor: "rgba(65,104,162,0.42)",
    gap: theme.spacing.md,
  },
  heroCopy: {
    gap: 4,
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  heroTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  heroBody: {
    ...theme.typography.label,
    color: "rgba(216,228,245,0.74)",
  },
  orbitStage: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: ORBIT_SIZE + 14,
  },
  orbitMistLeft: {
    position: "absolute",
    left: -100,
    top: ORBIT_SIZE * 0.38,
    width: 180,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(168,255,96,0.08)",
  },
  orbitMistRight: {
    position: "absolute",
    right: -80,
    top: ORBIT_SIZE * 0.2,
    width: 200,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(51,220,255,0.11)",
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
    inset: 8,
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
  nodeWrap: {
    position: "absolute",
    width: 74,
    alignItems: "center",
    gap: 6,
    zIndex: 3,
  },
  node: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9,22,48,0.92)",
    borderWidth: 2,
    borderColor: "rgba(74,108,166,0.72)",
    gap: 2,
  },
  nodeDone: {
    backgroundColor: "#b5ff64",
    borderColor: "#e7ffaf",
    shadowColor: "#b5ff64",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  nodeLocked: {
    backgroundColor: "rgba(4,15,35,0.95)",
    borderColor: "rgba(65,89,136,0.55)",
  },
  nodeReward: {
    backgroundColor: "rgba(255,174,47,0.94)",
    borderColor: "#ffec9d",
    shadowColor: "#ffcc69",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
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
    color: "rgba(216,228,245,0.82)",
    textAlign: "center",
    maxWidth: 86,
  },
  coreOrb: {
    width: 196,
    height: 196,
    borderRadius: 98,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    shadowColor: "rgba(51,220,255,0.9)",
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    zIndex: 2,
  },
  coreKicker: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.82)",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  coreTitle: {
    ...theme.typography.h2,
    color: "#fff",
    textAlign: "center",
    marginTop: 3,
  },
  coreBody: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.92)",
    marginTop: 6,
    textAlign: "center",
    maxWidth: 150,
  },
  coreReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  coreRewardText: {
    ...theme.typography.caption,
    color: "#081119",
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  metaChip: {
    flex: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    backgroundColor: "rgba(8,19,42,0.86)",
    borderWidth: 1,
    borderColor: "rgba(74,108,166,0.46)",
  },
  metaValue: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  metaLabel: {
    ...theme.typography.caption,
    color: "rgba(216,228,245,0.68)",
    marginTop: 2,
  },
  ctaStack: {
    gap: theme.spacing.sm,
  },
  weeklyShell: {
    borderRadius: 26,
    padding: theme.spacing.lg,
    backgroundColor: "rgba(4,14,33,0.82)",
    borderWidth: 1,
    borderColor: "rgba(65,104,162,0.42)",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  weeklyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    alignItems: "flex-start",
  },
  weeklyEyebrow: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  weeklyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: 2,
  },
  weeklyCount: {
    ...theme.typography.h2,
    color: theme.colors.accent,
  },
  weeklyBar: {
    marginTop: theme.spacing.xs,
  },
  weeklyTagRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
  },
  weeklyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(8,19,42,0.86)",
    borderWidth: 1,
    borderColor: "rgba(74,108,166,0.46)",
  },
  weeklyTagText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
});
