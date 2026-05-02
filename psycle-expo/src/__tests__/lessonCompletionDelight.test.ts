import fs from "node:fs";
import path from "node:path";

const completionViewPath = path.join(
  __dirname,
  "../../components/lesson/LessonCompletionView.tsx"
);

describe("lesson completion delight contract", () => {
  test("completion screen closes the habit loop with copy, haptics, and level-up sound", () => {
    const source = fs.readFileSync(completionViewPath, "utf8");

    expect(source).toContain('testID="lesson-complete-habit-loop"');
    expect(source).toContain('testID="lesson-complete-recap"');
    expect(source).toContain('i18n.t("lesson.completionRecap.title")');
    expect(source).toContain('i18n.t("lesson.completionRecap.nextPromise")');
    expect(source).toContain('i18n.t("lesson.habitLoop.title")');
    expect(source).toContain('sounds.play("levelUp")');
    expect(source).toContain("hapticFeedback.success()");
    expect(source).toContain('accessibilityLabel={String(item.label)}');
  });
});
