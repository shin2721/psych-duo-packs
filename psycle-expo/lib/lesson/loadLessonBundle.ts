import { loadLessons, type Lesson } from "../lessons";
import type { Question } from "../../types/question";

export interface LoadedLessonBundle {
  effectiveQuestions: Question[];
  genreId: string;
  lesson: Lesson;
  lessonId: string;
  unit: string;
}

export function loadLessonBundle(params: {
  fileParam: string;
  firstLessonCompleted: boolean;
  firstSessionLessonSize: number;
}): LoadedLessonBundle {
  const unitMatch = params.fileParam.match(/^([a-z]+)_/);
  if (!unitMatch) throw new Error(`Invalid file format: ${params.fileParam}`);
  const unit = unitMatch[1];
  const lessons = loadLessons(unit);

  let lesson = lessons.find((candidate) => candidate.id === params.fileParam);
  if (!lesson) {
    const levelMatch = params.fileParam.match(/_l(\d+)$/);
    if (levelMatch) {
      const level = parseInt(levelMatch[1], 10);
      lesson = lessons.find(
        (candidate) => candidate.level === level && (candidate.nodeType === "lesson" || !candidate.nodeType)
      );
    }
  }

  if (!lesson) {
    throw new Error(`Lesson not found: ${params.fileParam}`);
  }

  const isIntroLesson = /_l01$/.test(params.fileParam);
  const shouldShortenFirstSession =
    !params.firstLessonCompleted &&
    isIntroLesson &&
    (lesson.nodeType === "lesson" || !lesson.nodeType);

  const effectiveQuestions = shouldShortenFirstSession
    ? lesson.questions.slice(0, Math.min(params.firstSessionLessonSize, lesson.questions.length))
    : lesson.questions;

  return {
    effectiveQuestions,
    genreId: unit,
    lesson,
    lessonId: params.fileParam,
    unit,
  };
}
