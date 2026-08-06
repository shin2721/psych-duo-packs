import type { IoniconName } from "./ioniconName";
import { loadLessons, type Lesson } from "./lessons";
import {
  getCourseCoreLessonIds,
  getCourseManifest,
  validateCourseManifest,
} from "./courseManifestRuntime";

export interface CourseTrailInventoryNode {
  displayLevel?: number;
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

function canonicalLessonId(lesson: Lesson, genreId: string): string {
  if (lesson.nodeType === "review_blackhole") return lesson.id;
  return coreLessonFile(genreId, lesson.level);
}

function buildManifestTrailInventory(
  genreId: string,
  lessons: Lesson[]
): CourseTrailInventoryNode[] | null {
  const manifest = getCourseManifest(genreId);
  if (!manifest) return null;

  const inventoryById = new Map(
    lessons.map((lesson) => [canonicalLessonId(lesson, genreId), lesson])
  );
  const validation = validateCourseManifest(manifest, new Set(inventoryById.keys()));
  if (!validation.valid) {
    throw new Error(`Course manifest inventory mismatch for ${genreId}: ${validation.errors.join("; ")}`);
  }

  return getCourseCoreLessonIds(manifest).map((lessonId, index) => {
    const lesson = inventoryById.get(lessonId);
    if (!lesson) {
      throw new Error(`Course manifest lesson missing from inventory: ${lessonId}`);
    }
    return {
      displayLevel: index + 1,
      id: `${genreId.charAt(0)}${index + 1}`,
      status: index === 0 ? "current" : "locked",
      icon: LESSON_ICONS[index % LESSON_ICONS.length] ?? "leaf",
      type: "lesson",
      lessonFile: lessonId,
      lessonId: lesson.id,
    };
  });
}

export function buildCourseTrailInventory(genreId: string): CourseTrailInventoryNode[] {
  const lessons = loadLessons(genreId)
    .filter(
      (lesson) => lesson.nodeType === "review_blackhole" || isCoreLesson(lesson, genreId)
    )
    .sort((left, right) => left.level - right.level);

  const manifestTrail = buildManifestTrailInventory(genreId, lessons);
  if (manifestTrail) return manifestTrail;

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
