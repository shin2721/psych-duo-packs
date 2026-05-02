import { loadLessons } from "../../lib/lessons";
import {
  getLessonRuntimeMetadata,
  getQuestionCountRangeForLoadScore,
} from "../../lib/lesson-data/lessonMetadata";

const MENTAL_METADATA_IDS = [
  "mental_l01",
  "mental_l02",
  "mental_l03",
  "mental_l04",
  "mental_l05",
  "mental_l06",
  "mental_m01",
  "mental_m02",
  "mental_m03",
];

describe("lesson metadata contract", () => {
  test("mental lessons have runtime metadata for Psycle principles", () => {
    for (const lessonId of MENTAL_METADATA_IDS) {
      const metadata = getLessonRuntimeMetadata(lessonId);

      expect(metadata).toBeDefined();
      expect(metadata?.lesson_id).toBe(lessonId);
      expect(metadata?.lesson_job.trim()).toBeTruthy();
      expect(metadata?.target_shift.trim()).toBeTruthy();
      expect(metadata?.done_condition.trim()).toBeTruthy();
      expect(metadata?.takeaway_action.trim()).toBeTruthy();
      expect(metadata?.done_condition).not.toBe(metadata?.lesson_job);
      expect(metadata?.load_score.total).toBe(
        (metadata?.load_score.cognitive ?? 0) +
          (metadata?.load_score.emotional ?? 0) +
          (metadata?.load_score.behavior_change ?? 0)
      );
      expect(metadata?.question_count_range).toEqual(
        getQuestionCountRangeForLoadScore(metadata!.load_score)
      );
    }
  });

  test("loadLessons uses metadata targets instead of a fixed 10-question lesson", () => {
    const lessons = loadLessons("mental");
    const firstCoreLesson = lessons.find((lesson) => lesson.id === "mental_lesson_1");
    const firstMasteryLesson = lessons.find((lesson) => lesson.id === "mental_m01");

    expect(firstCoreLesson?.metadata?.lesson_id).toBe("mental_l01");
    expect(firstCoreLesson?.questions).toHaveLength(
      firstCoreLesson!.metadata!.question_count_range.target
    );
    expect(firstCoreLesson?.questions.length).toBeLessThan(10);

    expect(firstMasteryLesson?.metadata?.lesson_id).toBe("mental_m01");
    expect(firstMasteryLesson?.questions).toHaveLength(
      firstMasteryLesson!.metadata!.question_count_range.target
    );
  });
});

