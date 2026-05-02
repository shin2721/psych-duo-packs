import type { LessonMetadata, Question } from "../types/question";

// トップレベルでJSONファイルをインポート（Metro bundlerが確実に認識するため）
// Force reload: 2025-11-13 21:20
import { getMentalDataForLocale } from "../data/lessons/mental_units";
import { getMentalDataEvidenceMap } from "../data/lessons/mental_units";
import { getMoneyDataForLocale } from "../data/lessons/money_units";
import { getMoneyDataEvidenceMap } from "../data/lessons/money_units";
import { getWorkDataForLocale } from "../data/lessons/work_units";
import { getWorkDataEvidenceMap } from "../data/lessons/work_units";
import { getHealthDataForLocale } from "../data/lessons/health_units";
import { getHealthDataEvidenceMap } from "../data/lessons/health_units";
import { getSocialDataForLocale } from "../data/lessons/social_units";
import { getSocialDataEvidenceMap } from "../data/lessons/social_units";
import { getStudyDataForLocale } from "../data/lessons/study_units";
import { getStudyDataEvidenceMap } from "../data/lessons/study_units";
import i18n from "./i18n";
import {
  adaptRawQuestion,
  createLessonLoadDiagnostics,
  warnLessonLoadSummary,
} from "./lesson-data/lessonQuestionAdapter";
import {
  getLessonRuntimeMetadata,
  getQuestionCountRangeForLoadScore,
} from "./lesson-data/lessonMetadata";
import { getLessonTitle } from "./lesson-data/lessonTitles";
import { resolveRuntimeLessonId } from "./lessonContinuity";
import type { LessonOperationalMetadata } from "../types/lessonOperational";

// Legacy curriculum imports removed - now using lesson data directly

export interface Reference {
  citation: string;
  note: string;
  level?: "gold" | "silver" | "bronze"; // 信頼度レベル
}

export interface ResearchMeta {
  theory: string;
  primary_authors: string[];
  year: number;
  evidence_level: "high" | "medium" | "low";
  support: {
    meta_analysis: boolean;
    effect_size: string;
    replication: "stable" | "mixed" | "failed";
    years_in_use: number;
  };
  confidence_summary: string;
  best_for?: string[];      // 向いているケース
  limitations?: string[];   // 効きにくいケース
}

export interface Lesson {
  id: string;
  unit: string;
  level: number;
  title: string;
  questions: Question[];
  totalXP: number;
  metadata?: LessonMetadata;
  references?: Reference[];
  context_note?: string;
  research_meta?: ResearchMeta;
  nodeType?: 'lesson' | 'review_blackhole';
}

function getEvidenceMapForUnit(unit: string): Record<string, LessonOperationalMetadata> {
  switch (unit) {
    case "mental":
      return getMentalDataEvidenceMap();
    case "money":
      return getMoneyDataEvidenceMap();
    case "work":
      return getWorkDataEvidenceMap();
    case "health":
      return getHealthDataEvidenceMap();
    case "social":
      return getSocialDataEvidenceMap();
    case "study":
      return getStudyDataEvidenceMap();
    default:
      return {};
  }
}

function toCanonicalLessonAssetId(lessonId: string): string | null {
  const resolvedLessonId = resolveRuntimeLessonId(lessonId).resolvedLessonId ?? lessonId;
  const lessonMatch = resolvedLessonId.match(/^([a-z]+)_(?:lesson_(\d+)|l(\d+)|m(\d+))$/);
  if (!lessonMatch) return null;

  const unit = lessonMatch[1];
  const legacyLevel = lessonMatch[2];
  const coreLevel = lessonMatch[3];
  const masteryLevel = lessonMatch[4];

  if (coreLevel) {
    return `${unit}_l${coreLevel.padStart(2, "0")}`;
  }

  if (masteryLevel) {
    return `${unit}_m${masteryLevel.padStart(2, "0")}`;
  }

  if (legacyLevel) {
    return `${unit}_l${legacyLevel.padStart(2, "0")}`;
  }

  return null;
}

export function getLessonOperationalMetadata(lessonId: string): LessonOperationalMetadata | null {
  const canonicalLessonId = toCanonicalLessonAssetId(lessonId);
  if (!canonicalLessonId) return null;

  const unitMatch = canonicalLessonId.match(/^([a-z]+)_/);
  if (!unitMatch?.[1]) return null;

  const evidenceMap = getEvidenceMapForUnit(unitMatch[1]);
  return evidenceMap[canonicalLessonId] ?? null;
}

function deriveQuestionGroups(unit: string, questions: Question[]): {
  coreLevels: number[];
  masteryLevels: number[];
} {
  const coreLevels = new Set<number>();
  const masteryLevels = new Set<number>();

  questions.forEach((question) => {
    if (!question.source_id) return;

    const coreMatch = question.source_id.match(new RegExp(`^${unit}_l(\\d+)_`));
    if (coreMatch) {
      coreLevels.add(parseInt(coreMatch[1], 10));
      return;
    }

    const masteryMatch = question.source_id.match(new RegExp(`^${unit}_m(\\d+)_`));
    if (masteryMatch) {
      masteryLevels.add(parseInt(masteryMatch[1], 10));
    }
  });

  return {
    coreLevels: [...coreLevels].sort((left, right) => left - right),
    masteryLevels: [...masteryLevels].sort((left, right) => left - right),
  };
}

