import { evaluateDeterministicGate } from "../../scripts/content-generator/src/deterministicGate";
import type { GeneratedQuestion } from "../../scripts/content-generator/src/types";

function makeQuestion(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  const base: GeneratedQuestion = {
    id: "test_q_001",
    phase: 1,
    type: "swipe_judgment",
    question: "会議の直前、あなたはSlackで催促メッセージを見た。",
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
    evidence_grade: "silver",
    ...overrides,
  };
  return base;
}

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
    const result = evaluateDeterministicGate(question, { expectedDomain: "study" });

    expect(result.passed).toBe(true);
    expect(result.hardViolations).toHaveLength(0);
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
    const result = evaluateDeterministicGate(question, { expectedDomain: "mental" });

    expect(result.passed).toBe(true);
    expect(result.hardViolations).toHaveLength(0);
    expect(result.warnings).toContain("scene_specificity_weak");
  });

  test("adds warning when actionable advice lacks timebox or dose", () => {
    const question = makeQuestion({
      actionable_advice: "落ち着いて相手に対応することを意識する。",
    });
    const result = evaluateDeterministicGate(question, { expectedDomain: "work" });

    expect(result.passed).toBe(true);
    expect(result.hardViolations).toHaveLength(0);
    expect(result.warnings).toContain("action_timebox_or_dose_weak");
  });
});
