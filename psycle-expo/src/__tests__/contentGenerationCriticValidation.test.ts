import { evaluateQuestion, parseCriticResult } from "../../scripts/content-generator/src/critic";
import type { GeneratedQuestion } from "../../scripts/content-generator/src/types";

const baseQuestion: GeneratedQuestion = {
  id: "q_test_001",
  phase: 2,
  type: "multiple_choice",
  question: "会議で意見を言う前に、まず何を確認する？",
  choices: ["相手の反応", "声の大きさ", "資料の色", "席順"],
  correct_index: 0,
  explanation: "まず相手の反応を観察すると、対話の質が上がりやすい。",
  actionable_advice: "💡 今日のアクション：今日1回、30秒だけ相手の表情を観察してから話す。",
  difficulty: "medium",
  xp: 10,
  source_id: "seed_001",
  evidence_grade: "gold",
};

function createGenAIMock(payloadText: string) {
  return {
    getGenerativeModel: () => ({
      generateContent: async () => ({
        response: {
          text: () => payloadText,
        },
      }),
    }),
  };
}

describe("content-generator critic payload validation", () => {
  test("parseCriticResult returns parsed object on valid payload", () => {
    const parsed = parseCriticResult({
      passed: true,
      violations: {
        scientific_integrity: false,
        ux_standards: false,
        success_granularity: false,
        evidence_template: false,
        life_scene_first: false,
        no_level_collapse: false,
        user_can_be_right: false,
        psychoeducation_first: false,
        citation_reality: false,
        mechanism_over_outcome: false,
        claim_evidence_binding: false,
        dose_and_timebox: false,
        counterexample_first: false,
        vocabulary_hygiene: false,
      },
      feedback: "OK",
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.feedback).toBe("OK");
  });

  test("evaluateQuestion recomputes passed=false when violation exists", async () => {
    const genAI = createGenAIMock(
      JSON.stringify({
        passed: true,
        violations: {
          scientific_integrity: true,
          ux_standards: false,
          success_granularity: false,
          evidence_template: false,
          life_scene_first: false,
          no_level_collapse: false,
          user_can_be_right: false,
          psychoeducation_first: false,
          citation_reality: false,
          mechanism_over_outcome: false,
          claim_evidence_binding: false,
          dose_and_timebox: false,
          counterexample_first: false,
          vocabulary_hygiene: false,
        },
        feedback: "has violation",
      })
    );

    const result = await evaluateQuestion(genAI as never, baseQuestion);
    expect(result.passed).toBe(false);
    expect(result.violations?.scientific_integrity).toBe(true);
  });

  test("parseCriticResult returns null on invalid violations shape", () => {
    const parsed = parseCriticResult({
      passed: true,
      violations: {
        scientific_integrity: "true",
      },
      feedback: "invalid",
    });

    expect(parsed).toBeNull();
  });

  test("evaluateQuestion throws when critic payload is invalid", async () => {
    const genAI = createGenAIMock("{}");
    await expect(evaluateQuestion(genAI as never, baseQuestion)).rejects.toThrow("Invalid critic payload");
  });
});
