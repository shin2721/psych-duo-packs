import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CourseWorldHero } from "../../components/CourseWorldHero";
import type {
  CourseWorldNode,
  CourseWorldViewModel,
} from "../../lib/courseWorld";

const nodeDefs = [
  { id: "l1", label: "L1", level: 1, icon: "leaf", title: "呼吸法の基礎", body: "体の警報を下げる最初の1レッスン。", meta: "5問 • +24 XP" },
  { id: "l2", label: "L2", level: 2, icon: "flower", title: "体のサインを読む", body: "不安のサインを見つけて反応と事実を分ける。", meta: "6問 • +28 XP" },
  { id: "l3", label: "L3", level: 3, icon: "sparkles", title: "不安のリフレーム", body: "思考の詰まりを動ける言い換えに変える。", meta: "7問 • +38 XP" },
  { id: "l4", label: "L4", level: 4, icon: "star", title: "証拠を並べる", body: "頭の中の予想と実際の証拠を比べる。", meta: "7問 • +40 XP" },
  { id: "l5", label: "L5", level: 5, icon: "heart-circle", title: "次の行動を縮める", body: "すぐ始められる一歩を先に置く。", meta: "8問 • +42 XP" },
  { id: "l6", label: "L6", level: 6, icon: "pulse", title: "完璧主義を緩める", body: "高い基準を持ちながら行動を止めない。", meta: "8問 • +44 XP" },
];

function buildMockModel(activeIdx: number): CourseWorldViewModel {
  const current = nodeDefs[activeIdx];

  const stagedNodes: CourseWorldNode[] = nodeDefs.map((n, i) => ({
    accessibilityLabel: n.title,
    icon: n.icon,
    id: n.id,
    isInteractive: true,
    isLocked: i > activeIdx,
    label: n.label,
    levelNumber: n.level,
    nodeType: "lesson" as const,
    status: i < activeIdx ? ("done" as const) : i === activeIdx ? ("current" as const) : ("locked" as const),
  }));

  const lessonNodes = stagedNodes.filter((n) => n.nodeType === "lesson");

  return {
    currentLesson: {
      ...stagedNodes[activeIdx],
      body: current.body,
      meta: current.meta,
      title: current.title,
    },
    genreId: "mental",
    primaryAction: {
      label: `レッスン ${current.level} を開く`,
      mode: "lesson",
      targetNodeId: current.id,
    },
    progressLabel: `${activeIdx + 1} / ${nodeDefs.length}`,
    routeNodes: lessonNodes.filter((n) => n.id !== current.id),
    summaryLabel: "メンタル",
    themeColor: "#ec4899",
    unitLabel: "メンタル",
  };
}

export default function CourseWorldHeroDebugScreen() {
  const [activeIdx, setActiveIdx] = useState(2);
  const model = useMemo(() => buildMockModel(activeIdx), [activeIdx]);

  const handleNodePress = (nodeId: string) => {
    const idx = nodeDefs.findIndex((n) => n.id === nodeId);
    if (idx >= 0) setActiveIdx(idx);
  };

  return (
    <SafeAreaView style={st.container} edges={["top"]}>
      <View style={st.hero}>
        <CourseWorldHero
          model={model}
          onNodePress={handleNodePress}
          onPrimaryPress={() => setActiveIdx((i) => (i + 1) % nodeDefs.length)}
          testID="course-world-hero-debug"
        />
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b111a" },
  hero: { flex: 1 },
});
