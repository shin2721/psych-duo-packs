import type { IoniconName } from "./ioniconName";
import { loadLessons, type Lesson } from "./lessons";

export interface CourseTrailInventoryNode {
  id: string;
  status: "current" | "locked" | "done";
  icon: IoniconName;
  type: "lesson" | "review_blackhole";
  lessonFile: string;
  lessonId: string;
  isLocked?: boolean;
}

const LESSON_ICONS: IoniconName[] = [
  "leaf",
  "flower",
  "sparkles",
  "star",
  "heart-circle",
  "pulse",
  "school",
  "flask",
  "shield-checkmark",
  "trophy",
];

function isCoreLesson(lesson: Lesson, genreId: string): boolean {
  return lesson.id.startsWith(`${genreId}_lesson_`);
}

function coreLessonFile(genreId: string, level: number): string {
  return `${genreId}_l${String(level).padStart(2, "0")}`;
}

export function buildCourseTrailInventory(genreId: string): CourseTrailInventoryNode[] {
  const lessons = loadLessons(genreId)
    .filter(
      (lesson) => lesson.nodeType === "review_blackhole" || isCoreLesson(lesson, genreId)
    )
    .sort((left, right) => left.level - right.level);

  let coreIndex = 0;
  let reviewIndex = 0;

  return lessons.map((lesson) => {
    if (lesson.nodeType === "review_blackhole") {
      reviewIndex += 1;
      return {
        id: `${genreId}_bh${reviewIndex}`,
        status: "locked",
        icon: "planet",
        type: "review_blackhole",
        lessonFile: lesson.id,
        lessonId: lesson.id,
      };
    }

    coreIndex += 1;
    return {
      id: `${genreId.charAt(0)}${lesson.level}`,
      status: coreIndex === 1 ? "current" : "locked",
      icon: LESSON_ICONS[(coreIndex - 1) % LESSON_ICONS.length] ?? "leaf",
      type: "lesson",
      lessonFile: coreLessonFile(genreId, lesson.level),
      lessonId: lesson.id,
    };
  });
}
