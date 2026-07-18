import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StarBackground } from "../../components/StarBackground";
import { useAuth } from "../../lib/AuthContext";
import { theme } from "../../lib/theme";
import { V2_OWNER_PILOT_ENABLED } from "../../lib/v2-pilot/featureFlag";
import {
  createInitialV2PilotSnapshot,
  loadV2PilotSnapshot,
  resetV2PilotSnapshot,
  saveV2PilotSnapshot,
} from "../../lib/v2-pilot/storage";
import type {
  V2PilotBoundaryHeadlineId,
  V2PilotDay1Step,
  V2PilotPredictionDirection,
  V2PilotQualityComparison,
  V2PilotSnapshot,
} from "../../types/v2Pilot";

const ACCENT = "#ec4899";
const ACCENT_SOFT = "rgba(236,72,153,0.14)";
const PURPLE = "#a78bfa";
type QuickScreen =
  | "quality_prediction"
  | "diversity_prediction"
  | "research"
  | "quality_update"
  | "boundary"
  | "recall"
  | "complete";

const QUICK_SCREENS: QuickScreen[] = [
  "quality_prediction",
  "diversity_prediction",
  "research",
  "quality_update",
  "boundary",
  "recall",
  "complete",
];

const RECALL_OPTIONS = [
  "特定の創造課題で、AI利用者の案の平均評価は上がった。人の性質や集団の多様性は、まだ分からない。",
  "AIを使うと、人そのものが創造的になり、あらゆる仕事の質が上がる。",
  "AI利用者の案は平均評価が下がり、AIを使わない集団ほど常に多様になる。",
] as const;

const CORRECT_RECALL = RECALL_OPTIONS[0];

const DIRECTION_LABELS: Record<V2PilotPredictionDirection, string> = {
  decrease: "下がる",
  same: "変わらない",
  increase: "上がる",
};

const DIVERSITY_LABELS: Record<V2PilotPredictionDirection, string> = {
  decrease: "狭くなる",
  same: "変わらない",
  increase: "広がる",
};

const COMPARISON_LABELS: Record<V2PilotQualityComparison, string> = {
  higher_than_expected: "予想より上だった",
  as_expected: "ほぼ予想通り",
  lower_than_expected: "予想より下だった",
};

type BoundaryDefinition = {
  id: V2PilotBoundaryHeadlineId;
  headline: string;
  options: string[];
  hint: string;
};

const BOUNDARY_DEFINITIONS: BoundaryDefinition[] = [
  {
    id: "headline_1",
    headline: "ChatGPTは、人を創造的な人間に変える",
    options: ["課題成績 → 人の性質", "比較対象が違う", "境界内"],
    hint: "研究が測ったのは、一時的な課題の案か、人そのものか。",
  },
  {
    id: "headline_2",
    headline: "AIはGoogleより、革命的な発明を生み出す",
    options: ["参加者の案 → AI自身の案", "incremental → radical", "境界内"],
    hint: "誰の案を評価し、どの種類の新しさで強かったか。",
  },
  {
    id: "headline_3",
    headline: "現在の生成AIは、あらゆる創造的な仕事を改善する",
    options: ["モデルの一般化", "課題の一般化", "モデルと課題の両方"],
    hint: "GPT-3.5と実験課題から、どこまで広げているか。",
  },
  {
    id: "headline_4",
    headline:
      "この実験の創造課題では、GPT-3.5利用者の案が、非使用・Web検索条件より平均的に高く評価された",
    options: ["境界内", "人の性質まで言っている", "現在の全モデルへ広げている"],
    hint: "比較対象・モデル・課題・測定結果が文の中に残っているか。",
  },
];

function hasPredictionInput(snapshot: V2PilotSnapshot): boolean {
  return Boolean(
    snapshot.qualityPrediction.direction && snapshot.diversityPrediction.direction
  );
}

function hasQualityUpdateInput(snapshot: V2PilotSnapshot): boolean {
  return Boolean(snapshot.qualityUpdate.comparison);
}

function hasBoundaryInput(snapshot: V2PilotSnapshot): boolean {
  return Boolean(snapshot.boundaryAnswers.headline_1?.boundaryTag);
}