function buildLessonRecord(args: {
  id: string;
  unit: string;
  level: number;
  title: string;
  questions: Question[];
  metadata?: LessonMetadata;
  nodeType?: 'lesson' | 'review_blackhole';
}): Lesson {
  const totalXP = args.questions.reduce((sum, question) => sum + question.xp, 0);
  const firstQuestion = args.questions[0];
  let references: Reference[] = [];

  if (firstQuestion?.source_id) {
    const sourceMatch = firstQuestion.source_id.match(/^[a-z]+_[lm]\d+_(.+)$/);
    if (sourceMatch) {
      references = [{
        citation: sourceMatch[1].replace(/_/g, ' '),
        note: "主要参照",
        level: firstQuestion.evidence_grade || "silver"
      }];
    }
  }

  return {
    id: args.id,
    unit: args.unit,
    level: args.level,
    title: args.title,
    questions: args.questions,
    totalXP,
    metadata: args.metadata,
    references,
    context_note: undefined,
    research_meta: undefined,
    nodeType: args.nodeType ?? 'lesson',
  };
}

function getCanonicalLessonId(unit: string, lane: "core" | "mastery", level: number): string {
  const levelText = String(level).padStart(2, "0");
  return lane === "mastery" ? `${unit}_m${levelText}` : `${unit}_l${levelText}`;
}

function getLessonQuestionTarget(
  metadata: LessonMetadata | null,
  fallbackTarget: number
): number {
  if (metadata) {
    return Math.max(
      metadata.question_count_range.min,
      Math.min(metadata.question_count_range.target, metadata.question_count_range.max)
    );
  }

  return fallbackTarget;
}

