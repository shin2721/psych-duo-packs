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
    expect(mentalLesson.map((question) => question.phase)).toEqual([1, 2, 3, 4, 5, 6]);
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

  test("shows the exact message before asking the reader to recall it", () => {
    const setup = mentalLesson.find((question) => question.id === "mental_l02_001");
    const recall = mentalLesson.find((question) => question.id === "mental_l02_002");

    // カード2の答え合わせの根拠はカード1の画面そのもの。文面が一字でもずれたら
    // 出題が成立しないので、両者の一致をここで固定する。
    expect(setup?.question).toContain("『明日の朝、10分だけ話せますか？』");
    expect(recall?.choices[recall.correct_index]).toBe("明日の朝、10分だけ話せますか？");
    // 設問側で「覚えておいて」と予告しない（予告すると意味の保存ではなく暗記になる）。
    expect(setup?.question).not.toContain("覚え");
    expect(setup?.explanation).not.toContain("覚え");
    // 3分岐すべてに触れる種明かしであること。
    expect(recall?.explanation).toContain("1番目を選んだなら");
    expect(recall?.explanation).toContain("3番目を選んだなら");
    expect(recall?.explanation).toContain("正確に選べたなら");
    // 記憶力テストだと誤読されないよう限界を明記する。
    expect(recall?.expanded_details.limitations.join("")).toContain("記憶力の測定ではない");
  });

  test("scores the prediction by falsifiability, not by tone", () => {
    const scoredPrediction = mentalLesson.find((question) => question.id === "mental_l02_003");

    expect(scoredPrediction?.choices[scoredPrediction.correct_index]).toBe(
      "今日のレビューで、最後のページまでたどり着けない"
    );
    expect(scoredPrediction?.explanation).toContain("採点日のない予言は、負けることができない");
    // 落ち着いた言い方や前向きな言い方を正解にしない。
    expect(scoredPrediction?.choices.join("")).not.toContain("きっとうまくいく");
    expect(scoredPrediction?.choices.join("")).not.toContain("大丈夫");
  });

  test("puts the safety boundary before transfer and keeps criteria out of the choices", () => {
    const ids = mentalLesson.map((question) => question.id);
    expect(ids.indexOf("mental_l02_004")).toBeLessThan(ids.indexOf("mental_l02_005"));

    const boundary = mentalLesson.find((question) => question.id === "mental_l02_004");
    expect(boundary?.choices[boundary.correct_index]).toBe("請求書の支払期限が、今日の17時");
    // 判定基準を選択肢に埋め込むと、技能の適用ではなく読み取りで解けてしまう。
    expect(boundary?.choices.join("")).not.toContain("明記");
    expect(boundary?.choices.join("")).not.toContain("事実");
    expect(boundary?.explanation).toContain("体の新しい強い異変");
    expect(boundary?.explanation).toContain("専門家から指示された対応");
  });

  test("treats self-initiated checking as a wrong answer-check in transfer", () => {
    const transfer = mentalLesson.find((question) => question.id === "mental_l02_005");

    expect(transfer?.question).toContain("明日の食事は断られる");
    expect(transfer?.choices[transfer.correct_index]).toBe("返信が届いて、内容を読んだ時");
    expect(transfer?.choices).toContain("トークを何度か開いて、様子を確かめた時");
    expect(transfer?.explanation).toContain("答え合わせを自分から取りに行き始めたら");
  });

  test("never promises the practice reduces anxiety", () => {
    // 画面に出る文だけを見る。limitations 側の「〜と確かめた研究ではない」は
    // 否定形なので、ここで拾うと逆に誠実な但し書きを禁止してしまう。
    const shownCopy = mentalLesson
      .map((question) =>
        [question.question, question.explanation, question.actionable_advice ?? ""].join("\n")
      )
      .join("\n");

    expect(shownCopy).not.toContain("不安が下がる");
    expect(shownCopy).not.toContain("安心できる");
    expect(shownCopy).not.toContain("一次評価");
    expect(shownCopy).not.toContain("二次評価");
  });

  test("shows the authored final action on completion", () => {
    const metadata = getLessonRuntimeMetadata("mental_l02");
    const recapAction = resolveCompletionRecapAction(mentalLesson as Question[], "fallback");

    expect(recapAction).toBe(metadata?.takeaway_action);
    expect(recapAction).toContain("画面に残っているのは");
  });

  test("keeps the rebuilt package in staging until owner taste approval", () => {
    expect(mentalEvidence.review.human_approved).toBe(false);
    expect(mentalEvidence.content_package.state).toBe("staging");
    expect(mentalEvidence.content_package.readiness.quality_gate_pass).toBe(false);
    expect(mentalEvidence.content_package.review_decision.human_review_required).toBe(true);
  });
});
