import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
const STEPS: V2PilotDay1Step[] = [
  "prediction",
  "research",
  "quality_update",
  "boundary",
  "recall",
  "complete",
];

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
    snapshot.qualityPrediction.direction &&
      snapshot.qualityPrediction.reason.trim().length >= 2 &&
      snapshot.qualityPrediction.confidence !== null &&
      snapshot.diversityPrediction.direction &&
      snapshot.diversityPrediction.reason.trim().length >= 2 &&
      snapshot.diversityPrediction.confidence !== null
  );
}

function hasQualityUpdateInput(snapshot: V2PilotSnapshot): boolean {
  return Boolean(
    snapshot.qualityUpdate.comparison &&
      snapshot.qualityUpdate.reason.trim().length >= 2 &&
      snapshot.qualityUpdate.confidence !== null
  );
}

function hasBoundaryInput(snapshot: V2PilotSnapshot): boolean {
  return BOUNDARY_DEFINITIONS.every(
    ({ id }) => snapshot.boundaryAnswers[id]?.boundaryTag
  );
}

function hasRecallInput(snapshot: V2PilotSnapshot): boolean {
  return Boolean(
    snapshot.recall.answer.trim().length >= 4 && snapshot.recall.confidence !== null
  );
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

function ConfidenceScale({
  onChange,
  testIDPrefix,
  value,
}: {
  onChange: (next: number) => void;
  testIDPrefix: string;
  value: number | null;
}) {
  return (
    <View>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>今の確信度</Text>
        <Text style={styles.confidenceValue}>{value === null ? "未選択" : `${value}%`}</Text>
      </View>
      <View style={styles.confidenceRow}>
        {[20, 40, 60, 80, 100].map((item) => {
          const selected = value === item;
          return (
            <Pressable
              key={item}
              accessibilityLabel={`確信度 ${item}%`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(item)}
              style={[styles.confidenceButton, selected && styles.confidenceButtonSelected]}
              testID={`${testIDPrefix}-${item}`}
            >
              <Text
                style={[
                  styles.confidenceButtonText,
                  selected && styles.confidenceButtonTextSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  setSnapshot,
  snapshot,
}: {
  setSnapshot: React.Dispatch<React.SetStateAction<V2PilotSnapshot>>;
  snapshot: V2PilotSnapshot;
}) {
  return (
    <View testID="v2-step-prediction">
      <ScreenIntro
        eyebrow="PREDICTION · 説明の前"
        title="AIを使うと、何が変わる？"
        body="明日、新サービスの企画会議がある。最初の案出しだけをAIに手伝わせるとする。研究結果を見る前に、2本の予想を別々に残す。"
      />

      <SurfaceCard tone="accent">
        <Text style={styles.cardNumber}>01</Text>
        <Text style={styles.cardTitle}>一人ひとりの案の平均品質</Text>
        <Text style={styles.cardBody}>AIを使った人の案は、平均するとどう評価されると思う？</Text>
        <ChoiceChips
          labels={DIRECTION_LABELS}
          onChange={(direction) =>
            setSnapshot((current) => ({
              ...current,
              qualityPrediction: { ...current.qualityPrediction, direction },
            }))
          }
          testIDPrefix="v2-quality-direction"
          value={snapshot.qualityPrediction.direction}
        />
        <TextInput
          accessibilityLabel="平均品質をそう予想した理由"
          multiline
          onChangeText={(reason) =>
            setSnapshot((current) => ({
              ...current,
              qualityPrediction: { ...current.qualityPrediction, reason },
            }))
          }
          placeholder="なぜそう思う？ 1〜2文で十分"
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.textInput}
          testID="v2-quality-reason"
          value={snapshot.qualityPrediction.reason}
        />
        <ConfidenceScale
          onChange={(confidence) =>
            setSnapshot((current) => ({
              ...current,
              qualityPrediction: { ...current.qualityPrediction, confidence },
            }))
          }
          testIDPrefix="v2-quality-confidence"
          value={snapshot.qualityPrediction.confidence}
        />
      </SurfaceCard>

      <SurfaceCard tone="purple">
        <Text style={[styles.cardNumber, { color: PURPLE }]}>02</Text>
        <Text style={styles.cardTitle}>参加者全体から出る案の幅</Text>
        <Text style={styles.cardBody}>会議のみんながAIを使った時、案の種類はどうなると思う？</Text>
        <ChoiceChips
          labels={DIVERSITY_LABELS}
          onChange={(direction) =>
            setSnapshot((current) => ({
              ...current,
              diversityPrediction: { ...current.diversityPrediction, direction },
            }))
          }
          testIDPrefix="v2-diversity-direction"
          value={snapshot.diversityPrediction.direction}
        />
        <TextInput
          accessibilityLabel="案の幅をそう予想した理由"
          multiline
          onChangeText={(reason) =>
            setSnapshot((current) => ({
              ...current,
              diversityPrediction: { ...current.diversityPrediction, reason },
            }))
          }
          placeholder="品質とは別に考えてみる"
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.textInput}
          testID="v2-diversity-reason"
          value={snapshot.diversityPrediction.reason}
        />
        <ConfidenceScale
          onChange={(confidence) =>
            setSnapshot((current) => ({
              ...current,
              diversityPrediction: { ...current.diversityPrediction, confidence },
            }))
          }
          testIDPrefix="v2-diversity-confidence"
          value={snapshot.diversityPrediction.confidence}
        />
      </SurfaceCard>

      <Text style={styles.quietNote}>
        ここでは正解を出さない。2本が同じ方向である必要もない。
      </Text>
    </View>
  );
}

function ResearchStep() {
  return (
    <View testID="v2-step-research">
      <ScreenIntro
        eyebrow="RESEARCH STORY · 5 EXPERIMENTS"
        title="AIは案を悪くしたのか？"
        body="2024年、研究者はGPT-3.5を使う条件、通常のWeb検索を使う条件、どちらも使わない条件を比べた。"
      />

      <SurfaceCard>
        <Text style={styles.cardKicker}>参加者が取り組んだ課題</Text>
        {[
          "10代向けの贈り物を考える",
          "身近な物から玩具を作る",
          "使っていない物を別用途へ変える",
          "新しいダイニングテーブルを設計する",
        ].map((item) => (
          <View key={item} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </SurfaceCard>

      <View style={styles.resultBridge}>
        <View style={styles.resultLine} />
        <View style={styles.resultOrb}>
          <Ionicons name="sparkles" color="#fff" size={22} />
        </View>
        <View style={styles.resultLine} />
      </View>

      <SurfaceCard tone="accent">
        <Text style={styles.resultLabel}>RESULT</Text>
        <Text style={styles.resultTitle}>ChatGPT支援の案は、平均的に高く評価された</Text>
        <Text style={styles.resultBody}>
          外部評価では、非使用・Web検索条件より創造性の平均評価が高かった。特に、完全に突飛な発明より、既存の考えを一段よくする incremental な案で強みが見られた。
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <View style={styles.boundaryHeader}>
          <Ionicons name="contract-outline" color={PURPLE} size={18} />
          <Text style={[styles.cardKicker, { color: PURPLE }]}>まだ言えないこと</Text>
        </View>
        <Text style={styles.cardBodyLarge}>
          これは「AI自身が人間より創造的」「今の全モデルが全仕事を改善する」「人の性質が長期的に変わった」という結果ではない。
        </Text>
        <Text style={styles.sourceCaption}>
          Lee & Chung, Nature Human Behaviour (2024) · GPT-3.5 · 特定の創造課題
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
        eyebrow="UPDATE · 予想と証拠を並べる"
        title="最初の予想は、どう動いた？"
        body="正解したかではなく、証拠を見て自分の説明がどう変わったかを残す。"
      />

      <SurfaceCard>
        <Text style={styles.timelineLabel}>研究を見る前</Text>
        <Text style={styles.timelineValue}>
          平均品質は「{predictionDirection ? DIRECTION_LABELS[predictionDirection] : "未回答"}」
        </Text>
        <Text style={styles.timelineReason}>「{snapshot.qualityPrediction.reason}」</Text>
        <Text style={styles.timelineConfidence}>
          確信度 {snapshot.qualityPrediction.confidence ?? 0}%
        </Text>
      </SurfaceCard>

      <SurfaceCard tone="accent">
        <Text style={styles.cardTitle}>研究結果は、予想と比べて？</Text>
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
        <TextInput
          accessibilityLabel="研究を見て変わった考え"
          multiline
          onChangeText={(reason) =>
            setSnapshot((current) => ({
              ...current,
              qualityUpdate: { ...current.qualityUpdate, reason },
            }))
          }
          placeholder="どの部分が予想と違った？"
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.textInput}
          testID="v2-quality-update-reason"
          value={snapshot.qualityUpdate.reason}
        />
        <ConfidenceScale
          onChange={(confidence) =>
            setSnapshot((current) => ({
              ...current,
              qualityUpdate: { ...current.qualityUpdate, confidence },
            }))
          }
          testIDPrefix="v2-quality-update-confidence"
          value={snapshot.qualityUpdate.confidence}
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
  return (
    <View testID="v2-step-boundary">
      <ScreenIntro
        eyebrow="CLAIM BOUNDARY LAB"
        title="どの言葉から、研究を越えた？"
        body="一番慎重な文を当てるのではない。4本すべてを調べ、主張が飛躍した場所へタグを置く。"
      />

      {BOUNDARY_DEFINITIONS.map((definition, index) => {
        const selectedTag = snapshot.boundaryAnswers[definition.id]?.boundaryTag ?? null;
        return (
          <SurfaceCard key={definition.id} tone={index === 3 ? "accent" : "default"}>
            <Text style={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</Text>
            <Text style={styles.headlineText}>「{definition.headline}」</Text>
            <Text style={styles.boundaryHint}>{definition.hint}</Text>
            <View style={styles.boundaryOptions}>
              {definition.options.map((option) => {
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
                          [definition.id]: { boundaryTag: option, note: "" },
                        },
                      }))
                    }
                    style={[styles.boundaryOption, selected && styles.boundaryOptionSelected]}
                    testID={`v2-boundary-${definition.id}-${definition.options.indexOf(option)}`}
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
        );
      })}

      <Text style={styles.quietNote}>
        ここでは点数をつけない。どの境界を見たかを、次の想起へ残す。
      </Text>
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
  return (
    <View testID="v2-step-recall">
      <ScreenIntro
        eyebrow="RECALL · 説明を隠したまま"
        title="AIは何を上げた？ まだ何は分からない？"
        body="研究名や用語は要らない。今日の結果と、その境界を自分の一文で思い出す。"
      />

      <SurfaceCard tone="purple">
        <TextInput
          accessibilityLabel="今日の研究結果と分からないこと"
          multiline
          onChangeText={(answer) =>
            setSnapshot((current) => ({
              ...current,
              recall: { ...current.recall, answer },
            }))
          }
          placeholder="上がったもの / まだ分からないもの"
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={[styles.textInput, styles.recallInput]}
          testID="v2-recall-answer"
          value={snapshot.recall.answer}
        />
        <ConfidenceScale
          onChange={(confidence) =>
            setSnapshot((current) => ({
              ...current,
              recall: { ...current.recall, confidence },
            }))
          }
          testIDPrefix="v2-recall-confidence"
          value={snapshot.recall.confidence}
        />
      </SurfaceCard>

      <Text style={styles.quietNote}>回答するまで、要約は表示しない。</Text>
    </View>
  );
}

function CompleteStep({ snapshot }: { snapshot: V2PilotSnapshot }) {
  const qualityDirection = snapshot.qualityPrediction.direction;
  const diversityDirection = snapshot.diversityPrediction.direction;
  const comparison = snapshot.qualityUpdate.comparison;
  return (
    <View testID="v2-step-complete">
      <ScreenIntro
        eyebrow="DAY 1 SAVED · XPなし"
        title="予想が、証拠で一段だけ動いた"
        body="正解数ではなく、説明前の自分と研究後の自分を一本の履歴にした。"
      />

      <SurfaceCard>
        <Text style={styles.timelineLabel}>01 · 研究を見る前</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>平均品質</Text>
            <Text style={styles.summaryCellValue}>
              {qualityDirection ? DIRECTION_LABELS[qualityDirection] : "—"}
            </Text>
            <Text style={styles.summaryCellSub}>
              {snapshot.qualityPrediction.confidence ?? 0}%
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>案の幅</Text>
            <Text style={styles.summaryCellValue}>
              {diversityDirection ? DIVERSITY_LABELS[diversityDirection] : "—"}
            </Text>
            <Text style={styles.summaryCellSub}>
              {snapshot.diversityPrediction.confidence ?? 0}%
            </Text>
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard tone="accent">
        <Text style={styles.timelineLabel}>02 · 研究で確認できたこと</Text>
        <Text style={styles.summaryHeadline}>
          GPT-3.5支援を受けた参加者の案は、特定の創造課題で平均評価が高かった。
        </Text>
        <Text style={styles.summaryBody}>
          人の長期的な性質、今の全モデル、あらゆる仕事、集団全体の案の幅までは、この結果だけでは分からない。
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.timelineLabel}>03 · あなたの更新</Text>
        <Text style={styles.timelineValue}>
          {comparison ? COMPARISON_LABELS[comparison] : "—"}
        </Text>
        <Text style={styles.timelineReason}>「{snapshot.qualityUpdate.reason}」</Text>
        <Text style={styles.timelineConfidence}>
          現在の確信度 {snapshot.qualityUpdate.confidence ?? 0}%
        </Text>
      </SurfaceCard>

      <SurfaceCard tone="purple">
        <Text style={styles.timelineLabel}>04 · 説明なしで思い出したこと</Text>
        <Text style={styles.recallQuote}>「{snapshot.recall.answer}」</Text>
      </SurfaceCard>

      <SurfaceCard tone="accent">
        <Text style={styles.timelineLabel}>FIELD TEST · 次にAIで案を出す時</Text>
        <Text style={styles.summaryHeadline}>
          生成前後を、2軸で30秒だけ比べる
        </Text>
        <View style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>
            質：良くしたかった点は、本当に良くなったか
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>
            自分の候補幅：複数案が、同じ方向へ寄っていないか
          </Text>
        </View>
        <Text style={styles.summaryBody}>
          メモに2行だけ残す。これは効果が実証済みの手順ではない。明日は、この「自分の候補幅」と「チーム全体の多様性」を分けて見る。
        </Text>
      </SurfaceCard>

      <View style={styles.nextQuestionCard}>
        <Text style={styles.nextQuestionKicker}>NEXT · 保存したもう一本の予想</Text>
        <Text style={styles.nextQuestionTitle}>
          みんながAIを使った時、案の幅は広がるのか？
        </Text>
        <Text style={styles.nextQuestionBody}>
          次は、今日の「個人の平均品質」と、集合全体の「多様性」を別々に見る。
        </Text>
      </View>

      <View style={styles.purposeCard}>
        <Ionicons name="leaf" color={ACCENT} size={24} />
        <View style={styles.purposeCopy}>
          <Text style={styles.purposeTitle}>Psycleがすること</Text>
          <Text style={styles.purposeBody}>
            あなたの予想を先に残し、研究で更新し、後日それを実際の判断へ変える。
          </Text>
        </View>
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
  }, [snapshot.currentStep]);

  const stepIndex = Math.max(0, STEPS.indexOf(snapshot.currentStep));
  const progress = (stepIndex + 1) / STEPS.length;

  const canContinue = useMemo(() => {
    switch (snapshot.currentStep) {
      case "prediction":
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
  }, [snapshot]);

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
    switch (snapshot.currentStep) {
      case "prediction":
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

  const primaryLabel: Record<V2PilotDay1Step, string> = {
    prediction: "2本の予想を保存する",
    research: "自分の予想と照合する",
    quality_update: "更新を保存する",
    boundary: "4つの境界を保存する",
    recall: "回答を保存して結果を見る",
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
              <Text style={styles.headerStep}>{stepIndex + 1} / {STEPS.length}</Text>
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
          {snapshot.currentStep === "prediction" ? (
            <PredictionStep setSnapshot={setSnapshot} snapshot={snapshot} />
          ) : null}
          {snapshot.currentStep === "research" ? <ResearchStep /> : null}
          {snapshot.currentStep === "quality_update" ? (
            <QualityUpdateStep setSnapshot={setSnapshot} snapshot={snapshot} />
          ) : null}
          {snapshot.currentStep === "boundary" ? (
            <BoundaryStep setSnapshot={setSnapshot} snapshot={snapshot} />
          ) : null}
          {snapshot.currentStep === "recall" ? (
            <RecallStep setSnapshot={setSnapshot} snapshot={snapshot} />
          ) : null}
          {snapshot.currentStep === "complete" ? (
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
            testID={`v2-primary-${snapshot.currentStep}`}
          >
            {saving ? (
              <ActivityIndicator color="#130611" />
            ) : (
              <Text style={styles.primaryButtonText}>{primaryLabel[snapshot.currentStep]}</Text>
            )}
          </Pressable>
          {snapshot.currentStep === "complete" ? (
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
    paddingTop: 24,
    paddingBottom: 40,
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
    minHeight: 46,
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
    fontSize: 12,
    fontWeight: "700",
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
