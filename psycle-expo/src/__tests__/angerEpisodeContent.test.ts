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
      // 文字数・統計記号・出典・後方参照は validate-lessons が全レッスンに対して見る。
      expect(curatedSources.sources[question.source_id as keyof typeof curatedSources.sources]).toBeDefined();
    }
  });

  test("states verdicts plainly, without figures of speech", () => {
    // 「ぼやけた」「宙に浮く」は同じ絵を持つ読者にしか通じず、しかも
    // 「効かなかった」と誤読される。判定は判定の言葉で言う。
    for (const question of angerLesson) {
      const shown = [question.question, question.explanation, question.caveat].join("\n");
      for (const figure of ["ぼやけ", "宙に浮", "脇役"]) {
        expect(shown).not.toContain(figure);
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
    // 用語は伏せずに、平語の説明を先に置いてから名前を渡す。
    expect(opener?.explanation).toContain("複数の研究をまとめて計算し直す手法を");
    expect(opener?.explanation).toContain("メタ分析");
    // 計測の比喩をやめ、測った値だと素直に言う。
    expect(opener?.explanation).not.toContain("怒りのメーター");
    // 限界の列挙で終わらせず、どう受け取るのが正確かまで書く。
    expect(opener?.caveat).toContain("言えるのは");
    // 出版版は非有意。「発散は逆効果」は学位論文段階の結論で、書けば誤報になる。
    expect(opener?.caveat).toContain("「発散は逆効果」とまでは言えません");
    expect(shownCopy).not.toContain("発散は逆効果だ");
    expect(shownCopy).not.toContain("殴ると怒りが増え");
  });

  test("keeps the authors' own theory break visible", () => {
    const jogging = angerLesson.find((question) => question.id === "mental_l07_002");

    expect(jogging?.is_true).toBe(true);
    // サンドバッグは非有意。球技と体育は覚醒を上げるのに怒りを減らした。
    expect(jogging?.explanation).toContain("怒りを増やしていたのは");
    // カード3で明かす瞑想を、カード2の物差しに使わない（画面外の前提になる）。
    // 画面は方向と確かさまで。大きさは詳細シートが凡例つきで持つ。
    expect(jogging?.explanation).not.toContain("瞑想");
    // 増える側だけ留保して減る側を言い切らない。この画面は向きの対比まで。
    expect(jogging?.explanation).not.toContain("確かな差");
    expect(jogging?.explanation).not.toContain("中くらいの差");
    expect(jogging?.explanation).toContain("白黒つかず");
    // 読者が知らない内輪話（著者の理論）に寄りかからない。
    expect(jogging?.explanation).not.toContain("著者");
    expect(jogging?.explanation).toContain("球技");
    expect(jogging?.caveat).toContain("ゼロすれすれ");
  });

  test("refutes both distractors on the cognitive-component card", () => {
    const format = angerLesson.find((question) => question.id === "mental_l07_003");

    expect(format?.choices[format.correct_index]).toContain("考え方の練習も入れる");
    // 正解だけが長いと、中身を読まなくても形で当てられる。
    const lengths = (format?.choices ?? []).map((choice) => choice.length);
    expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(4);
    // 抽象名だけの選択肢にしない。何を選んだのか分かる例を必ず添える。
    for (const choice of format?.choices ?? []) {
      expect(choice).toContain("（");
    }
    // 長さも回数も効果量と関連しなかった、と原典が報告している。
    expect(format?.explanation).toContain("長くやることでも、たくさんやることでもなかった");
    expect(format?.explanation).toContain("マインドフルネス認知療法");
  });

  test("limits the claim to practice before anger, not in the moment", () => {
    const provoked = angerLesson.find((question) => question.id === "mental_l07_004");

    expect(provoked?.choices[provoked.correct_index]).toBe("小さくなり、有意ではなくなった");
    expect(provoked?.explanation).toContain("154研究・のべ1万人");
    expect(provoked?.explanation).not.toContain("この1万人の");
    expect(provoked?.explanation).toContain("94%");
    // どれだけ縮んだかと、どこまで際どいかを画面で言う。
    expect(provoked?.explanation).toContain("3分の1に縮んで");
    expect(provoked?.explanation).toContain("効いたとも効かないとも言えなくなりました");
    expect(provoked?.explanation).toContain("防火訓練");
    // 効かないと証明されたわけでもない。
    // 深呼吸を禁じる話ではないことを、ただし書き自身が言う。
    expect(provoked?.caveat).toContain("平時に続ける練習として効く側");
    // 「有意ではない」を選択肢に残すなら、意味は詳細シートが引き受ける。
    expect(provoked?.expanded_details.limitations.join("\n")).toContain(
      "偶然のばらつきと区別がつかなくなった"
    );
    expect(provoked?.caveat).toContain("研究がまだ少ない");
  });

  test("exits by removing an obligation", () => {
    const closer = angerLesson.find((question) => question.id === "mental_l07_005");

    expect(closer?.recommended_index).toBeNull();
    expect(closer?.choices).toContain("今回は変えない");
    // 締めは3つの棚卸し。断定できるものとできないものを並べる。
    expect(closer?.question).toContain("154研究のメタ分析");
    expect(closer?.question).not.toContain("この計算");
    expect(closer?.explanation).toContain("殴る・叫ぶなどの発散");
    expect(closer?.explanation).toContain("平時に続ける鎮める練習");
    // 運動そのものを否定しない。
    // 走ることは判定が割れている。捨てる側に入れると種明かしと矛盾する。
    expect(closer?.explanation).toContain("判定が割れた");
    expect(closer?.explanation).toContain("健康効果はまた別の話");
    expect(closer?.explanation).not.toContain("怒りのために走ること");
    expect(closer?.caveat).toContain("専門的支援");
  });

  test("shows the authored final action on completion", () => {
    const metadata = getLessonRuntimeMetadata("mental_l07");
    const recapAction = resolveCompletionRecapAction(angerLesson as Question[], "fallback");

    expect(recapAction).toBe(metadata?.takeaway_action);
    expect(recapAction).toContain("発散しなきゃ」という前提");
  });

  test("stays in staging until owner taste approval", () => {
    expect(angerEvidence.review.human_approved).toBe(false);
    expect(angerEvidence.content_package.state).toBe("staging");
    expect(angerEvidence.content_package.readiness.quality_gate_pass).toBe(false);
  });
});
