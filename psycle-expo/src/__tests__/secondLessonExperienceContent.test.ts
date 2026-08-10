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
    // 種明かしの後にただし書きが来る。
    expect(totalBet?.explanation).toContain("3〜5分");
    expect(totalBet?.explanation).toContain("54万8338人");
    expect(totalBet?.explanation).toContain("0.6〜2%");
  });

  test("reverses the bedtime rule with the larger whole-day effect", () => {
    const bedtime = mentalLesson.find((question) => question.id === "mental_l02_002");

    expect(bedtime?.choices[bedtime.correct_index]).toBe("1日全体の使用");
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
    expect(blueLight?.explanation).toContain("効果がないと証明された」のではありません");
    expect(blueLight?.explanation).toContain("6本・のべ148人");
    expect(blueLight?.explanation).toContain("「効果なし」と「証拠なし」は違う");
  });

  test("restores the effect where it is actually measured", () => {
    const inBed = mentalLesson.find((question) => question.id === "mental_l02_004");

    expect(inBed?.bet_answer).toBe(24);
    expect(inBed?.explanation).toContain("1.59倍");
    expect(inBed?.explanation).toContain("ゲームなら17分減");
    expect(inBed?.explanation).toContain("操作しているかどうか");
  });

  test("exits by removing a rule, not adding a practice", () => {
    const closer = mentalLesson.find((question) => question.id === "mental_l02_005");

    expect(closer?.recommended_index).toBeNull();
    expect(closer?.choices).toContain("今夜は変えない");
    expect(closer?.explanation).toContain("捨てていいもの");
    expect(closer?.explanation).toContain("残すもの");
    expect(closer?.explanation).toContain("守るべきルールが1つに減りました");
    // 横断研究であることをただし書きで必ず言う。
    expect(closer?.explanation).toContain("横断");
    expect(closer?.explanation).toContain("逆向きの因果");
  });

  test("never claims screens before bed are harmless", () => {
    const shownCopy = mentalLesson
      .map((question) =>
        [question.question, question.explanation, question.actionable_advice ?? ""].join("\n")
      )
      .join("\n");

    expect(shownCopy).not.toContain("無害");
    expect(shownCopy).not.toContain("気にしなくていい。");
    // 「証明された」は card 3 が否定形で使う（効果がないと証明されたのではない）。
    // 肯定形の断定だけを禁じる。
    expect(shownCopy).not.toContain("と証明されました");
    expect(shownCopy).not.toContain("ことが証明された。");
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
