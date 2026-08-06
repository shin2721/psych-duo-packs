import curatedSources from "../../data/curated_sources.json";
import mentalEvidence from "../../data/lessons/mental_units/mental_l03.evidence.json";
import mentalLesson from "../../data/lessons/mental_units/mental_l03.ja.json";
import { getLessonRuntimeMetadata } from "../../lib/lesson-data/lessonMetadata";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

describe("mental_l03 body signal and forecast pilot", () => {
  test("replaces the old ten-question intervention sampler with one authored five-step arc", () => {
    expect(mentalLesson).toHaveLength(5);
    expect(mentalLesson.map((question) => question.id)).toEqual([
      "mental_l03_001",
      "mental_l03_002",
      "mental_l03_003",
      "mental_l03_004",
      "mental_l03_005",
    ]);
    expect(mentalLesson.map((question) => question.phase)).toEqual([1, 2, 3, 4, 5]);

    const serialized = JSON.stringify(mentalLesson);
    for (const retiredCopy of [
      "ラベリング",
      "呼吸法",
      "準備運動",
      "不安が1下がれば",
      "Gross_1998",
      "Jamieson_2012",
    ]) {
      expect(serialized).not.toContain(retiredCopy);
    }
  });

  test("keeps every claim on the registered bronze GRE source", () => {
    const sourceRegistry = curatedSources.sources as Record<string, unknown>;

    for (const question of mentalLesson) {
      expect(question.claim_id).toMatch(/^mental_l03_\d{3}_claim$/);
      expect(question.source_id).toBe("Jamieson_2010_GRE");
      expect(sourceRegistry[question.source_id]).toBeDefined();
      expect(question.evidence_grade).toBe("bronze");
      expect(question.expanded_details.claim_type).toBeTruthy();
      expect(question.expanded_details.evidence_type).toBeTruthy();
      expect(question.expanded_details.citation_role).toBeTruthy();
    }
  });

  test("states the research limits without inventing a calm-down comparison", () => {
    const researchReveal = mentalLesson[1];
    const researchCopy = JSON.stringify(researchReveal);

    expect(researchCopy).toContain("募集60人");
    expect(researchCopy).toContain("28人");
    expect(researchCopy).toContain("言語得点には差がなかった");
    expect(researchCopy).toContain("『落ち着こうとした群』との比較ではなく");
    expect(researchCopy).toContain("面接やプレゼン");
    expect(researchCopy).not.toContain("落ち着こうとした群より");
  });

  test("puts the safety boundary before personal practice and unseen transfer", () => {
    const boundaryIndex = mentalLesson.findIndex((question) => question.id === "mental_l03_003");
    const personalPracticeIndex = mentalLesson.findIndex(
      (question) => question.id === "mental_l03_004"
    );
    const transferIndex = mentalLesson.findIndex((question) => question.id === "mental_l03_005");
    const boundaryCopy = JSON.stringify(mentalLesson[boundaryIndex]);

    expect(boundaryIndex).toBeLessThan(personalPracticeIndex);
    expect(boundaryIndex).toBeLessThan(transferIndex);
    expect(boundaryCopy).toContain("初めての強い胸の圧迫感");
    expect(boundaryCopy).toContain("失神しそう");
    expect(boundaryCopy).toContain("119番へ");
    expect(boundaryCopy).toContain("♯7119");
    expect(boundaryCopy).toContain("ファイルが壊れているなら");
    expect(boundaryCopy).toContain("迷ったら、読み替えない側へ");
  });

  test("keeps the personal phrase choice neutral and scores only transferable judgments", () => {
    const personalPractice = mentalLesson[3];
    const gradedQuestions = mentalLesson.filter((question) => "correct_index" in question);

    expect(personalPractice.type).toBe("conversation");
    expect(personalPractice.recommended_index).toBeNull();
    expect("correct_index" in personalPractice).toBe(false);
    expect(personalPractice.choices).toContain("今回はどれも使わない");
    expect(gradedQuestions).toHaveLength(4);
    for (const question of gradedQuestions) {
      expect(question.feedback_prompt).toBeTruthy();
      expect(question.bet_card).toBe(true);
    }
  });

  test("separates the pre-play hook from the final small action", () => {
    const metadata = getLessonRuntimeMetadata("mental_l03");
    const recapAction = resolveCompletionRecapAction(mentalLesson as Question[], "fallback");

    expect(metadata?.sequence_policy).toBe("authored");
    expect(metadata?.locale_scope).toEqual(["ja"]);
    expect(metadata?.question_count_range.target).toBe(5);
    expect(metadata?.preview_prompt).toBe("心臓が速いことは、失敗がもう決まった証拠？");
    expect(metadata?.preview_prompt).not.toContain("速報");
    expect(metadata?.preview_prompt).not.toContain("予報");
    expect(recapAction).toBe(metadata?.takeaway_action);
    expect(recapAction).toBe("体は？　予報は？　最初の一手は？");
  });

  test("labels the final screen as same-session practice rather than delayed transfer proof", () => {
    const finalQuestionCopy = JSON.stringify(mentalLesson[4]);

    expect(finalQuestionCopy).toContain("same_session_transfer_practice");
    expect(finalQuestionCopy).not.toContain("unseen_transfer");
    expect(getLessonRuntimeMetadata("mental_l03")?.done_condition).toContain("同一セッション");
  });

  test("keeps the rebuilt package out of production until taste, science, and safety review", () => {
    expect(mentalEvidence.review.human_approved).toBe(false);
    expect(mentalEvidence.review.auto_approved).toBe(false);
    expect(mentalEvidence.promotion.eligible).toBe(false);
    expect(mentalEvidence.promotion.reasons).toEqual(
      expect.arrayContaining([
        "owner_runtime_taste_pending",
        "human_science_review_pending",
        "clinical_safety_review_pending",
      ])
    );
    expect(mentalEvidence.content_package.state).toBe("staging");
    expect(mentalEvidence.content_package.readiness.quality_gate_pass).toBe(false);
    expect(mentalEvidence.content_package.review_decision.human_review_required).toBe(true);
  });
});
