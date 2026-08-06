import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`${__dirname}/../../${path}`, "utf8");
}

describe("lesson screen flow architecture", () => {
  test("lesson screen composes new lesson hooks and view components", () => {
    const source = read("app/lesson.tsx");

    expect(source).toContain('import { useLessonLoader }');
    expect(source).toContain('import { useLessonRuntime }');
    expect(source).toContain('import { useLessonPostCompletion }');
    expect(source).toContain('import { LessonCompletionView }');
    expect(source).toContain('import { LessonQuestionStage }');

    expect(source).toContain("const { handleEnergyBlocked, handleLoadFailed, isE2EAnalyticsMode } = useLessonLoader");
    expect(source).toContain("} = useLessonRuntime({");
    expect(source).toContain("} = useLessonPostCompletion({");
    expect(source).toContain("<LessonCompletionView");
    expect(source).toContain("<LessonQuestionStage");
    expect(source).toContain('testID="lesson-energy-blocked-screen"');
    expect(source).toContain("if (energyBlocked)");
    expect(source.indexOf("if (energyBlocked)")).toBeLessThan(
      source.indexOf("if (loadError || !canStart || !currentQuestion)")
    );

    expect(source).not.toContain('import { useLessonFlow }');
    expect(source).not.toContain('import { useLessonCompletionEffects }');
    expect(source).not.toContain("resetSessionTracking()");
    expect(source).not.toContain("<QuestionRenderer");
  });

  test("core and review rounds remount the same question independently", () => {
    const stage = read("components/lesson/LessonQuestionStage.tsx");

    expect(stage).toContain(
      'key={`question-${props.isReviewRound ? "review" : "core"}-${props.currentQuestion.id || props.currentIndex}`}'
    );
  });
});
