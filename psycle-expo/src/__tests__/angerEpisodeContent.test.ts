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
      expect(question.question.length).toBeLessThanOrEqual(160);
      expect(question.explanation.length).toBeLessThanOrEqual(350);
      expect(question.caveat).toBeTruthy();
      expect(question.caveat.length).toBeLessThanOrEqual(220);
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

    // 賭けの対象は判定そのもの。3択は「効いた」「逆効果」「差はなかった（調べて差が
    // 出なかった）」を分ける。「証拠がまだ足りない」側は l02 のコクラン回が受け持つ。
    // 「逆効果」は実際の報道の言い方。
    expect(opener?.choices[opener.correct_index]).toBe("差は、なかった");
    expect(opener?.choices).toContain("逆効果だと確かめられた");
    // 種明かしは研究の背骨（興奮を上げるか下げるか）を見せる。
    expect(opener?.explanation).toContain("興奮を上げる側");
    expect(opener?.explanation).toContain("イライラや怒りの度合いを比べる");
    expect(opener?.explanation).toContain("差はゼロ");
    // ゼロは種目をならした平均。全員同じだったかのような文は書かない。
    expect(opener?.explanation).not.toContain("同じでした");
    // 怒らされた人での検証が23件しかないことは、ただし書きが正直に言う。
    expect(opener?.caveat).toContain("カッとなった人を集めたわけではなく");
    expect(opener?.caveat).toContain("興奮を下げる練習では下がる");
    expect(opener?.caveat).toContain("23件ぶん");
    // 用語は伏せずに、平語の説明を先に置いてから名前を渡す。
    expect(opener?.explanation).toContain("複数の研究をまとめて計算し直す手法を");
    expect(opener?.explanation).toContain("メタ分析");
    // 計測の比喩をやめ、測った値だと素直に言う。
    expect(opener?.explanation).not.toContain("怒りのメーター");
    // 限界の列挙で終わらせず、どう受け取るのが正確かまで書く。
    expect(opener?.caveat).toContain("「逆効果」とも言えません");
    // 出版版は非有意。「発散は逆効果」は学位論文段階の結論で、書けば誤報になる。
    expect(shownCopy).not.toContain("発散は逆効果だ");
    expect(shownCopy).not.toContain("殴ると怒りが増え");
  });

  test("keeps the authors' own theory break visible", () => {
    const jogging = angerLesson.find((question) => question.id === "mental_l07_002");

    // 「怒り対策のジョギング」ではなく、実在する信念（解消法として効く）を出題する。
    expect(jogging?.question).toContain("ジョギングをすると、怒りは減る");
    expect(jogging?.is_true).toBe(false);
    // 測ったもの（そのとき感じている怒り）を台帳の記述どおりに言う。
    expect(jogging?.explanation).toContain("いま感じている怒り");
    // 分野全体の統計（怒っていない人が大半）をジョギング17件に帰属させない。
    // 種目別の内訳は論文に未報告（詳細シートがそれを言う）。
    expect(jogging?.explanation).not.toContain("怒っていない人が大半");
    // 論文に存在しない説明（反芻）を著者に帰属させない。
    expect(jogging?.explanation).not.toContain("反芻");
    expect(jogging?.explanation).toContain("退屈や苛立ち");
    // 興奮を上げる点では同じ。割れたのは頭の中——研究の枠組みへの伏線。
    expect(jogging?.explanation).toContain("体の興奮を上げる点では、ジョギングも球技も同じ");
    // サンドバッグは非有意。球技と体育は覚醒を上げるのに怒りを減らした。
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
    expect(jogging?.caveat).toContain("まだ確実ではありません");
    expect(jogging?.caveat).not.toContain("ゼロすれすれ");
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
    expect(format?.explanation).toContain("体の興奮＋頭の解釈");
    // 一般法則の顔をさせない。この分析の観察として言い、原因は未確定と明記。
    expect(format?.explanation).toContain("どの要素が効いたのかまでは、確定していません");
    expect(format?.question).not.toContain("跳ねる");
    // 期間も1回の長さも効果量と関連しなかった、と原典が報告している。回数との関連は台帳に無いので言わない。
    expect(format?.explanation).toContain("続けた期間も、1回の長さも、効果と関係していませんでした");
    expect(format?.explanation).toContain("マインドフルネス認知療法");
  });

  test("limits the claim to practice before anger, not in the moment", () => {
    const provoked = angerLesson.find((question) => question.id === "mental_l07_004");

    expect(provoked?.choices[provoked.correct_index]).toBe("小さくなり、はっきりしなくなった");
    expect(provoked?.explanation).toContain("鎮める練習の効果を支えているデータ");
    expect(provoked?.explanation).not.toContain("この分野の154研究");
    expect(provoked?.explanation).toContain("94%");
    // どれだけ縮んだかと、どこまで際どいかを画面で言う。
    expect(provoked?.explanation).toContain("3分の1に縮み");
    expect(provoked?.explanation).not.toContain("ゼロすれすれ");
    expect(provoked?.explanation).toContain("効いたとも効かないとも言えなくなりました");
    expect(provoked?.explanation).toContain("防火訓練");
    // 効かないと証明されたわけでもない。
    // 効かないと決まったのではないことを、ただし書き自身が言う。
    // 「平時に続けると下がる」は確認済み。「瞬間」はその場で使う場合も、
    // 続けた人がその瞬間に強いかも、18件で白黒つかない——2つの読みに答える。
    expect(provoked?.caveat).toContain("平時に続けると、ふだんの怒りが下がる");
    expect(provoked?.caveat).toContain("白黒つかない");
    // 選択肢は平語（はっきりしなくなった）。「言い切れない」の意味は詳細シートも引き受ける。
    expect(provoked?.expanded_details.limitations.join("\n")).toContain(
      "「効いた」と言い切れない"
    );
    expect(provoked?.caveat).toContain("効かないと決まったのではありません");
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
    expect(recapAction).toContain("出さないと消えない");
    // 「発散」はカード2で球技・体育まで含むと認めた語。捨てる前提の名前に使わない。
    expect(recapAction).not.toContain("発散しなきゃ");
    // 同じ一手が metadata とカードの3か所に保存されている。片方だけ直すと画面が食い違う。
    const cardAdvice = angerLesson
      .map((question) => question.actionable_advice)
      .filter((advice): advice is string => Boolean(advice));
    expect(cardAdvice.length).toBeGreaterThan(0);
    for (const advice of cardAdvice) {
      expect(advice).toBe(recapAction);
    }
  });

  test("stays in staging until owner taste approval", () => {
    expect(angerEvidence.review.human_approved).toBe(false);
    expect(angerEvidence.content_package.state).toBe("staging");
    expect(angerEvidence.content_package.readiness.quality_gate_pass).toBe(false);
  });
});
