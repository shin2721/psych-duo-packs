import curatedSources from "../../data/curated_sources.json";
import mentalEvidence from "../../data/lessons/mental_units/mental_l02.evidence.json";
import mentalLesson from "../../data/lessons/mental_units/mental_l02.ja.json";
import { getLessonRuntimeMetadata } from "../../lib/lesson-data/lessonMetadata";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

describe("mental_l02 screen and sleep episode", () => {
  test("keeps one authored five-step arc", () => {
    expect(mentalLesson).toHaveLength(5);
    expect(mentalLesson.map((question) => question.id)).toEqual([
      "mental_l02_001",
      "mental_l02_002",
      "mental_l02_003",
      "mental_l02_004",
      "mental_l02_005",
    ]);
    expect(mentalLesson.map((question) => question.phase)).toEqual([1, 2, 3, 4, 5]);
    // スライダー・選択・選択・スライダー・振り返り。同じ操作を並べない。
    expect(mentalLesson.map((question) => question.type)).toEqual([
      "number_bet",
      "multiple_choice",
      "multiple_choice",
      "number_bet",
      "conversation",
    ]);
  });

  test("traces every question to a registered source", () => {
    const sourceRegistry = curatedSources.sources as Record<string, unknown>;

    for (const question of mentalLesson) {
      expect(question.claim_id).toMatch(/^mental_l02_\d{3}_claim$/);
      expect(sourceRegistry[question.source_id]).toBeDefined();
      expect(question.expanded_details.citation_role).toBeTruthy();
      expect(question.expanded_details.limitations.length).toBeGreaterThan(0);
    }
  });

  test("bets on the effect size before revealing it", () => {
    const totalBet = mentalLesson.find((question) => question.id === "mental_l02_001");

    expect(totalBet?.bet_answer).toBe(4);
    expect(totalBet?.bet_min).toBe(0);
    expect(totalBet?.bet_max).toBe(60);
    // 設問側に答えを漏らさない。
    expect(totalBet?.question).not.toContain("3〜5");
    expect(totalBet?.question).not.toContain("30分");
    // 数字は実数ボックスが言う。本文で繰り返すと1画面に答えが二度出る。
    expect(totalBet?.bet_answer_label).toBe("3〜5分");
    expect(totalBet?.explanation).not.toContain("3〜5分。");
    // 分単位の推定はレビュー全体ではなく連続アウトカムのサブセット。
    expect(totalBet?.explanation).toContain("11研究・のべ4万8560人");
    expect(totalBet?.explanation).toContain("0.6〜2%");
    expect(totalBet?.caveat).toContain("非常に低い");
  });

  test("reverses the bedtime rule with the larger whole-day effect", () => {
    const bedtime = mentalLesson.find((question) => question.id === "mental_l02_002");

    expect(bedtime?.choices[bedtime.correct_index]).toBe("1日全体の使用");
    // 前のカードへの反論ではなく、単体で読める通念として書く。
    expect(bedtime?.question).toContain("多くの人がそう考えています");
    expect(bedtime?.explanation).toContain("1分");
    expect(bedtime?.explanation).toContain("0分");
    expect(bedtime?.explanation).toContain("就寝2時間前からスクリーン禁止");
  });

  test("separates absence of evidence from absence of effect", () => {
    const blueLight = mentalLesson.find((question) => question.id === "mental_l02_003");

    expect(blueLight?.source_id).toBe("Singh_2023_BlueLight_Cochrane");
    expect(blueLight?.choices[blueLight.correct_index]).toBe(
      "調べた研究が少なすぎて、分からない"
    );
    // 「効果がないと証明された」と書いたらこのカードは誤報になる。
    // 6本のRCTは存在するので「誰も調べていない」とも書けない。
    expect(blueLight?.explanation).toContain("効果が否定されたのではなく");
    expect(blueLight?.explanation).toContain("まともな規模では");
    // 知らない固有名詞のままにせず、一言で権威の重さを渡す。
    expect(blueLight?.question).toContain("医療エビデンス評価の総本山");
    expect(blueLight?.explanation).toContain("6本・のべ148人");
    expect(blueLight?.explanation).toContain("「効果なし」と「証拠なし」は違います");
  });

  test("restores the effect where it is actually measured", () => {
    const inBed = mentalLesson.find((question) => question.id === "mental_l02_004");

    expect(inBed?.bet_answer).toBe(24);
    // 復習で単体に切り出されても成立するよう、必要な前提は問いの中に再掲する。
    expect(inBed?.question).toContain("3〜5分しか削りません");
    expect(inBed?.question).not.toContain("さっき");
    expect(inBed?.question).not.toContain("じゃあ");
    expect(inBed?.explanation).toContain("1.59倍");
    expect(inBed?.explanation).toContain("ゲームなら17分減");
    expect(inBed?.explanation).toContain("操作しているかどうか");
    // 24分がどの分析水準の数字かをただし書きで名指しする。
    expect(inBed?.caveat).toContain("個人間の横断比較");
    expect(inBed?.caveat).toContain("個人内");
  });

  test("exits by removing a rule, not adding a practice", () => {
    const closer = mentalLesson.find((question) => question.id === "mental_l02_005");

    expect(closer?.recommended_index).toBeNull();
    expect(closer?.choices).toContain("今夜は変えない");
    expect(closer?.explanation).toContain("捨てていいもの");
    expect(closer?.explanation).toContain("残すもの");
    expect(closer?.explanation).toContain("守るべきルールが1つに減りました");
    // 横断研究であることと受診の線は、ただし書き側で必ず言う。
    expect(closer?.caveat).toContain("無作為割付はなく");
    expect(closer?.caveat).toContain("逆向きの因果");
    expect(closer?.caveat).toContain("受診");
  });

  test("never claims screens before bed are harmless", () => {
    const shownCopy = mentalLesson
      .map((question) =>
        [
          question.question,
          question.explanation,
          question.caveat ?? "",
          question.actionable_advice ?? "",
        ].join("\n")
      )
      .join("\n");

    expect(shownCopy).not.toContain("無害");
    expect(shownCopy).not.toContain("気にしなくていい。");
    // 「証明された」は card 3 が否定形で使う（効果がないと証明されたのではない）。
    // 肯定形の断定だけを禁じる。
    expect(shownCopy).not.toContain("と証明されました");
    expect(shownCopy).not.toContain("ことが証明された。");
  });

  test("keeps one screen skeleton: short setup, short reveal, caveat in its own block", () => {
    for (const question of mentalLesson) {
      // 設問はフックと問いの2行まで。前置きを積むとテンポが死ぬ。
      expect(question.question.length).toBeLessThanOrEqual(110);
      // 種明かしは読める長さで止める。壁にすると前の版の失敗に戻る。
      expect(question.explanation.length).toBeLessThanOrEqual(230);
      expect(question.caveat.length).toBeLessThanOrEqual(130);
      // ただし書きは消さず、本文から分けて格を下げる。
      expect(question.caveat).toBeTruthy();
      expect(question.explanation).not.toContain("ただし書き");
    }
  });

  test("keeps every graded question standalone", () => {
    // 復習キューはカードを単体で出す。前のカードを指す問いはそこで壊れる。
    const graded = mentalLesson.filter((question) => "correct_index" in question);

    for (const question of graded) {
      for (const backReference of ["さっき", "じゃあ全部", "先ほど", "前の問題"]) {
        expect(question.question).not.toContain(backReference);
      }
    }
  });

  test("shows the authored final action on completion", () => {
    const metadata = getLessonRuntimeMetadata("mental_l02");
    const recapAction = resolveCompletionRecapAction(mentalLesson as Question[], "fallback");

    expect(recapAction).toBe(metadata?.takeaway_action);
    expect(recapAction).toContain("ベッドに持ち込まない");
  });

  test("keeps the rebuilt package in staging until owner taste approval", () => {
    expect(mentalEvidence.review.human_approved).toBe(false);
    expect(mentalEvidence.content_package.state).toBe("staging");
    expect(mentalEvidence.content_package.readiness.quality_gate_pass).toBe(false);
    expect(mentalEvidence.content_package.review_decision.human_review_required).toBe(true);
  });
});
