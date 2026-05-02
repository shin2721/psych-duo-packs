import { evaluateDeterministicGate } from "../../scripts/content-generator/src/deterministicGate";
import type { ExistingLessonSignature } from "../../scripts/content-generator/src/evidencePolicy";
import type { GeneratedQuestion } from "../../scripts/content-generator/src/types";

function makeQuestion(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  const base: GeneratedQuestion = {
    id: "test_q_001",
    phase: 1,
    type: "swipe_judgment",
    question: "会議の5分前、あなたはSlackで『まだですか？』という催促メッセージを見た。",
    is_true: true,
    swipe_labels: {
      left: "急いで返す",
      right: "5分待つ",
    },
    explanation: "焦ると判断を誤ることがある。",
    actionable_advice: "今日5分だけ待ってから返信し、1回だけ深呼吸する。",
    difficulty: "medium",
    xp: 15,
    source_id: "src_001",
    claim_id: "claim_001",
    source_type: "systematic_review",
    source_span: "results p.4-5",
    review_date: "2026-04-20",
    lane: "core",
    evidence_grade: "silver",
    lesson_blueprint: {
      job: "焦った直後の反応を1回止める",
      target_shift: "急いで返すから一拍置けるへ移す",
      done_condition: "急いで返す前に1回止まれる",
      takeaway_action: "5分だけ待って返信する",
      counterfactual: "急いで返すと不要な摩擦が増えやすい",
      intervention_path: "通知を見た直後に5分だけ待ってから返す",
      lane: "core",
      phase: 1,
      load_score: {
        cognitive: 2,
        emotional: 2,
        behavior_change: 2,
        total: 6,
      },
      question_count_range: {
        min: 5,
        max: 7,
        target: 6,
      },
      forbidden_moves: [],
    },
    expanded_details: {
      claim_type: "observation",
      evidence_type: "systematic_review",
      citation_role: "supports the shift from reflex to pause",
      best_for: ["返信前に焦りやすい人"],
      limitations: ["強い緊急対応が必要な場面には不向き"],
    },
    ...overrides,
  };
  return base;
}

const existingLessonSignatures: ExistingLessonSignature[] = [
  {
    file: "/tmp/existing-lesson.json",
    lane: "core",
    lesson_job: "焦った直後の反応を1回止める",
    target_shift: "急いで返すから一拍置けるへ移す",
    takeaway_action: "5分だけ待って返信する",
  },
];

const existingRefreshSignatures: ExistingLessonSignature[] = [
  {
    file: "/tmp/existing-refresh.json",
    lane: "refresh",
    lesson_job: "焦った直後の反応を1回止める",
    target_shift: "急いで返すから一拍置けるへ移す",
    takeaway_action: "5分だけ待って返信する",
    refresh_value_reason: "safety_update",
  },
];

