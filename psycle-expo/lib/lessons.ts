import { Question } from "../components/QuestionRenderer";

export interface Lesson {
  id: string;
  unit: string;
  level: number;
  title: string;
  questions: Question[];
  totalXP: number;
}

// JSONファイルからレッスンデータを生成
export function loadLessons(unit: string): Lesson[] {
  try {
    // JSONファイルを直接require（静的インポート）
    let questions: Question[] = [];
    switch (unit) {
      case "mental":
        questions = require("../data/lessons/mental.json");
        break;
      case "money":
        questions = require("../data/lessons/money.json");
        break;
      case "work":
        questions = require("../data/lessons/work.json");
        break;
      case "health":
        questions = require("../data/lessons/health.json");
        break;
      case "social":
        questions = require("../data/lessons/social.json");
        break;
      case "study":
        questions = require("../data/lessons/study.json");
        break;
      default:
        return [];
    }

    // 5問ずつ3レッスンに分割
    const lessons: Lesson[] = [];
    const questionsPerLesson = 5;
    const totalLessons = Math.ceil(questions.length / questionsPerLesson);

    for (let i = 0; i < totalLessons; i++) {
      const startIndex = i * questionsPerLesson;
      const lessonQuestions = questions.slice(startIndex, startIndex + questionsPerLesson);
      const totalXP = lessonQuestions.reduce((sum, q) => sum + q.xp, 0);

      lessons.push({
        id: `${unit}_lesson_${i + 1}`,
        unit,
        level: i + 1,
        title: getLessonTitle(unit, i + 1),
        questions: lessonQuestions,
        totalXP,
      });
    }

    return lessons;
  } catch (error) {
    console.error(`Failed to load lessons for unit ${unit}:`, error);
    return [];
  }
}

// レッスンタイトルを生成
function getLessonTitle(unit: string, level: number): string {
  const titles: Record<string, string[]> = {
    mental: [
      "呼吸法の基礎",
      "マインドフルネス入門",
      "認知的再評価",
    ],
    money: [
      "予算管理の基本",
      "衝動買い防止",
      "貯金戦略",
    ],
    work: [
      "生産性向上の秘訣",
      "時間管理術",
      "先延ばし撃退",
    ],
    health: [
      "運動習慣の作り方",
      "睡眠の科学",
      "栄養バランス",
    ],
    social: [
      "共感力を高める",
      "コミュニケーション術",
      "関係性の構築",
    ],
    study: [
      "効果的な学習法",
      "記憶定着のコツ",
      "テスト効果の活用",
    ],
  };

  return titles[unit]?.[level - 1] || `レッスン${level}`;
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
