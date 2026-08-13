import curatedSources from "../../data/curated_sources.json";
import angerEvidence from "../../data/lessons/mental_units/mental_l07.evidence.json";
import angerLesson from "../../data/lessons/mental_units/mental_l07.ja.json";
import { getLessonRuntimeMetadata } from "../../lib/lesson-data/lessonMetadata";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

describe("mental_l07 anger and venting episode", () => {
  test("runs the lesson-two arc without a numeric slider", () => {
    // 再現テストの条件。同じ弧がスライダーなしで成立するかを見る。
    expect(angerLesson).toHaveLength(5);
    expect(angerLesson.map((question) => question.type)).toEqual([
      "multiple_choice",
      "swipe_judgment",
      "multiple_choice",
      "multiple_choice",
      "conversation",
    ]);
    expect(angerLesson.map((question) => question.type)).not.toContain("number_bet");
    expect(angerLesson.every((question) => question.bet_card === true)).toBe(true);
  });

  test("keeps the same screen skeleton as lesson two", () => {
    for (const question of angerLesson) {
      expect(question.question.length).toBeLessThanOrEqual(110);
      expect(question.explanation.length).toBeLessThanOrEqual(230);
      expect(question.caveat).toBeTruthy();
      expect(question.caveat.length).toBeLessThanOrEqual(130);
      expect(question.expanded_details.limitations.length).toBeGreaterThan(0);
      expect(curatedSources.sources[question.source_id as keyof typeof curatedSources.sources]).toBeDefined();
    }
  });

  test("keeps every graded question standalone", () => {
    const graded = angerLesson.filter(
      (question) => "correct_index" in question || "is_true" in question
    );

    for (const question of graded) {
      for (const backReference of ["さっき", "じゃあ全部", "先ほど", "前の問題", "この結果"]) {
        expect(question.question).not.toContain(backReference);
      }
    }
  });

  test("calls venting null rather than harmful", () => {
    const opener = angerLesson.find((question) => question.id === "mental_l07_001");
    const shownCopy = angerLesson
      .map((question) =>
        [question.question, question.explanation, question.caveat, question.actionable_advice ?? ""].join("\n")
      )
      .join("\n");

    expect(opener?.choices[opener.correct_index]).toBe("ゼロと区別がつかなかった");
    expect(opener?.explanation).toContain("g=−0.02");
    // 出版版は非有意。「発散は逆効果」は学位論文段階の結論で、書けば誤報になる。
    expect(opener?.caveat).toContain("「発散は逆効果」ではありません");
    expect(shownCopy).not.toContain("発散は逆効果だ");
    expect(shownCopy).not.toContain("殴ると怒りが増え");
  });

  test("keeps the authors' own theory break visible", () => {
    const jogging = angerLesson.find((question) => question.id === "mental_l07_002");

    expect(jogging?.is_true).toBe(true);
    // サンドバッグは非有意。球技と体育は覚醒を上げるのに怒りを減らした。
    expect(jogging?.explanation).toContain("非有意");
    expect(jogging?.explanation).toContain("球技");
    expect(jogging?.caveat).toContain("下限は0.07");
  });

  test("refutes both distractors on the cognitive-component card", () => {
    const format = angerLesson.find((question) => question.id === "mental_l07_003");

    expect(format?.choices[format.correct_index]).toBe("考え方に触れる要素を含むもの");
    // 長さも回数も効果量と関連しなかった、と原典が報告している。
    expect(format?.explanation).toContain("セッション数");
    expect(format?.explanation).toContain("関連しませんでした");
  });

  test("limits the claim to practice before anger, not in the moment", () => {
    const provoked = angerLesson.find((question) => question.id === "mental_l07_004");

    expect(provoked?.choices[provoked.correct_index]).toBe("小さくなり、有意ではなくなった");
    expect(provoked?.explanation).toContain("94%");
    expect(provoked?.explanation).toContain("平時に続ける習慣");
    // 効かないと証明されたわけでもない。
    expect(provoked?.caveat).toContain("確かめられていない");
  });

  test("exits by removing an obligation", () => {
    const closer = angerLesson.find((question) => question.id === "mental_l07_005");

    expect(closer?.recommended_index).toBeNull();
    expect(closer?.choices).toContain("今回は変えない");
    expect(closer?.explanation).toContain("捨てていいもの");
    expect(closer?.explanation).toContain("義務感");
    // 運動そのものを否定しない。
    expect(closer?.explanation).toContain("走りたいから走るのは自由");
    expect(closer?.caveat).toContain("専門的支援");
  });

  test("shows the authored final action on completion", () => {
    const metadata = getLessonRuntimeMetadata("mental_l07");
    const recapAction = resolveCompletionRecapAction(angerLesson as Question[], "fallback");

    expect(recapAction).toBe(metadata?.takeaway_action);
    expect(recapAction).toContain("発散しなきゃ");
  });

  test("stays in staging until owner taste approval", () => {
    expect(angerEvidence.review.human_approved).toBe(false);
    expect(angerEvidence.content_package.state).toBe("staging");
    expect(angerEvidence.content_package.readiness.quality_gate_pass).toBe(false);
  });
});