describe("content-generator deterministic gate", () => {
  test("fails when FAIL vocabulary is present", () => {
    const question = makeQuestion({
      explanation: "この方法で人生が変わる。",
    });
    const result = evaluateDeterministicGate(question, { expectedDomain: "mental" });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("vocabulary_fail_words");
  });

  test("fails when phase/type mapping is invalid", () => {
    const question = makeQuestion({
      phase: 4,
      type: "multiple_choice",
      choices: ["A", "B", "C", "D"],
      correct_index: 0,
    });
    const result = evaluateDeterministicGate(question, { expectedDomain: "work" });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("phase_type_mismatch");
  });

  test("fails when principle naming appears in question front half", () => {
    const question = makeQuestion({
      question: "返報性の原理とは何かを考えたあと、あなたはどう行動する？",
    });
    const result = evaluateDeterministicGate(question, { expectedDomain: "social" });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("principle_direct_naming");
  });

  test("passes on valid deterministic input", () => {
    const question = makeQuestion();
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "study",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures: [],
    });

    expect(result.passed).toBe(true);
    expect(result.hardViolations).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test("fails when domain is missing", () => {
    const question = makeQuestion();
    const result = evaluateDeterministicGate(question);

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("domain_missing_or_unknown");
  });

  test("adds warning when scene specificity is weak", () => {
    const question = makeQuestion({
      question: "最近、なんとなく気分が重い。",
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures: [],
    });

    expect(result.passed).toBe(true);
    expect(result.hardViolations).toHaveLength(0);
    expect(result.warnings).toContain("scene_specificity_weak");
  });

  test("adds warning when actionable advice lacks timebox or dose", () => {
    const question = makeQuestion({
      actionable_advice: "落ち着いて相手に対応することを意識する。",
    });
    const result = evaluateDeterministicGate(question, { expectedDomain: "work" });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("action_timebox_or_dose_missing");
  });

  test("fails when 必ず appears outside debunking context", () => {
    const question = makeQuestion({
      explanation: "この方法は必ずうまくいく。",
      is_true: true,
    });
    const result = evaluateDeterministicGate(question, { expectedDomain: "mental" });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("vocabulary_fail_words_conditional");
  });

  test("warns when 必ず appears in debunking swipe context", () => {
    const question = makeQuestion({
      explanation: "『必ず』は危険な断定表現だ。",
      is_true: false,
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures: [],
    });

    expect(result.passed).toBe(true);
    expect(result.hardViolations).toHaveLength(0);
    expect(result.warnings).toContain("vocabulary_warn_conditional");
  });

  test("fails when lesson blueprint duplicates existing lesson signatures", () => {
    const question = makeQuestion();
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures,
    });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("duplicate_lesson_job:/tmp/existing-lesson.json");
    expect(result.hardViolations).toContain("duplicate_target_shift:/tmp/existing-lesson.json");
    expect(result.hardViolations).toContain("duplicate_takeaway_action:/tmp/existing-lesson.json");
  });

  test("fails when only the scene wording changes but learning value is the same", () => {
    const question = makeQuestion({
      lesson_blueprint: {
        ...makeQuestion().lesson_blueprint!,
        job: "Slackの催促を見た直後の反応を1回止める",
      },
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures,
    });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("scene_only_change:/tmp/existing-lesson.json");
  });

  test("fails when novelty check is enabled and lesson blueprint target shift is missing", () => {
    const question = makeQuestion({
      lesson_blueprint: {
        ...makeQuestion().lesson_blueprint!,
        target_shift: "",
      },
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures: [],
    });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("lesson_blueprint_target_shift_missing");
  });

  test("fails when refresh lane is missing refresh value reason", () => {
    const question = makeQuestion({
      lane: "refresh",
      lesson_blueprint: {
        ...makeQuestion().lesson_blueprint!,
        lane: "refresh",
        refresh_value_reason: undefined,
      },
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures: [],
    });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("refresh_value_reason_missing");
  });

  test("fails when mastery lane is missing novelty reason", () => {
    const question = makeQuestion({
      lane: "mastery",
      lesson_blueprint: {
        ...makeQuestion().lesson_blueprint!,
        lane: "mastery",
        novelty_reason: undefined,
      },
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures: [],
    });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("mastery_without_novelty_reason");
  });

  test("passes on mastery lane when novelty reason is present", () => {
    const question = makeQuestion({
      lane: "mastery",
      lesson_blueprint: {
        ...makeQuestion().lesson_blueprint!,
        lane: "mastery",
        novelty_reason: "judgment_change",
      },
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures: [],
    });

    expect(result.passed).toBe(true);
    expect(result.hardViolations).toHaveLength(0);
  });

  test("fails when mastery is only a core rewrite with scene-only change", () => {
    const question = makeQuestion({
      lane: "mastery",
      lesson_blueprint: {
        ...makeQuestion().lesson_blueprint!,
        lane: "mastery",
        novelty_reason: "scene_change",
        job: "Slackの催促を見た直後の反応を1回止める",
      },
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures,
    });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("scene_only_change:/tmp/existing-lesson.json");
    expect(result.hardViolations).toContain("mastery_is_core_rewrite:/tmp/existing-lesson.json");
  });

  test("passes on refresh lane when refresh value reason is present", () => {
    const question = makeQuestion({
      lane: "refresh",
      lesson_blueprint: {
        ...makeQuestion().lesson_blueprint!,
        lane: "refresh",
        refresh_value_reason: "intervention_update",
      },
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures: [],
    });

    expect(result.passed).toBe(true);
    expect(result.hardViolations).toHaveLength(0);
  });

  test("fails when a lower-priority refresh beats an existing higher-priority refresh", () => {
    const question = makeQuestion({
      lane: "refresh",
      lesson_blueprint: {
        ...makeQuestion().lesson_blueprint!,
        lane: "refresh",
        refresh_value_reason: "scene_update",
      },
    });
    const result = evaluateDeterministicGate(question, {
      expectedDomain: "mental",
      requireClaimTrace: true,
      requireNoveltyCheck: true,
      existingLessonSignatures: existingRefreshSignatures,
    });

    expect(result.passed).toBe(false);
    expect(result.hardViolations).toContain("lower_priority_refresh_beat:/tmp/existing-refresh.json");
  });
});