function hasRecallInput(snapshot: V2PilotSnapshot): boolean {
  return snapshot.recall.answer.trim().length >= 4;
}

function getQuickScreen(snapshot: V2PilotSnapshot): QuickScreen {
  if (snapshot.currentStep !== "prediction") return snapshot.currentStep;
  return snapshot.qualityPrediction.direction
    ? "diversity_prediction"
    : "quality_prediction";
}

function ChoiceChips<T extends string>({
  labels,
  onChange,
  testIDPrefix,
  value,
}: {
  labels: Record<T, string>;
  onChange: (next: T) => void;
  testIDPrefix: string;
  value: T | null;
}) {
  return (
    <View style={styles.choiceRow}>
      {(Object.keys(labels) as T[]).map((item) => {
        const selected = value === item;
        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(item)}
            style={[styles.choiceChip, selected && styles.choiceChipSelected]}
            testID={`${testIDPrefix}-${item}`}
          >
            <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>
              {labels[item]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SurfaceCard({ children, tone = "default" }: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "purple";
}) {
  return (
    <View
      style={[
        styles.surfaceCard,
        tone === "accent" && styles.surfaceCardAccent,
        tone === "purple" && styles.surfaceCardPurple,
      ]}
    >
      {children}
    </View>
  );
}

function ScreenIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <View style={styles.screenIntro}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.screenBody}>{body}</Text>
    </View>
  );
}

function PredictionStep({
  quickScreen,
  setSnapshot,
  snapshot,
}: {
  quickScreen: "quality_prediction" | "diversity_prediction";
  setSnapshot: React.Dispatch<React.SetStateAction<V2PilotSnapshot>>;
  snapshot: V2PilotSnapshot;
}) {
  const isQuality = quickScreen === "quality_prediction";
  return (
    <View testID="v2-step-prediction">
      <ScreenIntro
        eyebrow={isQuality ? "まず直感で" : "もう1タップ"}
        title={isQuality ? "AIを使った案は、平均すると？" : "みんなの案の幅は、どうなる？"}
        body={
          isQuality
            ? "企画会議の最初の案出しだけをAIに手伝わせる。研究を見る前に、直感で選ぶ。"
            : "会議のみんながAIを使った時を想像する。品質とは別に、案の種類を予想する。"
        }
      />

      <SurfaceCard tone={isQuality ? "accent" : "purple"}>
        <Text style={[styles.quickQuestionNumber, !isQuality && { color: PURPLE }]}>
          {isQuality ? "QUESTION 1" : "QUESTION 2"}
        </Text>
        <Text style={styles.quickPrompt}>
          {isQuality ? "案の平均評価" : "参加者全体から出る案の幅"}
        </Text>
        <ChoiceChips
          labels={isQuality ? DIRECTION_LABELS : DIVERSITY_LABELS}
          onChange={(direction) =>
            setSnapshot((current) => ({
              ...current,
              ...(isQuality
                ? {
                    qualityPrediction: {
                      ...current.qualityPrediction,
                      direction,
                    },
                  }
                : {
                    diversityPrediction: {
                      ...current.diversityPrediction,
                      direction,
                    },
                  }),
            }))
          }
          testIDPrefix={isQuality ? "v2-quality-direction" : "v2-diversity-direction"}
          value={
            isQuality
              ? snapshot.qualityPrediction.direction
              : snapshot.diversityPrediction.direction
          }
        />
      </SurfaceCard>

      <Text style={styles.quickHint}>理由入力なし。正解探しではなく、今の直感を残す。</Text>
    </View>
  );
}

function ResearchStep() {
  return (
    <View testID="v2-step-research">
      <ScreenIntro
        eyebrow="研究結果"
        title="この5実験では、平均評価が上がった"
        body="GPT-3.5利用・Web検索・非利用を比べた。"
      />

      <SurfaceCard tone="accent">
        <View style={styles.quickResultRow}>
          <View style={styles.quickResultIcon}>
            <Ionicons name="arrow-up" color="#fff" size={24} />
          </View>
          <View style={styles.quickResultCopy}>
            <Text style={styles.resultLabel}>RESULT</Text>
            <Text style={styles.quickResultTitle}>特定課題の案の平均評価</Text>
          </View>
        </View>
        <Text style={styles.resultBody}>
          AIを使った参加者の案は、非利用・Web検索より平均的に高く評価された。
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <View style={styles.boundaryHeader}>
          <Ionicons name="contract-outline" color={PURPLE} size={18} />
          <Text style={[styles.cardKicker, { color: PURPLE }]}>ここから先は、まだ言えない</Text>
        </View>
        <Text style={styles.cardBodyLarge}>
          人そのものが創造的になった、すべてのAI・仕事で有効、案の幅も広がった——とは限らない。
        </Text>
        <Text style={styles.sourceCaption}>
          Lee & Chung (2024) · GPT-3.5 · 特定の創造課題
        </Text>
      </SurfaceCard>
    </View>
  );
}

function QualityUpdateStep({
  setSnapshot,
  snapshot,
}: {
  setSnapshot: React.Dispatch<React.SetStateAction<V2PilotSnapshot>>;
  snapshot: V2PilotSnapshot;
}) {
  const predictionDirection = snapshot.qualityPrediction.direction;
  return (
    <View testID="v2-step-quality-update">
      <ScreenIntro
        eyebrow="予想を更新"
        title="結果は、予想と比べて？"
        body="正解・不正解ではなく、研究を見た後のズレを1タップで残す。"
      />

      <View style={styles.predictionCompareRow}>
        <View style={styles.predictionCompareCell}>
          <Text style={styles.predictionCompareLabel}>あなたの予想</Text>
          <Text style={styles.predictionCompareValue}>
            {predictionDirection ? DIRECTION_LABELS[predictionDirection] : "—"}
          </Text>
        </View>
        <Ionicons name="arrow-forward" color="rgba(255,255,255,0.38)" size={22} />
        <View style={[styles.predictionCompareCell, styles.predictionCompareResult]}>
          <Text style={styles.predictionCompareLabel}>研究結果</Text>
          <Text style={styles.predictionCompareValue}>上がった</Text>
        </View>
      </View>

      <SurfaceCard tone="accent">
        <Text style={styles.quickPrompt}>自分の予想から見ると？</Text>
        <ChoiceChips
          labels={COMPARISON_LABELS}
          onChange={(comparison) =>
            setSnapshot((current) => ({
              ...current,
              qualityUpdate: { ...current.qualityUpdate, comparison },
            }))
          }
          testIDPrefix="v2-quality-comparison"
          value={snapshot.qualityUpdate.comparison}
        />
      </SurfaceCard>
    </View>
  );
}

function BoundaryStep({
  setSnapshot,
  snapshot,
}: {
  setSnapshot: React.Dispatch<React.SetStateAction<V2PilotSnapshot>>;
  snapshot: V2PilotSnapshot;
}) {
  const definition = BOUNDARY_DEFINITIONS[0];
  const selectedTag = snapshot.boundaryAnswers.headline_1?.boundaryTag ?? null;
  const isCorrect = selectedTag === definition.options[0];
  return (
    <View testID="v2-step-boundary">
      <ScreenIntro
        eyebrow="言いすぎを見抜く"
        title="どこで、研究を越えた？"
        body="結果を大きく言い換えると、別の話になる。飛躍した場所を1つ選ぶ。"
      />

      <SurfaceCard tone="purple">
        <Text style={styles.headlineText}>「{definition.headline}」</Text>
        <View style={styles.boundaryOptions}>
          {definition.options.map((option, index) => {
            const selected = selectedTag === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() =>
                  setSnapshot((current) => ({
                    ...current,
                    boundaryAnswers: {
                      ...current.boundaryAnswers,
                      headline_1: { boundaryTag: option, note: "" },
                    },
                  }))
                }
                style={[styles.boundaryOption, selected && styles.boundaryOptionSelected]}
                testID={`v2-boundary-headline_1-${index}`}
              >
                <Text
                  style={[
                    styles.boundaryOptionText,
                    selected && styles.boundaryOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SurfaceCard>

      {selectedTag ? (
        <View
          style={[styles.quickFeedback, isCorrect ? styles.quickFeedbackGood : null]}
          testID="v2-boundary-feedback"
        >
          <Ionicons
            name={isCorrect ? "checkmark-circle" : "eye"}
            color={isCorrect ? "#86efac" : PURPLE}
            size={21}
          />
          <Text style={styles.quickFeedbackText}>
            {isCorrect
              ? "そう。研究が測ったのは一時的な課題の案。人そのものの性質までは言えない。"
              : "ここでの主な飛躍は、課題の案の評価を、人そのものの性質へ広げたこと。"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function RecallStep({
  setSnapshot,
  snapshot,
}: {
  setSnapshot: React.Dispatch<React.SetStateAction<V2PilotSnapshot>>;
  snapshot: V2PilotSnapshot;
}) {
  const selectedAnswer = snapshot.recall.answer;
  const isCorrect = selectedAnswer === CORRECT_RECALL;
  return (
    <View testID="v2-step-recall">
      <ScreenIntro
        eyebrow="最後に1問"
        title="今日の結果に一番近いのは？"
        body="上がったものと、まだ分からないものをセットで選ぶ。"
      />

      <SurfaceCard tone="purple">
        {RECALL_OPTIONS.map((option, index) => {
          const selected = selectedAnswer === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() =>
                setSnapshot((current) => ({
                  ...current,
                  recall: { answer: option, confidence: null },
                }))
              }
              style={[styles.recallOption, selected && styles.recallOptionSelected]}
              testID={`v2-recall-option-${index}`}
            >
              <View style={[styles.recallOptionBadge, selected && styles.recallOptionBadgeSelected]}>
                <Text style={styles.recallOptionBadgeText}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <Text style={[styles.recallOptionText, selected && styles.recallOptionTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </SurfaceCard>

      {selectedAnswer ? (
        <View
          style={[styles.quickFeedback, isCorrect ? styles.quickFeedbackGood : null]}
          testID="v2-recall-feedback"
        >
          <Ionicons
            name={isCorrect ? "checkmark-circle" : "refresh-circle"}
            color={isCorrect ? "#86efac" : PURPLE}
            size={21}
          />
          <Text style={styles.quickFeedbackText}>
            {isCorrect
              ? "その区別。平均品質と、人や集団全体の話を混ぜない。"
              : "研究が示したのは、特定課題での案の平均評価。人の性質や集団の多様性までは未確認。"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CompleteStep({ snapshot }: { snapshot: V2PilotSnapshot }) {
  const qualityDirection = snapshot.qualityPrediction.direction;
  const diversityDirection = snapshot.diversityPrediction.direction;
  return (
    <View testID="v2-step-complete">
      <View style={styles.completeHero}>
        <View style={styles.completeIcon}>
          <Ionicons name="checkmark" color="#14050f" size={30} />
        </View>
        <Text style={styles.completeEyebrow}>DAY 1 COMPLETE</Text>
        <Text style={styles.completeTitle}>質と幅は、別メーター</Text>
        <Text style={styles.completeBody}>
          特定課題で案の平均評価が上がっても、人の性質や集団全体の多様性まで上がったとは限らない。
        </Text>
      </View>

      <SurfaceCard tone="accent">
        <Text style={styles.timelineLabel}>次にAIで案を出す時 · 30秒</Text>
        <Text style={styles.summaryHeadline}>生成前後を、2行だけ比べる</Text>
        <View style={styles.fieldTestRow}>
          <View style={styles.fieldTestPill}>
            <Text style={styles.fieldTestPillText}>質</Text>
          </View>
          <Text style={styles.fieldTestText}>良くしたかった点は、本当に良くなった？</Text>
        </View>
        <View style={styles.fieldTestRow}>
          <View style={[styles.fieldTestPill, styles.fieldTestPillPurple]}>
            <Text style={styles.fieldTestPillText}>幅</Text>
          </View>
          <Text style={styles.fieldTestText}>複数案が、同じ方向へ寄っていない？</Text>
        </View>
        <Text style={styles.summaryBody}>
          効果が実証済みの手順ではない。次の自分の判断材料にする観察。
        </Text>
      </SurfaceCard>

      <View style={styles.quickNextCard}>
        <Ionicons name="bookmark" color={PURPLE} size={23} />
        <View style={styles.quickNextCopy}>
          <Text style={styles.nextQuestionKicker}>明日の問い · 予想は保存済み</Text>
          <Text style={styles.quickNextTitle}>みんなの案は、似ていく？</Text>
        </View>
      </View>

      <View style={styles.savedPredictionRow}>
        <Text style={styles.savedPredictionLabel}>最初の予想</Text>
        <Text style={styles.savedPredictionValue}>
          質 {qualityDirection ? DIRECTION_LABELS[qualityDirection] : "—"} · 幅{" "}
          {diversityDirection ? DIVERSITY_LABELS[diversityDirection] : "—"}
        </Text>
      </View>
    </View>
  );
}

export default function V2DayOneScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const scrollRef = useRef<ScrollView>(null);
  const [snapshot, setSnapshot] = useState<V2PilotSnapshot>(() =>
    createInitialV2PilotSnapshot()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quickScreen = getQuickScreen(snapshot);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadV2PilotSnapshot(userId)
      .then((stored) => {
        if (!cancelled) setSnapshot(stored);
      })
      .catch(() => {
        if (!cancelled) setError("保存済みのDay 1を読み込めませんでした。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [quickScreen]);

  const stepIndex = Math.max(0, QUICK_SCREENS.indexOf(quickScreen));
  const progress = (stepIndex + 1) / QUICK_SCREENS.length;

  const canContinue = useMemo(() => {
    switch (quickScreen) {
      case "quality_prediction":
        return Boolean(snapshot.qualityPrediction.direction);
      case "diversity_prediction":
        return hasPredictionInput(snapshot);
      case "research":
        return true;
      case "quality_update":
        return hasQualityUpdateInput(snapshot);
      case "boundary":
        return hasBoundaryInput(snapshot);
      case "recall":
        return hasRecallInput(snapshot);
      case "complete":
        return true;
    }
  }, [quickScreen, snapshot]);

  if (!V2_OWNER_PILOT_ENABLED) {
    return <Redirect href="/(tabs)/course" />;
  }

  const commitStep = async (nextStep: V2PilotDay1Step) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveV2PilotSnapshot(userId, {
        ...snapshot,
        currentStep: nextStep,
      });
      setSnapshot(saved);
    } catch {
      setError("端末内へ保存できませんでした。もう一度試してください。");
    } finally {
      setSaving(false);
    }
  };

  const handlePrimary = () => {
    switch (quickScreen) {
      case "quality_prediction":
        void commitStep("prediction");
        return;
      case "diversity_prediction":
        void commitStep("research");
        return;
      case "research":
        void commitStep("quality_update");
        return;
      case "quality_update":
        void commitStep("boundary");
        return;
      case "boundary":
        void commitStep("recall");
        return;
      case "recall":
        void commitStep("complete");
        return;
      case "complete":
        router.replace("/(tabs)/course");
    }
  };

  const primaryLabel: Record<QuickScreen, string> = {
    quality_prediction: "次へ",
    diversity_prediction: "予想を保存",
    research: "自分の予想と比べる",
    quality_update: "次へ",
    boundary: "次へ",
    recall: "結果を見る",
    complete: "時計へ戻る",
  };

  const resetPilot = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await resetV2PilotSnapshot(userId);
      setSnapshot(createInitialV2PilotSnapshot());
    } catch {
      setError("リセットできませんでした。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen} testID="v2-day1-loading">
        <StarBackground />
        <ActivityIndicator color={ACCENT} size="large" />
        <Text style={styles.loadingText}>Day 1を端末から読み込み中</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="v2-day1-screen">
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <StarBackground />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoiding}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Day 1を閉じる"
            accessibilityRole="button"
            onPress={() => router.replace("/(tabs)/course")}
            style={styles.closeButton}
            testID="v2-day1-close"
          >
            <Ionicons name="close" color="rgba(255,255,255,0.82)" size={24} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerLabelRow}>
              <Text style={styles.headerLabel}>DAY 1 / 4</Text>
              <Text style={styles.headerStep}>{stepIndex + 1} / {QUICK_SCREENS.length}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          testID="v2-day1-scroll"
        >
          {quickScreen === "quality_prediction" || quickScreen === "diversity_prediction" ? (
            <PredictionStep
              quickScreen={quickScreen}
              setSnapshot={setSnapshot}
              snapshot={snapshot}
            />
          ) : null}
          {quickScreen === "research" ? <ResearchStep /> : null}
          {quickScreen === "quality_update" ? (
            <QualityUpdateStep setSnapshot={setSnapshot} snapshot={snapshot} />
          ) : null}
          {quickScreen === "boundary" ? (
            <BoundaryStep setSnapshot={setSnapshot} snapshot={snapshot} />
          ) : null}
          {quickScreen === "recall" ? (
            <RecallStep setSnapshot={setSnapshot} snapshot={snapshot} />
          ) : null}
          {quickScreen === "complete" ? (
            <CompleteStep snapshot={snapshot} />
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue || saving }}
            disabled={!canContinue || saving}
            onPress={handlePrimary}
            style={[
              styles.primaryButton,
              (!canContinue || saving) && styles.primaryButtonDisabled,
            ]}
            testID={`v2-primary-${quickScreen}`}
          >
            {saving ? (
              <ActivityIndicator color="#130611" />
            ) : (
              <Text style={styles.primaryButtonText}>{primaryLabel[quickScreen]}</Text>
            )}
          </Pressable>
          {quickScreen === "complete" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void resetPilot()}
              style={styles.resetButton}
              testID="v2-day1-reset"
            >
              <Text style={styles.resetButtonText}>最初からもう一度試す</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
    gap: 16,
  },
  loadingText: {
    color: theme.colors.sub,
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(4,8,18,0.86)",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    gap: 7,
  },
  headerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLabel: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  headerStep: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 11,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 44,
  },
  progressTrack: {
    height: 4,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: ACCENT,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  screenIntro: {
    gap: 9,
    marginBottom: 22,
  },
  eyebrow: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.25,
  },
  screenTitle: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  screenBody: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
  },
  quickQuestionNumber: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  quickPrompt: {
    color: "#fff",
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "900",
  },
  quickHint: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },
  surfaceCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(25,31,56,0.76)",
    padding: 18,
    gap: 13,
    marginBottom: 14,
  },
  surfaceCardAccent: {
    borderColor: "rgba(236,72,153,0.30)",
    backgroundColor: ACCENT_SOFT,
  },
  surfaceCardPurple: {
    borderColor: "rgba(167,139,250,0.28)",
    backgroundColor: "rgba(80,61,145,0.17)",
  },
  cardNumber: {
    color: ACCENT,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  cardTitle: {
    color: "rgba(255,255,255,0.96)",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
  },
  cardBody: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 14,
    lineHeight: 21,
  },
  cardBodyLarge: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 24,
  },
  cardKicker: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 8,
  },
  choiceChip: {
    flex: 1,
    minHeight: 58,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  choiceChipSelected: {
    borderColor: ACCENT,
    backgroundColor: "rgba(236,72,153,0.22)",
  },
  choiceChipText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  choiceChipTextSelected: {
    color: "#fff",
  },
  textInput: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "rgba(3,7,18,0.48)",
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingVertical: 13,
    textAlignVertical: "top",
  },
  recallInput: {
    minHeight: 150,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 12,
    fontWeight: "700",
  },
  confidenceValue: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
  },
  confidenceRow: {
    flexDirection: "row",
    gap: 7,
  },
  confidenceButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  confidenceButtonSelected: {
    backgroundColor: "rgba(236,72,153,0.24)",
    borderWidth: 1,
    borderColor: ACCENT,
  },
  confidenceButtonText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    fontWeight: "700",
  },
  confidenceButtonTextSelected: {
    color: "#fff",
  },
  quietNote: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 3,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACCENT,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 21,
  },
  resultBridge: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    paddingHorizontal: 28,
  },
  resultLine: {
    height: 1,
    flex: 1,
    backgroundColor: "rgba(236,72,153,0.24)",
  },
  resultOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
  resultLabel: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  resultTitle: {
    color: "#fff",
    fontSize: 23,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  resultBody: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    lineHeight: 24,
  },
  quickResultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  quickResultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  quickResultCopy: {
    flex: 1,
    gap: 2,
  },
  quickResultTitle: {
    color: "#fff",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
  },
  boundaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sourceCaption: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 11,
    lineHeight: 17,
  },
  timelineLabel: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  timelineValue: {
    color: "#fff",
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "900",
  },
  timelineReason: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 15,
    lineHeight: 23,
  },
  timelineConfidence: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "800",
  },
  headlineText: {
    color: "#fff",
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "800",
  },
  boundaryHint: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 12,
    lineHeight: 18,
  },
  boundaryOptions: {
    gap: 8,
  },
  boundaryOption: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  boundaryOptionSelected: {
    borderColor: ACCENT,
    backgroundColor: "rgba(236,72,153,0.20)",
  },
  boundaryOptionText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  boundaryOptionTextSelected: {
    color: "#fff",
  },
  predictionCompareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  predictionCompareCell: {
    flex: 1,
    minHeight: 82,
    borderRadius: 18,
    padding: 14,
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  predictionCompareResult: {
    backgroundColor: ACCENT_SOFT,
    borderColor: "rgba(236,72,153,0.28)",
  },
  predictionCompareLabel: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 11,
    fontWeight: "800",
  },
  predictionCompareValue: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
  },
  quickFeedback: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(167,139,250,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.24)",
  },
  quickFeedbackGood: {
    backgroundColor: "rgba(74,222,128,0.10)",
    borderColor: "rgba(74,222,128,0.22)",
  },
  quickFeedbackText: {
    flex: 1,
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  recallOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  recallOptionSelected: {
    backgroundColor: "rgba(236,72,153,0.18)",
    borderColor: ACCENT,
  },
  recallOptionBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  recallOptionBadgeSelected: {
    backgroundColor: ACCENT,
  },
  recallOptionBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  recallOptionText: {
    flex: 1,
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  recallOptionTextSelected: {
    color: "#fff",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCell: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    padding: 14,
    gap: 5,
  },
  summaryCellLabel: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "800",
  },
  summaryCellValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  summaryCellSub: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "800",
  },
  summaryHeadline: {
    color: "#fff",
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "800",
  },
  summaryBody: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 14,
    lineHeight: 22,
  },
  completeHero: {
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  completeIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    marginBottom: 3,
  },
  completeEyebrow: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  completeTitle: {
    color: "#fff",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
  },
  completeBody: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  fieldTestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldTestPill: {
    width: 38,
    minHeight: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  fieldTestPillPurple: {
    backgroundColor: PURPLE,
  },
  fieldTestPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  fieldTestText: {
    flex: 1,
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  quickNextCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingVertical: 14,
    backgroundColor: "rgba(111,76,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.18)",
  },
  quickNextCopy: {
    flex: 1,
    gap: 4,
  },
  quickNextTitle: {
    color: "#fff",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  savedPredictionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  savedPredictionLabel: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 11,
    fontWeight: "700",
  },
  savedPredictionValue: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: "800",
  },
  recallQuote: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 17,
    lineHeight: 27,
    fontWeight: "600",
  },
  nextQuestionCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 6,
    marginBottom: 14,
    gap: 9,
    backgroundColor: "rgba(111,76,255,0.17)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.32)",
  },
  nextQuestionKicker: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  nextQuestionTitle: {
    color: "#fff",
    fontSize: 21,
    lineHeight: 29,
    fontWeight: "900",
  },
  nextQuestionBody: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 14,
    lineHeight: 21,
  },
  purposeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.22)",
    backgroundColor: "rgba(236,72,153,0.10)",
  },
  purposeCopy: {
    flex: 1,
    gap: 5,
  },
  purposeTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  purposeBody: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(4,8,18,0.94)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.12)",
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: "#14050f",
    fontSize: 16,
    fontWeight: "900",
  },
  resetButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
  },
  resetButtonText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    color: "#fda4af",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});
