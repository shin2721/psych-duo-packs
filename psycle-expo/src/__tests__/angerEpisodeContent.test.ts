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
      // 読者が自分で検索して確かめられるように、出典を画面に出す。
      expect(question.source_label).toContain("出典：");
      expect(curatedSources.sources[question.source_id as keyof typeof curatedSources.sources]).toBeDefined();
    }
  });

  test("keeps statistical notation off the screen", () => {
    // g や 95%CI は一般の読者には意味のない文字列。効果の大きさは言葉で言い、
    // 正確な数値は詳細側に置く。
    for (const question of angerLesson) {
      const shown = [question.question, question.explanation, question.caveat].join("\n");
      for (const notation of ["g=", "g＝", "95%CI", "95% CI", "β=", "OR=", "p<", "p ="]) {
        expect(shown).not.toContain(notation);
      }
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
    expect(opener?.explanation).toContain("ほぼゼロ");
    // 出版版は非有意。「発散は逆効果」は学位論文段階の結論で、書けば誤報になる。
    expect(opener?.caveat).toContain("「発散は逆効果」とまでは言えません");
    expect(shownCopy).not.toContain("発散は逆効果だ");
    expect(shownCopy).not.toContain("殴ると怒りが増え");
  });

  test("keeps the authors' own theory break visible", () => {
    const jogging = angerLesson.find((question) => question.id === "mental_l07_002");

    expect(jogging?.is_true).toBe(true);
    // サンドバッグは非有意。球技と体育は覚醒を上げるのに怒りを減らした。
    expect(jogging?.explanation).toContain("白黒つかず");
    expect(jogging?.explanation).toContain("球技");
    expect(jogging?.caveat).toContain("ゼロすれすれ");
  });

  test("refutes both distractors on the cognitive-component card", () => {
    const format = angerLesson.find((question) => question.id === "mental_l07_003");

    expect(format?.choices[format.correct_index]).toBe("考え方に触れる要素を含むもの");
    // 長さも回数も効果量と関連しなかった、と原典が報告している。
    expect(format?.explanation).toContain("長くやることでも、たくさんやることでもなかった");
    expect(format?.explanation).toContain("マインドフルネス認知療法");
  });

  test("limits the claim to practice before anger, not in the moment", () => {
    const provoked = angerLesson.find((question) => question.id === "mental_l07_004");

    expect(provoked?.choices[provoked.correct_index]).toBe("小さくなり、有意ではなくなった");
    expect(provoked?.explanation).toContain("94%");
    expect(provoked?.explanation).toContain("防火訓練");
    // 効かないと証明されたわけでもない。
    expect(provoked?.caveat).toContain("調べた研究がまだ少ない");
  });

  test("exits by removing an obligation", () => {
    const closer = angerLesson.find((question) => question.id === "mental_l07_005");

    expect(closer?.recommended_index).toBeNull();
    expect(closer?.choices).toContain("今回は変えない");
    expect(closer?.explanation).toContain("捨てていいもの");
    expect(closer?.explanation).toContain("宿題");
    // 運動そのものを否定しない。
    expect(closer?.explanation).toContain("走りたい人はどうぞ");
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
