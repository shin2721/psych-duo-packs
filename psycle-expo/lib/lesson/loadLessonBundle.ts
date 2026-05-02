import { loadLessons, type Lesson } from "../lessons";
import type { Question } from "../../types/question";
import { resolveLessonRuntimeAccess } from "../lessonOperational";
import {
  applyDifficultyPacing,
  resolveDifficultyPacing,
  type DifficultyPacingDecision,
} from "./difficultyPacing";

export interface LoadedLessonBundle {
  effectiveQuestions: Question[];
  genreId: string;
  lesson: Lesson;
  lessonId: string;
  pacing: DifficultyPacingDecision;
  requestedLessonId: string;
  unit: string;
}

export function loadLessonBundle(params: {
  difficultyPacing?: {
    optimalPMax: number;
    optimalPMin: number;
    questionsAnswered: number;
    recentAccuracy: number;
    skillConfidence: number;
  };
  fileParam: string;
  firstLessonCompleted: boolean;
  firstSessionLessonSize: number;
  lessonSize: number;
}): LoadedLessonBundle {
  const runtimeAccess = resolveLessonRuntimeAccess({
    lessonId: params.fileParam,
  });
  const activeLessonId = runtimeAccess.resolvedLessonId;
  if (!runtimeAccess.allowed || !activeLessonId) {
    throw new Error(`Lesson is unavailable (${runtimeAccess.reason ?? "unknown"}): ${params.fileParam}`);
  }

  const unitMatch = activeLessonId.match(/^([a-z]+)_/);
  if (!unitMatch) throw new Error(`Invalid file format: ${params.fileParam}`);
  const unit = unitMatch[1];
  const lessons = loadLessons(unit);

  let lesson = lessons.find((candidate) => candidate.id === activeLessonId);
  if (!lesson) {
    const levelMatch = activeLessonId.match(/_l(\d+)$/);
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
  const isResolvedIntroLesson = /_l01$/.test(activeLessonId);
  const shouldShortenFirstSession =
    !params.firstLessonCompleted &&
    (isIntroLesson || isResolvedIntroLesson) &&
    (lesson.nodeType === "lesson" || !lesson.nodeType);

  const pacing = resolveDifficultyPacing({
    baseLessonSize: params.lessonSize,
    firstLessonCompleted: params.firstLessonCompleted,
    firstSessionLessonSize: params.firstSessionLessonSize,
    isIntroLesson: isIntroLesson || isResolvedIntroLesson,
    maxQuestionCount: lesson.questions.length,
    optimalPMax: params.difficultyPacing?.optimalPMax ?? 0.7,
    optimalPMin: params.difficultyPacing?.optimalPMin ?? 0.55,
    questionsAnswered: params.difficultyPacing?.questionsAnswered ?? 0,
    recentAccuracy: params.difficultyPacing?.recentAccuracy ?? 0.7,
    skillConfidence: params.difficultyPacing?.skillConfidence ?? 0,
  });

  const effectiveQuestions = shouldShortenFirstSession
    ? lesson.questions.slice(0, Math.min(params.firstSessionLessonSize, lesson.questions.length))
    : applyDifficultyPacing(lesson.questions, pacing);

  return {
    effectiveQuestions,
    genreId: unit,
    lesson,
    lessonId: activeLessonId,
    pacing,
    requestedLessonId: params.fileParam,
    unit,
  };
}
