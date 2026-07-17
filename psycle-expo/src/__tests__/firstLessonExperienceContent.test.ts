import curatedSources from "../../data/curated_sources.json";
import mentalEvidence from "../../data/lessons/mental_units/mental_l01.evidence.json";
import mentalLesson from "../../data/lessons/mental_units/mental_l01.ja.json";
import { getLessonRuntimeMetadata } from "../../lib/lesson-data/lessonMetadata";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

describe("mental_l01 rescue lesson", () => {
  test("keeps one authored six-step recognition arc", () => {
    expect(mentalLesson).toHaveLength(6);
    expect(mentalLesson.map((question) => question.id)).toEqual([
      "mental_l01_001",
      "mental_l01_002",
      "mental_l01_003",
      "mental_l01_004",
      "mental_l01_005",
      "mental_l01_006",
    ]);
    expect(mentalLesson.map((question) => question.phase)).toEqual([1, 2, 3, 3, 4, 5]);
    expect(mentalLesson.map((question) => question.type)).toEqual([
      "conversation",
      "multiple_choice",
      "swipe_judgment",
      "multiple_choice",
      "multiple_choice",
      "multiple_choice",
    ]);
  });

  test("keeps the opening self-observation neutral", () => {
    const opening = mentalLesson[0];

    expect(opening.type).toBe("conversation");
    expect(opening.recommended_index).toBeNull();
    expect("correct_index" in opening).toBe(false);
    expect(opening.explanation).toContain("強さではなく、どこで確認できるか");
  });

  test("gives every graded step an authored immediate correction hint", () => {
    const gradedQuestions = mentalLesson.slice(1);

    expect(gradedQuestions).toHaveLength(5);
    for (const question of gradedQuestions) {
      expect(question.feedback_prompt).toBeTruthy();
    }
  });

  test("teaches one body-signal lens without stealing later lessons", () => {
    const serialized = JSON.stringify(mentalLesson);
    const swipe = mentalLesson.find((question) => question.id === "mental_l01_003");
    const bowlingTransfer = mentalLesson.find((question) => question.id === "mental_l01_004");
    const finalTransfer = mentalLesson.find((question) => question.id === "mental_l01_006");
    const actionableSteps = mentalLesson.filter((question) => question.actionable_advice);

    expect(swipe).toMatchObject({
      type: "swipe_judgment",
      is_true: false,
      swipe_labels: {
        left: "判決はまだ",
        right: "結果も確定",
      },
    });
    expect(serialized).toContain("警報は鳴っている。判決はまだ。");
    expect(bowlingTransfer?.choices[bowlingTransfer.correct_index]).toContain("結果はまだ分からない");
    expect(finalTransfer?.choices[finalTransfer.correct_index]).toContain("会話がどうなるかはまだ決まっていない");
    expect(actionableSteps).toHaveLength(1);
    expect(actionableSteps[0]?.id).toBe("mental_l01_006");

    expect(serialized).not.toContain("焦りの3タイプ");
    expect(serialized).not.toContain("事実は？ 予言は？");
    expect(serialized).not.toContain("答え合わせ");
    expect(serialized).not.toContain("長い息");
    expect(serialized).not.toContain("反芻");
    expect(serialized).not.toContain("上司");
    expect(serialized).not.toContain("返信");
    expect(serialized).not.toContain("プレゼン");
  });

  test("keeps concrete danger outside the lesson lens", () => {
    const safetyStep = mentalLesson.find((question) => question.id === "mental_l01_005");

    expect(safetyStep?.choices[safetyStep.correct_index]).toBe(
      "安全な方へ離れ、駅員や避難指示に従う"
    );
    expect(safetyStep?.explanation).toContain("具体的な危険を保留する道具ではない");
    expect(safetyStep?.explanation).toContain("強い・いつもと違う症状");
    expect(safetyStep?.explanation).toContain("医療上の指示");
    expect(safetyStep?.feedback_prompt).toContain("安全対応を優先");
  });

  test("traces every question to a bounded registered source", () => {
    const sourceRegistry = curatedSources.sources as Record<string, unknown>;

    for (const question of mentalLesson) {
      expect(question.claim_id).toMatch(/^mental_l01_\d{3}_claim$/);
      expect(sourceRegistry[question.source_id]).toBeDefined();
      expect(question.evidence_grade).toBe("bronze");
      expect(question.expanded_details.claim_type).toBeTruthy();
      expect(question.expanded_details.evidence_type).toBeTruthy();
      expect(question.expanded_details.citation_role).toBeTruthy();
    }
  });

  test("shows the single authored takeaway on completion", () => {
    const metadata = getLessonRuntimeMetadata("mental_l01");
    const nextLessonMetadata = getLessonRuntimeMetadata("mental_l03");
    const recapAction = resolveCompletionRecapAction(mentalLesson as Question[], "fallback");

    expect(recapAction).toBe(metadata?.takeaway_action);
    expect(recapAction).toContain("警報は鳴っている。判決はまだ。");
    expect(metadata?.lesson_job).toBe("身体の警報と、外でまだ起きていない判決を分ける");
    expect(metadata?.question_count_range.target).toBe(6);
    expect(nextLessonMetadata?.lesson_job).toContain("次の短い行動を1つ選ぶ");
  });

  test("keeps the rebuilt package in staging until owner taste approval", () => {
    expect(mentalEvidence.review.human_approved).toBe(false);
    expect(mentalEvidence.content_package.state).toBe("staging");
    expect(mentalEvidence.content_package.readiness.quality_gate_pass).toBe(false);
    expect(mentalEvidence.content_package.review_decision.human_review_required).toBe(true);
  });
});
