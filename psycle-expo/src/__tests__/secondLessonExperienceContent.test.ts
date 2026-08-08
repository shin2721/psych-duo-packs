import curatedSources from "../../data/curated_sources.json";
import mentalEvidence from "../../data/lessons/mental_units/mental_l02.evidence.json";
import mentalLesson from "../../data/lessons/mental_units/mental_l02.ja.json";
import { getLessonRuntimeMetadata } from "../../lib/lesson-data/lessonMetadata";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

describe("mental_l02 worry accuracy lesson", () => {
  test("keeps one authored six-step arc", () => {
    expect(mentalLesson).toHaveLength(6);
    expect(mentalLesson.map((question) => question.id)).toEqual([
      "mental_l02_001",
      "mental_l02_002",
      "mental_l02_003",
      "mental_l02_004",
      "mental_l02_005",
      "mental_l02_006",
    ]);
    expect(mentalLesson.map((question) => question.phase)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(mentalLesson.every((question) => question.bet_card === true)).toBe(true);
  });

  test("keeps self-observation conversations neutral", () => {
    const conversations = mentalLesson.filter(
      (question) => question.type === "conversation"
    ) as Array<{ recommended_index: null }>;

    expect(conversations).toHaveLength(2);
    for (const question of conversations) {
      expect(question.recommended_index).toBeNull();
      expect("correct_index" in question).toBe(false);
    }
  });

  test("traces every question to a registered source", () => {
    const sourceRegistry = curatedSources.sources as Record<string, unknown>;

    for (const question of mentalLesson) {
      expect(question.claim_id).toMatch(/^mental_l02_\d{3}_claim$/);
      expect(sourceRegistry[question.source_id]).toBeDefined();
      expect(question.evidence_grade).toBe("bronze");
      expect(question.expanded_details.citation_role).toBeTruthy();
    }
  });

  test("bets on the core number before revealing it", () => {
    const bet = mentalLesson.find((question) => question.id === "mental_l02_002");

    expect(bet?.type).toBe("number_bet");
    expect(bet?.bet_answer).toBe(9);
    expect(bet?.bet_min).toBe(0);
    expect(bet?.bet_max).toBe(100);
    // 数字はスライダーで賭けた後にだけ出る。設問側で答えを漏らさない。
    expect(bet?.question).not.toContain("91");
    expect(bet?.question).not.toContain("8.6");
    // 種明かしの後にただし書きが続く(前置きしない)。
    expect(bet?.explanation).toContain("8.6%");
    expect(bet?.explanation).toContain("追試はまだない");
    expect(bet?.explanation).toContain("悲観の側へ体系的にズレやすい");
    expect(bet?.explanation).not.toContain("あなたの心配も9割外れる、と言える");
  });

  test("keeps the honest edge on realized worries", () => {
    const split = mentalLesson.find((question) => question.id === "mental_l02_003");

    expect(split?.choices[split.correct_index]).toBe("約4分の1");
    expect(split?.explanation).toContain("25.8%");
    expect(split?.explanation).toContain("30.1%");
    expect(split?.explanation).toContain("「心配しなくていい」という話ではない");
  });

  test("explains why unscored predictions survive, backed by the RCT", () => {
    const mechanism = mentalLesson.find((question) => question.id === "mental_l02_004");

    expect(mechanism?.source_id).toBe("LaFreniere_Newman_2016");
    expect(mechanism?.choices[mechanism.correct_index]).toBe("心配の症状が減った");
    expect(mechanism?.explanation).toContain("負けを見せられて、はじめて力を失う");
    expect(mechanism?.explanation).toContain("誰にでも効く保証まではない");
    expect(mechanism?.actionable_advice).toContain("○×がつく一文");
  });

  test("puts the safety boundary before the commitment card", () => {
    const ids = mentalLesson.map((question) => question.id);
    expect(ids.indexOf("mental_l02_005")).toBeLessThan(ids.indexOf("mental_l02_006"));

    const boundary = mentalLesson.find((question) => question.id === "mental_l02_005");
    expect(boundary?.choices[boundary.correct_index]).toBe("請求書の支払期限が、今日の17時");
    // 判定基準を選択肢に埋め込むと読み取りで解けてしまう。
    expect(boundary?.choices.join("")).not.toContain("事実");
    expect(boundary?.choices.join("")).not.toContain("明記");
    expect(boundary?.explanation).toContain("体の新しい強い異変");
  });

  test("never overgeneralizes the number or promises less anxiety", () => {
    const shownCopy = mentalLesson
      .map((question) =>
        [question.question, question.explanation, question.actionable_advice ?? ""].join("\n")
      )
      .join("\n");

    expect(shownCopy).not.toContain("心配は無駄");
    expect(shownCopy).not.toContain("不安が下がる");
    expect(shownCopy).not.toContain("9割は起きないから大丈夫");
    expect(shownCopy).not.toContain("コーネル");
  });

  test("shows the authored final action on completion", () => {
    const metadata = getLessonRuntimeMetadata("mental_l02");
    const recapAction = resolveCompletionRecapAction(mentalLesson as Question[], "fallback");

    expect(recapAction).toBe(metadata?.takeaway_action);
    expect(recapAction).toContain("採点日");
  });

  test("keeps the rebuilt package in staging until owner taste approval", () => {
    expect(mentalEvidence.review.human_approved).toBe(false);
    expect(mentalEvidence.content_package.state).toBe("staging");
    expect(mentalEvidence.content_package.readiness.quality_gate_pass).toBe(false);
    expect(mentalEvidence.content_package.review_decision.human_review_required).toBe(true);
  });
});
