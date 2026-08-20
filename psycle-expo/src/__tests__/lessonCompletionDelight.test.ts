import fs from "node:fs";
import path from "node:path";

const completionViewPath = path.join(
  __dirname,
  "../../components/lesson/LessonCompletionView.tsx"
);

describe("lesson completion contract", () => {
  test("shows the numbers and the one move, and nothing else", () => {
    const source = fs.readFileSync(completionViewPath, "utf8");

    // 数字のタイルと、持ち帰る一手。この画面はこの2つだけを担当する。
    expect(source).toContain('testID="lesson-complete-recap"');
    expect(source).toContain('testID="lesson-complete-hits"');
    expect(source).toContain('i18n.t("lesson.completionRecap.nextPromise")');
    // 画面から出る導線は、下部の主ボタン1つ。
    expect(source).toContain('testID="lesson-complete-continue"');

    // 研究メタ情報は各カードの詳細シートが持つ。ここで繰り返さない。
    expect(source).not.toContain("limitationsHeader");
    expect(source).not.toContain("bestForHeader");
    expect(source).not.toContain("showResearchDetails");
    // 判断の要約は種明かしとただし書きが既に言っている。
    expect(source).not.toContain("tryValueBadge");
    expect(source).not.toContain("basisLabelPrefix");
    // 祝いの演出と気分の収集は外した。
    expect(source).not.toContain("VictoryConfetti");
    expect(source).not.toContain('sounds.play("levelUp")');
    expect(source).not.toContain("onPressFeltBetter(item.value)");
  });
});
