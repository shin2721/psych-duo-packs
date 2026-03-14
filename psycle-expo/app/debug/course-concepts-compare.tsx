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
import { Button, Card, Pill } from "../../components/ui";
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
  const radius = RING_SIZE / 2 - 36;

  return (
    <View style={styles.sectionGap}>
      <Card style={styles.ringCard}>
        <Text style={styles.sectionEyebrow}>Mental unit</Text>
        <Text style={styles.ringTitle}>Current chapter ring</Text>

        <View
          style={[
            styles.ringStage,
            {
              width: RING_SIZE,
              height: RING_SIZE,
            },
          ]}
        >
          <View style={styles.fireflyAuraOuter} />
          <View style={styles.fireflyAuraInner} />
          <View style={styles.fireflyCore}>
            <Ionicons name="leaf" size={28} color="#081119" />
          </View>

          {ringNodes.map((node) => {
            const radians = (node.angle * Math.PI) / 180;
            const x = center + radius * Math.cos(radians);
            const y = center + radius * Math.sin(radians);
            return <RingNodeChip key={node.id} node={node} x={x} y={y} />;
          })}
        </View>

        <View style={styles.currentStrip}>
          <View>
            <Text style={styles.currentStripEyebrow}>Current lesson</Text>
            <Text style={styles.currentStripTitle}>Lesson 3</Text>
            <Text style={styles.currentStripBody}>
              Turn one stuck thought into a workable reframe.
            </Text>
          </View>
          <View style={styles.currentMetaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color={theme.colors.accent} />
              <Text style={styles.metaChipText}>7 min</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="flash" size={14} color={theme.colors.accent} />
              <Text style={styles.metaChipText}>+38 XP</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="gift" size={14} color={theme.colors.warn} />
              <Text style={styles.metaChipText}>chest at L6</Text>
            </View>
          </View>
        </View>

        <Button label="Open lesson 3" size="lg" onPress={() => {}} />
      </Card>
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
  ringCard: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(73,103,161,0.36)",
    gap: theme.spacing.md,
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
  ringStage: {
    alignSelf: "center",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  fireflyAuraOuter: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "rgba(232,72,159,0.22)",
    shadowColor: "#e8489f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
  },
  fireflyAuraInner: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(232,72,159,0.78)",
  },
  fireflyCore: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    paddingVertical: theme.spacing.sm,
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
  currentMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(73,103,161,0.45)",
    backgroundColor: "rgba(8,18,38,0.72)",
  },
  metaChipText: {
    ...theme.typography.caption,
    color: theme.colors.text,
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
