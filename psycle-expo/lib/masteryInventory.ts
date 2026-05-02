import { loadLessons } from "./lessons";

const MASTERY_LESSON_ID_PATTERN = /_m\d+$/;

export function listAvailableMasteryLessonIds(themeId: string): string[] {
  if (!themeId) return [];

  return loadLessons(themeId)
    .map((lesson) => lesson.id)
    .filter((lessonId) => MASTERY_LESSON_ID_PATTERN.test(lessonId))
    .sort((left, right) => left.localeCompare(right));
}