// JSONファイルからレッスンデータを生成
export function loadLessons(unit: string): Lesson[] {
  try {
    // 事前にインポートされたJSONを使用
    let rawData: unknown = null;
    const locale = i18n.locale || 'ja';

    switch (unit) {
      case "mental":
        rawData = getMentalDataForLocale(locale);
        break;
      case "money":
        rawData = getMoneyDataForLocale(locale);
        break;
      case "work":
        rawData = getWorkDataForLocale(locale);
        break;
      case "health":
        rawData = getHealthDataForLocale(locale);
        break;
      case "social":
        rawData = getSocialDataForLocale(locale);
        break;
      case "study":
        rawData = getStudyDataForLocale(locale);
        break;
      default:
        return [];
    }

    // 新しいフォーマット(questionsプロパティを持つオブジェクト)または古いフォーマット(配列)に対応
    const rawQuestions: unknown[] = Array.isArray(rawData)
      ? rawData
      : Array.isArray((rawData as { questions?: unknown[] })?.questions)
        ? ((rawData as { questions?: unknown[] }).questions ?? [])
        : [];
    const diagnostics = createLessonLoadDiagnostics();
    const questions = rawQuestions.reduce<Question[]>((acc: Question[], rawQuestion: unknown) => {
      const adapted = adaptRawQuestion(rawQuestion, diagnostics);
      if (adapted) {
        acc.push(adapted);
      }
      return acc;
    }, []);

    const { coreLevels, masteryLevels } = deriveQuestionGroups(unit, questions);
    const maxLevels = coreLevels.length > 0 ? Math.max(...coreLevels) : 1;

    const lessons: Lesson[] = [];
    const fallbackQuestionsPerLesson = 10;

    for (let level = 1; level <= maxLevels; level++) {
      const canonicalLessonId = getCanonicalLessonId(unit, "core", level);
      const lessonMetadata = getLessonRuntimeMetadata(canonicalLessonId);
      const targetQuestionCount = getLessonQuestionTarget(lessonMetadata, fallbackQuestionsPerLesson);
      // レベル専用の問題をIDでフィルタリング（例: mental_l01_xxx）
      const levelPrefix = `${unit}_l${String(level).padStart(2, '0')}_`;
      let levelQuestions = questions.filter(q =>
        q.source_id && q.source_id.startsWith(levelPrefix)
      );

      // source_id順でソートして、fallback補完時の順序を安定化させる
      levelQuestions.sort((a, b) => {
        if (a.source_id && b.source_id) {
          return a.source_id.localeCompare(b.source_id);
        }
        return 0;
      });

      let lessonQuestions: Question[] = [];

      if (levelQuestions.length >= targetQuestionCount) {
        lessonQuestions = levelQuestions.slice(0, targetQuestionCount);
      } else {
        // Case 2 (Partial) or Case 3 (Empty)
        lessonQuestions = levelQuestions;
      }

      // Duplication check (Level questions only)
      const ids = lessonQuestions.map(q => q.source_id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        diagnostics.duplicateQuestionIds += ids.length - uniqueIds.size;
      }

      // 足りない分を他の問題で補う
      if (lessonQuestions.length < targetQuestionCount) {
        const needed = targetQuestionCount - lessonQuestions.length;

        const otherQuestions = questions.filter(q =>
          !q.source_id || !q.source_id.startsWith(levelPrefix)
        );

        // Development: Use fixed order instead of random shuffle
        // Sort by source_id for consistent ordering
        const sorted = [...otherQuestions].sort((a, b) =>
          (a.source_id || '').localeCompare(b.source_id || '')
        );

        const fallbackQuestions = sorted.slice(0, needed);
        lessonQuestions = lessonQuestions.concat(fallbackQuestions);
        diagnostics.fallbackQuestionsFilled += fallbackQuestions.length;
      }

      lessons.push(
        buildLessonRecord({
          id: `${unit}_lesson_${level}`,
          unit,
          level,
          title: getLessonTitle(unit, level),
          questions: lessonQuestions,
          metadata: lessonMetadata ?? undefined,
        })
      );

      // Inject Black Hole Review after Level 5
      if (level === 5 && maxLevels > 5) {
        // Pick random 5 questions from pool for review
        // In a real app, this would be "mistakes"
        const reviewPool = questions.filter(q => q.source_id && !q.source_id.startsWith(`${unit}_l05`)); // Exclude just finished
        const reviewQuestions = [...reviewPool].sort(() => 0.5 - Math.random()).slice(0, 5);

        lessons.push(
          buildLessonRecord({
            id: `${unit}_review_bh1`,
            unit,
            level: 5.5,
            title: "ブラックホール復習",
            questions: reviewQuestions,
            nodeType: 'review_blackhole',
          })
        );
      }
    }

    for (const masteryLevel of masteryLevels) {
      const canonicalLessonId = getCanonicalLessonId(unit, "mastery", masteryLevel);
      const lessonMetadata = getLessonRuntimeMetadata(canonicalLessonId);
      const targetQuestionCount = getLessonQuestionTarget(
        lessonMetadata,
        getQuestionCountRangeForLoadScore({
          cognitive: 2,
          emotional: 2,
          behavior_change: 1,
          total: 5,
        }).target
      );
      const masteryPrefix = `${unit}_m${String(masteryLevel).padStart(2, '0')}_`;
      const masteryQuestions = questions
        .filter((question) => question.source_id && question.source_id.startsWith(masteryPrefix))
        .sort((left, right) => (left.source_id || '').localeCompare(right.source_id || ''));

      if (masteryQuestions.length === 0) continue;

      lessons.push(
        buildLessonRecord({
          id: `${unit}_m${String(masteryLevel).padStart(2, '0')}`,
          unit,
          level: maxLevels + masteryLevel,
          title: `Mastery ${masteryLevel}`,
          questions: masteryQuestions.slice(0, targetQuestionCount),
          metadata: lessonMetadata ?? undefined,
        })
      );
    }

    warnLessonLoadSummary(unit, diagnostics);
    return lessons;
  } catch (error) {
    console.error(`Failed to load lessons for unit ${unit}:`, error);
    return [];
  }
}

export function getQuestionFromId(lessonId: string, questionId: string): Question | undefined {
  const resolvedLessonId = resolveRuntimeLessonId(lessonId).resolvedLessonId ?? lessonId;
  const lessonMatch = resolvedLessonId.match(/^([a-z]+)_(?:lesson_(\d+)|l(\d+)|m(\d+))$/);
  const unit = lessonMatch?.[1];
  if (!unit) return undefined;

  const lessons = loadLessons(unit);
  const lessonNum = lessonMatch?.[2];
  const coreLevel = lessonMatch?.[3];
  const masteryLevel = lessonMatch?.[4];

  if (coreLevel || masteryLevel) {
    const directLesson = lessons.find((lesson) => lesson.id === resolvedLessonId);
    if (directLesson) {
      const directQuestion = directLesson.questions.find((question) => question.source_id === questionId);
      if (directQuestion) return directQuestion;
    }
  }

  // If lessonNum is provided, optimize search
  if (lessonNum) {
    const lessonIndex = parseInt(lessonNum, 10) - 1;
    const lesson = lessons[lessonIndex];
    if (lesson) {
      const q = lesson.questions.find(q => q.source_id === questionId);
      if (q) return q;
    }
  }

  // Fallback: Search all lessons in unit (in case lessonId format changes or is just unit)
  for (const lesson of lessons) {
    const q = lesson.questions.find(q => q.source_id === questionId);
    if (q) return q;
  }

  return undefined;
}

// 進捗状況を管理
export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  earnedXP: number;
  stars: number; // 0-3 (正答率に基づく)
}

export function calculateStars(correctAnswers: number, totalQuestions: number): number {
  const percentage = (correctAnswers / totalQuestions) * 100;
  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 50) return 1;
  return 0;
}
