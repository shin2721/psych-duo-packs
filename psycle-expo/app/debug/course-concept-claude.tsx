import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { CourseWorldHero } from "../../components/CourseWorldHero";
import type { CourseWorldViewModel, CourseWorldNode } from "../../lib/courseWorld";
import { COURSE_THEME_COLORS } from "../../lib/courseWorld";

const UNITS = [
  { id: "mental", label: "メンタル", icon: "sparkles", color: "#ec4899" },
  { id: "money", label: "マネー", icon: "cash", color: "#eab308" },
  { id: "work", label: "仕事", icon: "briefcase", color: "#3b82f6" },
  { id: "health", label: "健康", icon: "heart", color: "#ef4444" },
  { id: "social", label: "社会", icon: "people", color: "#f97316" },
  { id: "study", label: "学習", icon: "school", color: "#22c55e" },
];

const nodeDefs: { id: string; icon: string; label: string; title: string; level: number }[] = [
  { id: "L1", icon: "chatbubble-ellipses", label: "L1", title: "気づく", level: 1 },
  { id: "L2", icon: "bulb", label: "L2", title: "理解する", level: 2 },
  { id: "L3", icon: "sparkles", label: "L3", title: "感じる", level: 3 },
  { id: "L4", icon: "search", label: "L4", title: "証拠を並べる", level: 4 },
  { id: "L5", icon: "footsteps", label: "L5", title: "次の行動を決める", level: 5 },
  { id: "L6", icon: "trophy", label: "L6", title: "仕上げ", level: 6 },
];

function buildMockModel(activeIndex: number, unitId: string): CourseWorldViewModel {
  const current = nodeDefs[activeIndex];
  const unit = UNITS.find((u) => u.id === unitId) ?? UNITS[0];

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
      title: current.title,
    },
    genreId: unitId,
    primaryAction: {
      label: "レッスンを開く",
      mode: "lesson",
      targetLessonFile: `${unitId}_l0${current.level}`,
      targetNodeId: current.id,
    },
    progressLabel: `${activeIndex + 1} / ${nodeDefs.length}`,
    routeNodes,
    summaryLabel: unit.label,
    supportMoment: undefined,
    themeColor: unit.color,
    unitLabel: unit.label,
  };
}

export default function CourseWorldHeroDebugScreen() {
  const [activeIdx, setActiveIdx] = useState(1);
  const [unitId, setUnitId] = useState("mental");
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const model = useMemo(() => buildMockModel(activeIdx, unitId), [activeIdx, unitId]);

  const handleNodePress = (nodeId: string) => {
    const idx = nodeDefs.findIndex((n) => n.id === nodeId);
    if (idx >= 0) setActiveIdx(idx);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CourseWorldHero
        model={model}
        nextLessonId="L2"
        onNodePress={handleNodePress}
        onPrimaryPress={() => {}}
        onUnitPress={() => setShowUnitPicker(true)}
        showMeta={false}
        showPrimaryAction={false}
        heroOffsetY={42}
        testID="course-world-hero-debug"
      />

      {/* Unit picker modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showUnitPicker}
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowUnitPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>ユニットを選ぶ</Text>
            {UNITS.map((unit) => (
              <Pressable
                key={unit.id}
                style={[styles.unitRow, unitId === unit.id && styles.unitRowActive]}
                onPress={() => { setUnitId(unit.id); setActiveIdx(0); setShowUnitPicker(false); }}
              >
                <View style={[styles.unitIcon, { backgroundColor: unit.color + "20" }]}>
                  <Ionicons color={unit.color} name={unit.icon as keyof typeof Ionicons.glyphMap} size={22} />
                </View>
                <Text style={[styles.unitLabel, { color: unitId === unit.id ? unit.color : "rgba(255,255,255,0.8)" }]}>
                  {unit.label}
                </Text>
                {unitId === unit.id && (
                  <Ionicons color={unit.color} name="checkmark-circle" size={20} style={{ marginLeft: "auto" }} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0b111a",
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#141B2D",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  unitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  unitRowActive: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  unitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  unitLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
});
