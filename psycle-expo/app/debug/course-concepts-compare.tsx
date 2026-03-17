import React, { useState } from "react";
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
import { WebView } from "react-native-webview";
import { Button, Pill } from "../../components/ui";
import { StarBackground } from "../../components/StarBackground";
import { theme } from "../../lib/theme";
import i18n from "../../lib/i18n";
import {
  claudePreviewCommit,
  claudePreviewHtml,
  claudePreviewSource,
} from "./generated/claude-preview";

type CompareView = "psycle" | "claude";
type RingNodeState = "done" | "current" | "locked";

type RingNode = {
  id: string;
  label: string;
  angle: number;
  state: RingNodeState;
  badge?: "reward";
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const RING_SIZE = Math.min(SCREEN_WIDTH - 48, 316);

const ringNodes: RingNode[] = [
  { id: "l1", label: "L1", angle: -120, state: "done" },
  { id: "l2", label: "L2", angle: -50, state: "done" },
  { id: "l3", label: "L3", angle: 10, state: "current" },
  { id: "l4", label: "L4", angle: 70, state: "locked" },
  { id: "l5", label: "L5", angle: 130, state: "locked" },
  { id: "l6", label: "L6", angle: 200, state: "locked", badge: "reward" },
];

function Header() {
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
        <Text style={styles.headerSubtitle}>Compare in simulator</Text>
        <Text style={styles.headerTitle}>Course concepts</Text>
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
      <Pill
        label="Psycle"
        active={view === "psycle"}
        onPress={() => onChange("psycle")}
      />
      <Pill
        label="Claude"
        active={view === "claude"}
        onPress={() => onChange("claude")}
      />
    </View>
  );
}

