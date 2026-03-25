import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CourseWorldHero } from "../../components/CourseWorldHero";
import type { CourseWorldViewModel, CourseWorldNode } from "../../lib/courseWorld";

const THEME_COLOR = "#ec4899";
const SYN_COLOR = "#A78BFA";

const nodeDefs: { id: string; icon: string; label: string; level: number }[] = [
  { id: "L1", icon: "chatbubble-ellipses", label: "L1", level: 1 },
  { id: "L2", icon: "bulb", label: "L2", level: 2 },
  { id: "L3", icon: "sparkles", label: "L3", level: 3 },
  { id: "L4", icon: "search", label: "L4", level: 4 },
  { id: "L5", icon: "footsteps", label: "L5", level: 5 },
  { id: "L6", icon: "trophy", label: "L6", level: 6 },
];

function buildMockModel(activeIndex: number): CourseWorldViewModel {
  const current = nodeDefs[activeIndex];

  const lessonNodes: CourseWorldNode[] = nodeDefs.map((n, i) => ({
    accessibilityLabel: n.label,
    icon: n.icon,
    id: n.id,
    isInteractive: i <= activeIndex,
    label: n.label,
    levelNumber: n.level,
    nodeType: "lesson" as const,
    status: i < activeIndex ? "done" as const : i === activeIndex ? "current" as const : "locked" as const,
  }));

  const routeNodes = lessonNodes.filter((n) => n.id !== current.id);

  return {
    currentLesson: {
      ...lessonNodes[activeIndex],
      body: "今の学習ルートの続きからそのまま始めましょう。",
      meta: `レッスン ${current.level} / ${nodeDefs.length}`,
      title: current.label,
    },
    genreId: "mental",
    primaryAction: {
      label: "レッスンを開く",
      mode: "lesson",
      targetLessonFile: `mental_l0${current.level}`,
      targetNodeId: current.id,
    },
    progressLabel: `${activeIndex + 1} / ${nodeDefs.length}`,
    routeNodes,
    summaryLabel: "認知の再構成",
    supportMoment: undefined,
    themeColor: THEME_COLOR,
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
    <View style={styles.container}>
      <CourseWorldHero
        model={model}
        onNodePress={handleNodePress}
        onPrimaryPress={() => {}}
        testID="course-world-hero-debug"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0b111a",
    flex: 1,
  },
});
