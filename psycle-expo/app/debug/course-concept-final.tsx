import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  CourseHeroFinal,
  type CourseHeroFinalNode,
} from "../../components/provisional/CourseHeroFinal";
import { theme } from "../../lib/theme";

type DebugNodeDef = {
  body: string;
  icon: string;
  id: string;
  label: string;
  levelNumber: number;
  meta: string;
  nodeType: "lesson" | "review_blackhole";
  title: string;
};

const provisionalNodeDefs: DebugNodeDef[] = [
  {
    body: "体の警報を下げる最初の 1 レッスンを静かに始める。",
    icon: "leaf",
    id: "l1",
    label: "L1",
    levelNumber: 1,
    meta: "5問 • +24 XP",
    nodeType: "lesson",
    title: "呼吸法の基礎",
  },
  {
    body: "不安のサインを見つけて、反応と事実を分けてみる。",
    icon: "flower",
    id: "l2",
    label: "L2",
    levelNumber: 2,
    meta: "6問 • +28 XP",
    nodeType: "lesson",
    title: "体のサインを読む",
  },
  {
    body: "ひとつの思考の詰まりを、動ける言い換えに変える。",
    icon: "sparkles",
    id: "l3",
    label: "L3",
    levelNumber: 3,
    meta: "7問 • +38 XP",
    nodeType: "lesson",
    title: "不安のリフレーム",
  },
  {
    body: "頭の中の予想と実際の証拠を同じ面に置いて比べる。",
    icon: "star",
    id: "l4",
    label: "L4",
    levelNumber: 4,
    meta: "7問 • +40 XP",
    nodeType: "lesson",
    title: "証拠を並べる",
  },
  {
    body: "完璧な正解よりも、すぐ始められる一歩を先に置く。",
    icon: "heart-circle",
    id: "l5",
    label: "L5",
    levelNumber: 5,
    meta: "8問 • +42 XP",
    nodeType: "lesson",
    title: "次の行動を縮める",
  },
  {
    body: "詰まりやすい問いだけを集めて、軌道を閉じ直す。",
    icon: "planet",
    id: "bh1",
    label: "BH",
    levelNumber: 6,
    meta: "5問 • +50 XP",
    nodeType: "review_blackhole",
    title: "ブラックホール復習",
  },
  {
    body: "高い基準を持ちながら、行動を止めない余白を作る。",
    icon: "pulse",
    id: "l6",
    label: "L6",
    levelNumber: 6,
    meta: "8問 • +44 XP",
    nodeType: "lesson",
    title: "完璧主義を緩める",
  },
];

function buildPreviewNodes(activeIndex: number): CourseHeroFinalNode[] {
  const lessonDefs = provisionalNodeDefs.filter((node) => node.nodeType === "lesson").slice(0, 5);
  const reviewDef = provisionalNodeDefs.find((node) => node.nodeType === "review_blackhole");

  const lessonNodes = lessonDefs.map((node, index) => ({
    id: node.id,
    icon: node.icon,
    isLocked: index > activeIndex,
    label: node.label,
    levelNumber: node.levelNumber,
    status:
      index < activeIndex
        ? "done"
        : index === activeIndex
          ? "current"
          : "locked",
  })) satisfies CourseHeroFinalNode[];

  if (!reviewDef) return lessonNodes;

  return [
    ...lessonNodes,
    {
      id: reviewDef.id,
      icon: reviewDef.icon,
      isLocked: activeIndex < lessonDefs.length - 1,
      label: reviewDef.label,
      levelNumber: reviewDef.levelNumber,
      status: "locked",
    },
  ];
}

export default function CourseConceptFinalScreen() {
  const [activeIndex, setActiveIndex] = useState(2);
  const clampedIndex = Math.max(0, Math.min(activeIndex, 4));
  const currentDef = provisionalNodeDefs[clampedIndex] ?? provisionalNodeDefs[0];
  const previewNodes = useMemo(() => buildPreviewNodes(clampedIndex), [clampedIndex]);

  const handleNodePress = (nodeId: string) => {
    const nextIndex = provisionalNodeDefs.findIndex((node) => node.id === nodeId);
    if (nextIndex >= 0 && nextIndex <= 4) {
      setActiveIndex(nextIndex);
    }
  };

  const handlePrimaryPress = () => {
    setActiveIndex((currentIndex) =>
      currentIndex >= 4 ? 0 : currentIndex + 1
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="course-concept-final-screen"
      >
        <View style={styles.heroShell}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="戻る"
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.backButton}
              testID="course-concept-final-back"
            >
              <Ionicons color={theme.colors.text} name="arrow-back" size={20} />
            </Pressable>
          </View>

          <View style={styles.heroPreview}>
            <CourseHeroFinal
              body={currentDef.body}
              ctaAccessibilityLabel={`${currentDef.title} を開く`}
              ctaLabel={`レッスン ${currentDef.levelNumber} を開く`}
              genreIcon={currentDef.icon}
              meta={currentDef.meta}
              nodes={previewNodes}
              onNodePress={handleNodePress}
              onPrimaryPress={handlePrimaryPress}
              progressLabel={`${currentDef.levelNumber} / 6`}
              testID="course-concept-final-hero"
              themeColor="#8ee8ff"
              title={currentDef.title}
              unitLabel="メンタル"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#101723",
    borderColor: "rgba(132, 146, 168, 0.18)",
    borderRadius: 24,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  container: {
    backgroundColor: "#04070d",
    flex: 1,
  },
  heroShell: {
    gap: theme.spacing.sm,
  },
  heroPreview: {
    marginTop: 4,
  },
  scrollContent: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.sm,
  },
  topBar: {
    alignItems: "flex-start",
    paddingHorizontal: theme.spacing.lg,
  },
});
