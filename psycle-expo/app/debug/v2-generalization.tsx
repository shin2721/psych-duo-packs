import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Linking,
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
  advanceV2GeneralizationFlow,
  createInitialV2GeneralizationSnapshot,
  getV2GeneralizationStep,
  retryV2GeneralizationStep,
  selectV2GeneralizationOption,
} from "../../lib/v2-pilot/generalization/flow";
import {
  V2_GENERALIZATION_LESSONS,
} from "../../lib/v2-pilot/generalization/lessons";
import {
  loadV2GeneralizationSnapshot,
  resetV2GeneralizationSnapshot,
  saveV2GeneralizationSnapshot,
} from "../../lib/v2-pilot/generalization/storage";
import {
  V2_GENERALIZATION_STEP_IDS,
  type V2GeneralizationEvidenceFrame,
  type V2GeneralizationLessonDefinition,
  type V2GeneralizationLessonId,
  type V2GeneralizationScoredStepDefinition,
  type V2GeneralizationSnapshot,
  type V2GeneralizationStepDefinition,
  type V2GeneralizationStepId,
} from "../../types/v2GeneralizationPilot";

const ACCENT = "#ec4899";
const ACCENT_SOFT = "rgba(236,72,153,0.16)";
const PURPLE = "#a78bfa";
const SUCCESS = "#34d399";
const ERROR = "#fb7185";

type SnapshotMap = Partial<
  Record<V2GeneralizationLessonId, V2GeneralizationSnapshot>
>;

const STEP_LABELS: Record<V2GeneralizationStepId, string> = {
  prediction: "PREDICTION",
  evidence: "EVIDENCE",
  update: "UPDATE",
  boundary: "BOUNDARY",
  retrieval: "RETRIEVAL",
  transfer: "TRANSFER",
  complete: "COMPLETE",
};

const STEP_EYEBROWS: Record<V2GeneralizationStepId, string> = {
  prediction: "先に直感を残す",
  evidence: "研究の射程を見る",
  update: "予想を更新する",
  boundary: "最初の越境を切る",
  retrieval: "見ずに取り出す",
  transfer: "初見の場面で使う",
  complete: "境界を持ち帰る",
};

const LESSON_ICONS: Record<
  V2GeneralizationLessonId,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  "walking-divergence-v1": "walk-outline",
  "interleaving-boundary-v1": "shuffle-outline",
  "temptation-bundling-v1": "headset-outline",
};

const FRAME_ROWS: readonly {
  key: keyof V2GeneralizationEvidenceFrame;
  label: string;
}[] = [
  { key: "target", label: "対象" },
  { key: "comparison", label: "比較" },
  { key: "result", label: "結果" },
  { key: "time", label: "時間" },
  { key: "setting", label: "場面" },
];

