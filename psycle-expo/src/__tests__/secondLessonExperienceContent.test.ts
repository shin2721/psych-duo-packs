import curatedSources from "../../data/curated_sources.json";
import mentalEvidence from "../../data/lessons/mental_units/mental_l02.evidence.json";
import mentalLesson from "../../data/lessons/mental_units/mental_l02.ja.json";
import { getLessonRuntimeMetadata } from "../../lib/lesson-data/lessonMetadata";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

describe("mental_l02 rescue lesson", () => {
  test("keeps one authored six-step arc without swipe grading", () => {
    expect(mentalLesson).toHaveLength(6);
    expect(mentalLesson.map((question) => question.id)).toEqual([
      "mental_l02_001",
      "mental_l02_002",
      "mental_l02_003",
      "mental_l02_004",
      "mental_l02_005",
      "mental_l02_006",
    ]);
    expect(mentalLesson.map((question) => question.phase)).toEqual([1, 2, 3, 3, 4, 5]);
    expect(mentalLesson.map((question) => question.type)).not.toContain("swipe_judgment");
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

  test("traces every question to an allowed source and bounded claim", () => {
    const sourceRegistry = curatedSources.sources as Record<string, unknown>;

    for (const question of mentalLesson) {
      expect(question.claim_id).toMatch(/^mental_l02_\d{3}_claim$/);
      expect(sourceRegistry[question.source_id]).toBeDefined();
      expect(question.evidence_grade).toBe("bronze");
      expect(question.expanded_details.claim_type).toBeTruthy();
      expect(question.expanded_details.evidence_type).toBeTruthy();
      expect(question.expanded_details.citation_role).toBeTruthy();
    }
  });

  test("gives every graded step an authored immediate correction hint", () => {
    const gradedQuestions = mentalLesson.filter((question) => "correct_index" in question);

    expect(gradedQuestions).toHaveLength(4);
    for (const question of gradedQuestions) {
      expect(question.feedback_prompt).toBeTruthy();
    }
  });

  test("preserves the scored-prediction insight and safety boundary", () => {
    const serialized = JSON.stringify(mentalLesson);
    const scoredPrediction = mentalLesson.find((question) => question.id === "mental_l02_003");
    const caveat = mentalLesson.find((question) => question.id === "mental_l02_004");
    const transfer = mentalLesson.find((question) => question.id === "mental_l02_006");

    expect(serialized).toContain("採点されない予言は無敗");
    expect(serialized).toContain("事実は？ 予言は？ いつ答え合わせ？");
    expect(serialized).not.toContain("一次評価");
    expect(serialized).not.toContain("二次評価");
    expect(scoredPrediction?.choices[scoredPrediction.correct_index]).toBe(
      "10:10までに最後のスライドへ到達できない"
    );
    expect(scoredPrediction?.choices[scoredPrediction.correct_index]).not.toContain("30秒");
    expect(caveat?.explanation).toContain("直接確かめられたわけではなく");
    expect(caveat?.explanation).toContain("専門家から指示された対応は待たない");
    expect(caveat?.choices[caveat.correct_index]).toBe("資料の締切が今日17時と明記されている");
    expect(transfer?.question).toContain("『明日の食事は断られる』");
    expect(transfer?.choices[transfer.correct_index]).toContain("『明日の食事は行けない』");
    expect(transfer?.choices[transfer.correct_index]).toContain("返信通知が来て内容を読んだ時");
    expect(transfer?.choices[transfer.correct_index]).not.toContain("確認");
    expect(transfer?.explanation).toContain("こちらから確認を増やさない");
  });

  test("shows the authored final action on completion", () => {
    const metadata = getLessonRuntimeMetadata("mental_l02");
    const recapAction = resolveCompletionRecapAction(mentalLesson as Question[], "fallback");

    expect(recapAction).toBe(metadata?.takeaway_action);
    expect(recapAction).toContain("10秒");
  });

  test("keeps the rebuilt package in staging until owner taste approval", () => {
    expect(mentalEvidence.review.human_approved).toBe(false);
    expect(mentalEvidence.content_package.state).toBe("staging");
    expect(mentalEvidence.content_package.readiness.quality_gate_pass).toBe(false);
    expect(mentalEvidence.content_package.review_decision.human_review_required).toBe(true);
  });
});
