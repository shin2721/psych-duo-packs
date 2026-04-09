import { Question } from "../types/question";

// トップレベルでJSONファイルをインポート（Metro bundlerが確実に認識するため）
// Force reload: 2025-11-13 21:20
import { getMentalDataForLocale } from "../data/lessons/mental_units";
import { getMoneyDataForLocale } from "../data/lessons/money_units";
import { getWorkDataForLocale } from "../data/lessons/work_units";
import { getHealthDataForLocale } from "../data/lessons/health_units";
import { getSocialDataForLocale } from "../data/lessons/social_units";
import { getStudyDataForLocale } from "../data/lessons/study_units";
import i18n from "./i18n";
import {
  adaptRawQuestion,
  createLessonLoadDiagnostics,
  warnLessonLoadSummary,
} from "./lesson-data/lessonQuestionAdapter";
import { getLessonTitle } from "./lesson-data/lessonTitles";

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
  references?: Reference[];
  context_note?: string;
  research_meta?: ResearchMeta;
  nodeType?: 'lesson' | 'review_blackhole';
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

    // レベル数を決定 (実際のレッスンデータから取得)
    // Count unique prefixes like mental_l01_, mental_l02_, etc.
    const levelPrefixes = new Set<number>();
    questions.forEach(q => {
      if (q.source_id) {
        const match = q.source_id.match(new RegExp(`^${unit}_l(\\d+)_`));
        if (match) {
          levelPrefixes.add(parseInt(match[1], 10));
        }
      }
    });
    const maxLevels = levelPrefixes.size > 0 ? Math.max(...levelPrefixes) : 1;

    const lessons: Lesson[] = [];
    const questionsPerLesson = 10; // 1レッスンあたりの問題数（原則10問）

    for (let level = 1; level <= maxLevels; level++) {
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

      // レベル専用の問題が10問以上ある場合はそれを使用
      if (levelQuestions.length >= questionsPerLesson) {
        lessonQuestions = levelQuestions.slice(0, questionsPerLesson);
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
      if (lessonQuestions.length < questionsPerLesson) {
        const needed = questionsPerLesson - lessonQuestions.length;

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

      const totalXP = lessonQuestions.reduce((sum, q) => sum + q.xp, 0);
      const lessonTitle = getLessonTitle(unit, level);

      // Get references from lesson questions' expanded_details
      let references: Reference[] = [];
      let context_note: string | undefined;
      let research_meta: ResearchMeta | undefined;

      // Extract source_id from first question as reference
      const firstQuestion = lessonQuestions[0];
      if (firstQuestion?.source_id) {
        const sourceMatch = firstQuestion.source_id.match(/^[a-z]+_l\d+_(.+)$/);
        if (sourceMatch) {
          references = [{
            citation: sourceMatch[1].replace(/_/g, ' '),
            note: "主要参照",
            level: firstQuestion.evidence_grade || "silver"
          }];
        }
      }

      lessons.push({
        id: `${unit}_lesson_${level}`,
        unit,
        level,
        title: lessonTitle,
        questions: lessonQuestions,
        totalXP,
        references,
        context_note,
        research_meta,
        nodeType: 'lesson'
      });

      // Inject Black Hole Review after Level 5
      if (level === 5 && maxLevels > 5) {
        // Pick random 5 questions from pool for review
        // In a real app, this would be "mistakes"
        const reviewPool = questions.filter(q => q.source_id && !q.source_id.startsWith(`${unit}_l05`)); // Exclude just finished
        const reviewQuestions = [...reviewPool].sort(() => 0.5 - Math.random()).slice(0, 5);

        lessons.push({
          id: `${unit}_review_bh1`,
          unit,
          level: 5.5,
          title: "ブラックホール復習",
          questions: reviewQuestions,
          totalXP: 100,
          nodeType: 'review_blackhole',
          // Use hard mode visuals?
        });
      }
    }

    warnLessonLoadSummary(unit, diagnostics);
    return lessons;
  } catch (error) {
    console.error(`Failed to load lessons for unit ${unit}:`, error);
    return [];
  }
}

export function getQuestionFromId(lessonId: string, questionId: string): Question | undefined {
  // lessonId format: "{unit}_lesson_{level}" e.g. "mental_lesson_1"
  const [unit, lessonNum] = lessonId.split("_lesson_");
  if (!unit) return undefined;

  const lessons = loadLessons(unit);

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