function RingNodeChip({
  node,
  x,
  y,
}: {
  node: RingNode;
  x: number;
  y: number;
}) {
  return (
    <View
      style={[
        styles.ringNodeWrap,
        {
          left: x - 30,
          top: y - 30,
        },
      ]}
    >
      <View
        style={[
          styles.ringNode,
          node.state === "done" && styles.ringNodeDone,
          node.state === "current" && styles.ringNodeCurrent,
          node.state === "locked" && styles.ringNodeLocked,
        ]}
      >
        {node.state === "current" ? (
          <Ionicons name="leaf" size={16} color="#081119" />
        ) : (
          <Text
            style={[
              styles.ringNodeLabel,
              node.state === "locked" && styles.ringNodeLabelLocked,
            ]}
          >
            {node.label}
          </Text>
        )}
        {node.state === "done" ? (
          <View style={styles.ringDoneBadge}>
            <Ionicons name="checkmark" size={11} color="#081119" />
          </View>
        ) : null}
        {node.badge === "reward" ? (
          <View style={styles.ringRewardBadge}>
            <Ionicons name="gift" size={10} color="#fff" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PsycleConcept() {
  const center = RING_SIZE / 2;
  const radius = RING_SIZE / 2 - 44;

  return (
    <View style={styles.sectionGap}>
      <View style={styles.copyBlock}>
        <Text style={styles.sectionEyebrow}>Mental unit</Text>
        <Text style={styles.ringTitle}>Anxiety reframe</Text>
        <Text style={styles.psycleIntro}>
          One quiet ring. Follow the next light.
        </Text>
      </View>

      <View style={styles.psycleStage}>
        <Text style={styles.ringProgressText}>2 of 6 complete</Text>
        <View
          style={[
            styles.ringStage,
            {
              width: RING_SIZE,
              height: RING_SIZE,
            },
          ]}
        >
          <View style={styles.ringHalo} />
          <View style={styles.ringTrackOuter} />
          <View style={styles.ringTrackInner} />
          <View style={styles.fireflyAuraOuter} />
          <View style={styles.fireflyAuraInner} />
          <View style={styles.fireflyCore}>
            <Ionicons name="leaf" size={30} color="#081119" />
          </View>

          {ringNodes.map((node) => {
            const radians = (node.angle * Math.PI) / 180;
            const x = center + radius * Math.cos(radians);
            const y = center + radius * Math.sin(radians);
            return <RingNodeChip key={node.id} node={node} x={x} y={y} />;
          })}
        </View>
      </View>

      <View style={styles.currentLessonBlock}>
        <Text style={styles.currentStripEyebrow}>Current lesson</Text>
        <Text style={styles.currentStripTitle}>Lesson 3</Text>
        <Text style={styles.currentStripBody}>
          Turn one stuck thought into a workable reframe.
        </Text>
        <View style={styles.currentMetaRow}>
          <Text style={styles.currentMetaPill}>7 min</Text>
          <Text style={styles.currentMetaPill}>+38 XP</Text>
          <Text style={styles.currentMetaPill}>chest at L6</Text>
        </View>
        <Button label="Open lesson 3" size="lg" onPress={() => {}} />
      </View>
    </View>
  );
}

function ClaudeConcept() {
  return (
    <View style={styles.sectionGap}>
      <View style={styles.copyBlock}>
        <Text style={styles.sectionEyebrow}>Claude branch preview</Text>
        <Text style={styles.ringTitle}>Latest synced mock</Text>
        <Text style={styles.ringBody}>
          HTML snapshot synced from the Claude branch. Update it with
          <Text style={styles.inlineCode}> npm run claude:sync-preview</Text>.
        </Text>
      </View>

      <View style={styles.claudeMeta}>
        <Text style={styles.claudeMetaText}>Commit {claudePreviewCommit}</Text>
        <Text style={styles.claudeMetaSubtext}>{claudePreviewSource}</Text>
      </View>

      <View style={styles.webviewShell}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: claudePreviewHtml, baseUrl: "https://localhost" }}
          scrollEnabled={false}
          automaticallyAdjustContentInsets={false}
          style={styles.webview}
        />
      </View>
    </View>
  );
}

export default function CourseConceptsCompareScreen() {
  const [view, setView] = useState<CompareView>("psycle");

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
        <Header />
        <CompareTabs view={view} onChange={setView} />
        {view === "psycle" ? <PsycleConcept /> : <ClaudeConcept />}
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
    top: -120,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(34,211,238,0.18)",
  },
  bottomGlow: {
    position: "absolute",
    left: -80,
    bottom: 120,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(168,255,96,0.10)",
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
    letterSpacing: 1.2,
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
  psycleStage: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  sectionEyebrow: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  ringTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  ringBody: {
    ...theme.typography.body,
    color: "rgba(216,228,245,0.74)",
  },
  psycleIntro: {
    ...theme.typography.body,
    color: "rgba(216,228,245,0.72)",
  },
  ringStage: {
    alignSelf: "center",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  ringProgressText: {
    ...theme.typography.caption,
    color: "rgba(216,228,245,0.64)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  ringHalo: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: "rgba(78,137,255,0.08)",
  },
  ringTrackOuter: {
    position: "absolute",
    width: RING_SIZE - 32,
    height: RING_SIZE - 32,
    borderRadius: (RING_SIZE - 32) / 2,
    borderWidth: 3,
    borderColor: "rgba(111,146,214,0.55)",
  },
  ringTrackInner: {
    position: "absolute",
    width: RING_SIZE - 84,
    height: RING_SIZE - 84,
    borderRadius: (RING_SIZE - 84) / 2,
    borderWidth: 2,
    borderColor: "rgba(127,201,99,0.30)",
  },
  fireflyAuraOuter: {
    position: "absolute",
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: "rgba(232,72,159,0.18)",
    shadowColor: "#e8489f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  fireflyAuraInner: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(232,72,159,0.78)",
  },
  fireflyCore: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  ringNodeWrap: {
    position: "absolute",
    width: 60,
    alignItems: "center",
  },
  ringNode: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    position: "relative",
  },
  ringNodeDone: {
    backgroundColor: "#a8ff60",
    borderColor: "rgba(245,255,229,0.8)",
  },
  ringNodeCurrent: {
    backgroundColor: theme.colors.accent,
    borderColor: "rgba(217,252,255,0.9)",
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
  },
  ringNodeLocked: {
    backgroundColor: "rgba(6,16,34,0.92)",
    borderColor: "rgba(66,90,136,0.65)",
  },
  ringNodeLabel: {
    ...theme.typography.label,
    color: "#081119",
  },
  ringNodeLabelLocked: {
    color: theme.colors.sub,
  },
  ringDoneBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#d9ffe8",
    alignItems: "center",
    justifyContent: "center",
  },
  ringRewardBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.warn,
    alignItems: "center",
    justifyContent: "center",
  },
  currentStrip: {
    gap: theme.spacing.sm,
  },
  currentStripEyebrow: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  currentStripTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  currentStripBody: {
    ...theme.typography.body,
    color: "rgba(216,228,245,0.74)",
  },
  currentMetaInline: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  currentLessonBlock: {
    gap: theme.spacing.sm,
  },
  currentMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  currentMetaPill: {
    ...theme.typography.caption,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(73,103,161,0.36)",
    backgroundColor: "rgba(8,18,38,0.36)",
  },
  copyBlock: {
    gap: theme.spacing.xs,
  },
  inlineCode: {
    color: theme.colors.text,
    fontFamily: "Menlo",
  },
  claudeMeta: {
    gap: 2,
  },
  claudeMetaText: {
    ...theme.typography.label,
    color: theme.colors.text,
  },
  claudeMetaSubtext: {
    ...theme.typography.caption,
    color: theme.colors.sub,
  },
  webviewShell: {
    height: 900,
    overflow: "hidden",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(73,103,161,0.36)",
    backgroundColor: theme.colors.card,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