function Surface({
  children,
  tone = "default",
  style,
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "purple" | "success";
  style?: object;
}) {
  return (
    <View
      style={[
        styles.surface,
        tone === "accent" && styles.surfaceAccent,
        tone === "purple" && styles.surfacePurple,
        tone === "success" && styles.surfaceSuccess,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function Intro({
  body,
  eyebrow,
  title,
}: {
  body?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <View style={styles.intro}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

function CaptureOptions({
  disabled,
  onSelect,
  selectedOptionId,
  step,
}: {
  disabled: boolean;
  onSelect: (optionId: string) => void;
  selectedOptionId: string | null;
  step: Extract<V2GeneralizationStepDefinition, { kind: "capture" }>;
}) {
  return (
    <View accessibilityRole="radiogroup" style={styles.captureRow}>
      {step.options.map((option) => {
        const selected = selectedOptionId === option.id;
        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ disabled, selected }}
            disabled={disabled}
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [
              styles.captureOption,
              selected && styles.optionSelected,
              pressed && !disabled && styles.pressed,
            ]}
            testID={`v2g-option-${step.id}-${option.id}`}
          >
            <Text
              style={[
                styles.captureOptionText,
                selected && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ScoredOptions({
  disabled,
  onSelect,
  selectedOptionId,
  step,
}: {
  disabled: boolean;
  onSelect: (optionId: string) => void;
  selectedOptionId: string | null;
  step: V2GeneralizationScoredStepDefinition;
}) {
  return (
    <View accessibilityRole="radiogroup" style={styles.scoredOptions}>
      {step.options.map((option, index) => {
        const selected = selectedOptionId === option.id;
        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ disabled, selected }}
            disabled={disabled}
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [
              styles.scoredOption,
              selected && styles.optionSelected,
              pressed && !disabled && styles.pressed,
            ]}
            testID={`v2g-option-${step.id}-${option.id}`}
          >
            <View style={[styles.optionIndex, selected && styles.optionIndexSelected]}>
              <Text
                style={[
                  styles.optionIndexText,
                  selected && styles.optionIndexTextSelected,
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.scoredOptionText,
                selected && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function EvidenceStep({
  lesson,
  step,
}: {
  lesson: V2GeneralizationLessonDefinition;
  step: Extract<V2GeneralizationStepDefinition, { kind: "evidence" }>;
}) {
  return (
    <View testID="v2g-step-evidence">
      <Intro
        body={step.result}
        eyebrow="EVIDENCE · 研究の射程を見る"
        title={step.headline}
      />
      <Surface tone="purple" style={styles.evidenceCard}>
        {FRAME_ROWS.map((row) => (
          <View key={row.key} style={styles.frameRow}>
            <Text style={styles.frameLabel}>{row.label}</Text>
            <Text style={styles.frameValue}>{step.frame[row.key]}</Text>
          </View>
        ))}
        <View style={styles.caveatDivider} />
        <View style={styles.caveatRow}>
          <Ionicons color={PURPLE} name="information-circle-outline" size={18} />
          <Text style={styles.caveatText}>{step.caveat}</Text>
        </View>
        <View style={styles.sourceList}>
          {lesson.sources.map((source) => (
            <Pressable
              accessibilityHint="出典をブラウザで開きます"
              accessibilityLabel={`出典 ${source.label}`}
              accessibilityRole="link"
              key={source.url}
              onPress={() => {
                void Linking.openURL(source.url).catch(() => undefined);
              }}
              style={styles.sourceLink}
            >
              <Ionicons color="rgba(255,255,255,0.38)" name="open-outline" size={14} />
              <Text style={styles.sourceLabel}>{source.label}</Text>
            </Pressable>
          ))}
        </View>
      </Surface>
    </View>
  );
}

function ScoredStep({
  disabled,
  onSelect,
  selectedOptionId,
  step,
}: {
  disabled: boolean;
  onSelect: (optionId: string) => void;
  selectedOptionId: string | null;
  step: V2GeneralizationScoredStepDefinition;
}) {
  const titles: Record<V2GeneralizationScoredStepDefinition["id"], string> = {
    boundary: "どこから言いすぎ？",
    retrieval: "研究の中と外を分ける",
    transfer: "別の話でも切れる？",
  };

  return (
    <View testID={`v2g-step-${step.id}`}>
      <Intro
        eyebrow={`${STEP_LABELS[step.id]} · ${STEP_EYEBROWS[step.id]}`}
        title={titles[step.id]}
      />

      {step.sourceClaim ? (
        <Surface style={styles.claimCard}>
          <Text style={styles.claimLabel}>研究が直接支える文</Text>
          <Text style={styles.claimSource}>{step.sourceClaim}</Text>
        </Surface>
      ) : null}

      {step.context ? (
        <Surface style={styles.claimCard}>
          <Text style={styles.claimLabel}>初見の研究カード</Text>
          <Text style={styles.claimSource}>{step.context}</Text>
        </Surface>
      ) : null}

      {step.headline ? (
        <Surface tone="accent" style={styles.headlineCard}>
          <Text style={styles.claimLabel}>判定する見出し</Text>
          <Text style={styles.headlineText}>{step.headline}</Text>
        </Surface>
      ) : null}

      <Text style={styles.prompt}>{step.prompt}</Text>
      <ScoredOptions
        disabled={disabled}
        onSelect={onSelect}
        selectedOptionId={selectedOptionId}
        step={step}
      />
    </View>
  );
}

function CompletionStep({
  lesson,
  step,
}: {
  lesson: V2GeneralizationLessonDefinition;
  step: Extract<V2GeneralizationStepDefinition, { kind: "complete" }>;
}) {
  return (
    <View testID="v2g-step-complete">
      <Intro
        body="正解を覚えるより、研究が言える範囲を持ち運ぶ。"
        eyebrow="COMPLETE · 境界を持ち帰る"
        title="1つ、使える見方が増えた"
      />
      <Surface tone="success">
        <View style={styles.completeHeading}>
          <View style={styles.completeIcon}>
            <Ionicons color={SUCCESS} name="checkmark" size={20} />
          </View>
          <Text style={styles.completeLabel}>CORE TAKEAWAY</Text>
        </View>
        <Text style={styles.takeaway}>{lesson.rawInsight}</Text>
      </Surface>
      <Surface tone="accent">
        <Text style={styles.actionLabel}>10秒でやる</Text>
        <Text style={styles.actionText}>{step.action}</Text>
      </Surface>
      {step.optionalSelfObservation ? (
        <View style={styles.optionalRow}>
          <Ionicons color={PURPLE} name="eye-outline" size={18} />
          <Text style={styles.optionalText}>{step.optionalSelfObservation}</Text>
        </View>
      ) : null}
      <Text style={styles.disclaimer}>{step.disclaimer}</Text>
      <View style={styles.nextQuestionRow}>
        <Ionicons color={ACCENT} name="arrow-forward-circle-outline" size={20} />
        <Text style={styles.nextQuestion}>{step.nextQuestion}</Text>
      </View>
    </View>
  );
}

function StepContent({
  disabled,
  lesson,
  onSelect,
  snapshot,
  step,
}: {
  disabled: boolean;
  lesson: V2GeneralizationLessonDefinition;
  onSelect: (optionId: string) => void;
  snapshot: V2GeneralizationSnapshot;
  step: V2GeneralizationStepDefinition;
}) {
  if (step.kind === "capture") {
    const isPrediction = step.id === "prediction";
    return (
      <View testID={`v2g-step-${step.id}`}>
        <Intro
          body={
            isPrediction
              ? "説明を見る前に1タップ。正解ではなく、最初の自分を残す。"
              : "最初の予想と研究の射程を比べて、今の見立てを残す。"
          }
          eyebrow={`${STEP_LABELS[step.id]} · ${STEP_EYEBROWS[step.id]}`}
          title={step.prompt}
        />
        {step.scene ? (
          <Surface tone="purple">
            <Text style={styles.sceneLabel}>SCENE</Text>
            <Text style={styles.sceneText}>{step.scene}</Text>
          </Surface>
        ) : null}
        <CaptureOptions
          disabled={disabled}
          onSelect={onSelect}
          selectedOptionId={snapshot.answers[step.id]}
          step={step}
        />
      </View>
    );
  }

  if (step.kind === "evidence") {
    return <EvidenceStep lesson={lesson} step={step} />;
  }

  if (step.kind === "scored") {
    return (
      <ScoredStep
        disabled={disabled || Boolean(snapshot.answers[step.id])}
        onSelect={onSelect}
        selectedOptionId={snapshot.answers[step.id]}
        step={step}
      />
    );
  }

  return <CompletionStep lesson={lesson} step={step} />;
}

function getHubStatus(snapshot: V2GeneralizationSnapshot): string {
  if (snapshot.currentStep === "complete" || snapshot.completedAt) return "完了";
  const pristine =
    snapshot.currentStep === "prediction" &&
    Object.values(snapshot.answers).every((answer) => answer === null);
  if (pristine) return "未開始";
  const index = V2_GENERALIZATION_STEP_IDS.indexOf(snapshot.currentStep);
  return `${Math.max(1, index + 1)} / ${V2_GENERALIZATION_STEP_IDS.length}`;
}

function GeneralizationHub({
  error,
  onClose,
  onOpen,
  readFailedLessonIds,
  snapshots,
}: {
  error: string | null;
  onClose: () => void;
  onOpen: (lessonId: V2GeneralizationLessonId) => void;
  readFailedLessonIds: ReadonlySet<V2GeneralizationLessonId>;
  snapshots: SnapshotMap;
}) {
  const completedCount = V2_GENERALIZATION_LESSONS.filter(
    (lesson) => snapshots[lesson.id]?.completedAt
  ).length;

  return (
    <SafeAreaView style={styles.container} testID="v2g-hub">
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <StarBackground />
      </View>
      <View style={styles.hubHeader}>
        <Pressable
          accessibilityLabel="コースへ戻る"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.iconButton}
          testID="v2g-close"
        >
          <Ionicons color="rgba(255,255,255,0.82)" name="close" size={25} />
        </Pressable>
        <Text style={styles.hubHeaderTitle}>LEARNING CORE V2</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.hubContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.hubIntro}>
          <Text style={styles.eyebrow}>3 TOPICS · 1 SHARED SKILL</Text>
          <Text style={styles.hubTitle}>研究の「中」と「外」を、別の話でも切れるか</Text>
          <Text style={styles.hubBody}>
            対象・比較・結果・時間・場面を残し、言いすぎを初見で見抜く。3つとも同じ7ステップで試す。
          </Text>
        </View>

        <View style={styles.hubSummary}>
          <View>
            <Text style={styles.summaryLabel}>PILOT PROGRESS</Text>
            <Text style={styles.summaryValue}>{completedCount} / 3 完了</Text>
          </View>
          <View style={styles.skillPill}>
            <Ionicons color={ACCENT} name="scan-outline" size={16} />
            <Text style={styles.skillPillText}>境界 → 転用</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.hubError} accessibilityRole="alert">
            <Ionicons color={ERROR} name="alert-circle-outline" size={18} />
            <Text style={styles.hubErrorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.topicList}>
          {V2_GENERALIZATION_LESSONS.map((lesson, index) => {
            const snapshot = snapshots[lesson.id];
            if (!snapshot) return null;
            const readFailed = readFailedLessonIds.has(lesson.id);
            const complete = Boolean(snapshot.completedAt);
            const status = readFailed ? "再読込" : getHubStatus(snapshot);
            return (
              <Pressable
                accessibilityHint={
                  readFailed
                    ? "保存済み進捗を再読み込みしてから開きます"
                    : "7ステップのレッスンを開きます"
                }
                accessibilityLabel={`${lesson.title}、${status}`}
                accessibilityRole="button"
                key={lesson.id}
                onPress={() => onOpen(lesson.id)}
                style={({ pressed }) => [
                  styles.topicCard,
                  complete && styles.topicCardComplete,
                  pressed && styles.pressed,
                ]}
                testID={`v2g-topic-${lesson.id}`}
              >
                <View style={[styles.topicIcon, complete && styles.topicIconComplete]}>
                  <Ionicons
                    color={complete ? SUCCESS : index === 1 ? PURPLE : ACCENT}
                    name={complete ? "checkmark" : LESSON_ICONS[lesson.id]}
                    size={23}
                  />
                </View>
                <View style={styles.topicCopy}>
                  <View style={styles.topicMetaRow}>
                    <Text style={styles.topicNumber}>LESSON {index + 1}</Text>
                    <Text
                      style={[
                        styles.topicStatus,
                        complete && styles.topicStatusComplete,
                        readFailed && styles.topicStatusReadFailed,
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                  <Text style={styles.topicTitle}>{lesson.title}</Text>
                  <Text style={styles.topicSubtitle}>{lesson.subtitle}</Text>
                </View>
                <Ionicons color="rgba(255,255,255,0.36)" name="chevron-forward" size={20} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function V2GeneralizationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const scrollRef = useRef<ScrollView>(null);
  const [activeLessonId, setActiveLessonId] =
    useState<V2GeneralizationLessonId | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readFailedLessonIds, setReadFailedLessonIds] = useState<
    ReadonlySet<V2GeneralizationLessonId>
  >(new Set());
  const userScopeGenerationRef = useRef(0);

  useEffect(() => {
    const generation = userScopeGenerationRef.current + 1;
    userScopeGenerationRef.current = generation;
    setActiveLessonId(null);
    setSnapshots({});
    setReadFailedLessonIds(new Set());
    setSaving(false);
    if (!V2_OWNER_PILOT_ENABLED) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all(
      V2_GENERALIZATION_LESSONS.map(async (lesson) => {
        try {
          return [
            lesson.id,
            await loadV2GeneralizationSnapshot(lesson, userId),
            false,
          ] as const;
        } catch {
          return [
            lesson.id,
            createInitialV2GeneralizationSnapshot(lesson),
            true,
          ] as const;
        }
      })
    )
      .then((entries) => {
        if (cancelled || userScopeGenerationRef.current !== generation) return;
        const loaded: SnapshotMap = {};
        let hadReadFailure = false;
        entries.forEach(([lessonId, snapshot, failed]) => {
          loaded[lessonId] = snapshot;
          hadReadFailure ||= failed;
        });
        setSnapshots(loaded);
        setReadFailedLessonIds(
          new Set(
            entries
              .filter(([, , failed]) => failed)
              .map(([lessonId]) => lessonId)
          )
        );
        if (hadReadFailure) {
          setError("一部の進捗を読めませんでした。対象レッスンを押すと再読込します。");
        }
      })
      .catch(() => {
        if (!cancelled && userScopeGenerationRef.current === generation) {
          setError("3つの進捗を端末から読み込めませんでした。");
        }
      })
      .finally(() => {
        if (!cancelled && userScopeGenerationRef.current === generation) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const lesson = useMemo(
    () =>
      activeLessonId
        ? V2_GENERALIZATION_LESSONS.find(
            (candidate) => candidate.id === activeLessonId
          ) ?? null
        : null,
    [activeLessonId]
  );
  const snapshot = lesson ? snapshots[lesson.id] ?? null : null;
  const step =
    lesson && snapshot
      ? getV2GeneralizationStep(lesson, snapshot.currentStep)
      : null;

  const openLesson = async (lessonId: V2GeneralizationLessonId) => {
    setError(null);
    if (!readFailedLessonIds.has(lessonId)) {
      setActiveLessonId(lessonId);
      return;
    }

    const definition = V2_GENERALIZATION_LESSONS.find(
      (candidate) => candidate.id === lessonId
    );
    if (!definition) return;

    const generation = userScopeGenerationRef.current;
    setLoading(true);
    try {
      const reloaded = await loadV2GeneralizationSnapshot(definition, userId);
      if (userScopeGenerationRef.current !== generation) return;
      setSnapshots((current) => ({ ...current, [lessonId]: reloaded }));
      setReadFailedLessonIds((current) => {
        const next = new Set(current);
        next.delete(lessonId);
        return next;
      });
      setActiveLessonId(lessonId);
    } catch {
      if (userScopeGenerationRef.current !== generation) return;
      setError("保存済み進捗を再読込できませんでした。もう一度試してください。");
    } finally {
      if (userScopeGenerationRef.current === generation) setLoading(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeLessonId, snapshot?.currentStep]);

  if (!V2_OWNER_PILOT_ENABLED) {
    return <Redirect href="/(tabs)/course" />;
  }

  if (loading) {
    return (
      <View style={styles.loading} testID="v2g-loading">
        <StarBackground />
        <ActivityIndicator color={ACCENT} size="large" />
        <Text style={styles.loadingText}>3つのレッスンを読み込み中</Text>
      </View>
    );
  }

  if (!lesson || !snapshot || !step) {
    return (
      <GeneralizationHub
        error={error}
        onClose={() => router.replace("/(tabs)/course")}
        onOpen={(lessonId) => {
          void openLesson(lessonId);
        }}
        readFailedLessonIds={readFailedLessonIds}
        snapshots={snapshots}
      />
    );
  }

  const setLessonSnapshot = (next: V2GeneralizationSnapshot) => {
    setSnapshots((current) => ({ ...current, [lesson.id]: next }));
  };

  const selectOption = async (optionId: string) => {
    if (saving || step.kind === "evidence" || step.kind === "complete") return;
    if (readFailedLessonIds.has(lesson.id)) {
      setError("保存済み進捗を再読込するまで回答を保存できません。");
      return;
    }
    const selected = selectV2GeneralizationOption(
      snapshot,
      lesson,
      optionId
    );
    if (selected.status !== "selected") return;

    if (step.kind === "scored") {
      const selectedDefinition = step.options.find(
        (option) => option.id === optionId
      );
      if (selectedDefinition) {
        AccessibilityInfo.announceForAccessibility(
          `${optionId === step.correctOptionId ? "正解" : "不正解"}。${selectedDefinition.feedback}`
        );
      }
    }

    setError(null);
    setLessonSnapshot(selected.snapshot);
    setSaving(true);
    const generation = userScopeGenerationRef.current;
    try {
      const saved = await saveV2GeneralizationSnapshot(
        lesson,
        userId,
        selected.snapshot
      );
      if (userScopeGenerationRef.current !== generation) return;
      setLessonSnapshot(saved);
    } catch {
      if (userScopeGenerationRef.current !== generation) return;
      setLessonSnapshot(snapshot);
      setError("選択を端末へ保存できませんでした。もう一度試してください。");
    } finally {
      if (userScopeGenerationRef.current === generation) setSaving(false);
    }
  };

  const goToNextLessonOrHub = () => {
    const lessonIndex = V2_GENERALIZATION_LESSONS.findIndex(
      (candidate) => candidate.id === lesson.id
    );
    const nextLesson = V2_GENERALIZATION_LESSONS[lessonIndex + 1];
    setError(null);
    setActiveLessonId(nextLesson?.id ?? null);
  };

  const handlePrimary = async () => {
    if (saving) return;
    if (step.kind === "complete") {
      goToNextLessonOrHub();
      return;
    }

    const advanced = advanceV2GeneralizationFlow(snapshot, lesson);
    if (advanced.status === "blocked") return;

    const candidate =
      advanced.status === "incorrect"
        ? retryV2GeneralizationStep(advanced.snapshot, lesson).snapshot
        : advanced.snapshot;

    setSaving(true);
    setError(null);
    const generation = userScopeGenerationRef.current;
    try {
      const saved = await saveV2GeneralizationSnapshot(
        lesson,
        userId,
        candidate
      );
      if (userScopeGenerationRef.current !== generation) return;
      setLessonSnapshot(saved);
    } catch {
      if (userScopeGenerationRef.current !== generation) return;
      setError("進捗を端末へ保存できませんでした。もう一度試してください。");
    } finally {
      if (userScopeGenerationRef.current === generation) setSaving(false);
    }
  };

  const resetLesson = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const generation = userScopeGenerationRef.current;
    try {
      await resetV2GeneralizationSnapshot(lesson, userId);
      if (userScopeGenerationRef.current !== generation) return;
      setLessonSnapshot(createInitialV2GeneralizationSnapshot(lesson));
    } catch {
      if (userScopeGenerationRef.current !== generation) return;
      setError("このレッスンをリセットできませんでした。");
    } finally {
      if (userScopeGenerationRef.current === generation) setSaving(false);
    }
  };

  const selectedOptionId =
    step.kind === "capture" || step.kind === "scored"
      ? snapshot.answers[step.id]
      : null;
  const selectedScoredOption =
    step.kind === "scored" && selectedOptionId
      ? step.options.find((option) => option.id === selectedOptionId) ?? null
      : null;
  const selectedIsCorrect =
    step.kind === "scored" && selectedOptionId
      ? selectedOptionId === step.correctOptionId
      : null;
  const canContinue =
    step.kind === "evidence" ||
    step.kind === "complete" ||
    Boolean(selectedOptionId);
  const stepIndex = V2_GENERALIZATION_STEP_IDS.indexOf(snapshot.currentStep);
  const stepNumber = stepIndex + 1;
  const progress = stepNumber / V2_GENERALIZATION_STEP_IDS.length;
  const lessonIndex = V2_GENERALIZATION_LESSONS.findIndex(
    (candidate) => candidate.id === lesson.id
  );
  const hasNextLesson = lessonIndex < V2_GENERALIZATION_LESSONS.length - 1;
  const primaryLabel =
    step.kind === "complete"
      ? hasNextLesson
        ? "次のレッスン"
        : "3つの結果を見る"
      : selectedIsCorrect === false
        ? "もう一度"
        : "次へ";

  return (
    <SafeAreaView
      style={styles.container}
      testID={`v2g-player-${lesson.id}`}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <StarBackground />
      </View>

      <View style={styles.playerHeader}>
        <Pressable
          accessibilityLabel="レッスン一覧へ戻る"
          accessibilityRole="button"
          onPress={() => {
            if (saving) return;
            setError(null);
            setActiveLessonId(null);
          }}
          style={styles.iconButton}
          testID="v2g-close"
        >
          <Ionicons color="rgba(255,255,255,0.82)" name="close" size={25} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerLabelRow}>
            <Text numberOfLines={1} style={styles.headerLessonTitle}>
              {lesson.title}
            </Text>
            <Text style={styles.headerStep}>
              {stepNumber} / {V2_GENERALIZATION_STEP_IDS.length}
            </Text>
          </View>
          <View
            accessibilityLabel={`レッスン進捗 ${stepNumber} / ${V2_GENERALIZATION_STEP_IDS.length}`}
            accessibilityRole="progressbar"
            accessibilityValue={{
              max: V2_GENERALIZATION_STEP_IDS.length,
              min: 0,
              now: stepNumber,
            }}
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.playerContent}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <StepContent
          disabled={saving}
          lesson={lesson}
          onSelect={(optionId) => void selectOption(optionId)}
          snapshot={snapshot}
          step={step}
        />
      </ScrollView>

      <View style={styles.footer}>
        {selectedScoredOption ? (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.feedbackDock,
              selectedIsCorrect
                ? styles.feedbackDockCorrect
                : styles.feedbackDockWrong,
            ]}
            testID={`v2g-feedback-${step.id}`}
          >
            <Ionicons
              color={selectedIsCorrect ? SUCCESS : ERROR}
              name={selectedIsCorrect ? "checkmark-circle" : "close-circle"}
              size={21}
            />
            <View style={styles.feedbackCopy}>
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: selectedIsCorrect ? SUCCESS : ERROR },
                ]}
              >
                {selectedIsCorrect ? "境界内" : "まだ越境している"}
              </Text>
              <Text style={styles.feedbackText}>{selectedScoredOption.feedback}</Text>
            </View>
          </View>
        ) : null}

        {error ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue || saving }}
          disabled={!canContinue || saving}
          onPress={() => void handlePrimary()}
          style={({ pressed }) => [
            styles.primaryButton,
            (!canContinue || saving) && styles.primaryButtonDisabled,
            pressed && canContinue && !saving && styles.primaryPressed,
          ]}
          testID={`v2g-primary-${step.id}`}
        >
          {saving ? (
            <ActivityIndicator color="#160610" />
          ) : (
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          )}
        </Pressable>

        {step.kind === "complete" ? (
          <Pressable
            accessibilityLabel="このレッスンを最初からやり直す"
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            onPress={() => void resetLesson()}
            style={styles.resetButton}
            testID="v2g-reset"
          >
            <Ionicons color="rgba(255,255,255,0.54)" name="refresh" size={17} />
            <Text style={styles.resetText}>このレッスンをもう一度</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
    gap: 14,
  },
  loadingText: {
    color: theme.colors.sub,
    fontSize: 14,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  hubHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(4,8,18,0.88)",
  },
  playerHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(4,8,18,0.88)",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  hubHeaderTitle: {
    flex: 1,
    textAlign: "center",
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  headerCenter: {
    flex: 1,
    gap: 7,
  },
  headerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLessonTitle: {
    flex: 1,
    color: "rgba(255,255,255,0.76)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },
  headerStep: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  progressTrack: {
    height: 4,
    overflow: "hidden",
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  progressFill: {
    height: 4,
    borderRadius: 99,
    backgroundColor: ACCENT,
  },
  hubContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },
  hubIntro: {
    gap: 10,
    marginBottom: 22,
  },
  eyebrow: {
    color: ACCENT,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 1.15,
  },
  hubTitle: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  hubBody: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
  },
  hubSummary: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.24)",
    backgroundColor: ACCENT_SOFT,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  summaryValue: {
    marginTop: 3,
    color: "#fff",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
  skillPill: {
    minHeight: 34,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 99,
    backgroundColor: "rgba(4,8,18,0.44)",
  },
  skillPillText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "800",
  },
  hubError: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "rgba(251,113,133,0.12)",
  },
  hubErrorText: {
    flex: 1,
    color: ERROR,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  topicList: {
    gap: 11,
  },
  topicCard: {
    minHeight: 106,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(25,31,56,0.80)",
  },
  topicCardComplete: {
    borderColor: "rgba(52,211,153,0.22)",
    backgroundColor: "rgba(15,55,52,0.52)",
  },
  topicIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(236,72,153,0.13)",
  },
  topicIconComplete: {
    backgroundColor: "rgba(52,211,153,0.13)",
  },
  topicCopy: {
    flex: 1,
    gap: 3,
  },
  topicMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topicNumber: {
    color: "rgba(255,255,255,0.36)",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  topicStatus: {
    color: ACCENT,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },
  topicStatusComplete: {
    color: SUCCESS,
  },
  topicStatusReadFailed: {
    color: ERROR,
  },
  topicTitle: {
    color: "rgba(255,255,255,0.96)",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  topicSubtitle: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  playerContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  intro: {
    gap: 7,
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.55,
  },
  body: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  surface: {
    padding: 15,
    marginBottom: 12,
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(25,31,56,0.80)",
  },
  surfaceAccent: {
    borderColor: "rgba(236,72,153,0.30)",
    backgroundColor: ACCENT_SOFT,
  },
  surfacePurple: {
    borderColor: "rgba(167,139,250,0.25)",
    backgroundColor: "rgba(80,61,145,0.18)",
  },
  surfaceSuccess: {
    borderColor: "rgba(52,211,153,0.25)",
    backgroundColor: "rgba(16,78,69,0.25)",
  },
  sceneLabel: {
    color: PURPLE,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  sceneText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  captureRow: {
    flexDirection: "row",
    gap: 8,
  },
  captureOption: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  captureOptionText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  optionSelected: {
    borderColor: ACCENT,
    backgroundColor: "rgba(236,72,153,0.22)",
  },
  optionTextSelected: {
    color: "#fff",
  },
  scoredOptions: {
    gap: 9,
  },
  scoredOption: {
    minHeight: 54,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(25,31,56,0.78)",
  },
  optionIndex: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  optionIndexSelected: {
    backgroundColor: ACCENT,
  },
  optionIndexText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "900",
  },
  optionIndexTextSelected: {
    color: "#160610",
  },
  scoredOptionText: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  prompt: {
    marginTop: 2,
    marginBottom: 10,
    color: "rgba(255,255,255,0.92)",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "900",
  },
  claimCard: {
    paddingVertical: 12,
  },
  headlineCard: {
    paddingVertical: 12,
  },
  claimLabel: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  claimSource: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  headlineText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },
  evidenceCard: {
    paddingVertical: 11,
    gap: 0,
  },
  frameRow: {
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  frameLabel: {
    width: 34,
    color: PURPLE,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "900",
  },
  frameValue: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  caveatDivider: {
    height: 7,
  },
  caveatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  caveatText: {
    flex: 1,
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  sourceList: {
    marginTop: 4,
    gap: 2,
  },
  sourceLink: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sourceLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  completeHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  completeIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(52,211,153,0.12)",
  },
  completeLabel: {
    color: SUCCESS,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  takeaway: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700",
  },
  actionLabel: {
    color: ACCENT,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  optionalRow: {
    marginTop: 2,
    marginBottom: 10,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  optionalText: {
    flex: 1,
    color: "rgba(255,255,255,0.54)",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  disclaimer: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
  nextQuestionRow: {
    marginTop: 12,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  nextQuestion: {
    flex: 1,
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(4,8,18,0.96)",
  },
  feedbackDock: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderRadius: 13,
    borderWidth: 1,
  },
  feedbackDockCorrect: {
    borderColor: "rgba(52,211,153,0.25)",
    backgroundColor: "rgba(16,78,69,0.26)",
  },
  feedbackDockWrong: {
    borderColor: "rgba(251,113,133,0.25)",
    backgroundColor: "rgba(127,29,29,0.20)",
  },
  feedbackCopy: {
    flex: 1,
    gap: 2,
  },
  feedbackTitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },
  feedbackText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  errorText: {
    color: ERROR,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.13)",
    shadowOpacity: 0,
  },
  primaryPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: "#160610",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
  resetButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  resetText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.76,
  },
});
