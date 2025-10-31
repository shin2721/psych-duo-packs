import { Question } from "../components/QuestionRenderer";

// トップレベルでJSONファイルをインポート（Metro bundlerが確実に認識するため）
import mentalQuestions from "../data/lessons/mental.json";

export interface Lesson {
  id: string;
  unit: string;
  level: number;
  title: string;
  questions: Question[];
  totalXP: number;
}

// 新しいデータ形式を古い形式に変換
function adaptQuestion(raw: any): Question {
  const adapted: any = {
    type: raw.type || "multiple_choice",
    question: raw.content?.prompt || raw.stem || raw.question || "質問",
    choices: raw.content?.options || raw.choices || [],
    correct_index: raw.correct_answer ?? raw.answer_index ?? raw.correct_index ?? 0,
    explanation: raw.explanation || "",
    source_id: raw.id || "",
    difficulty: raw.difficulty === 1 ? "easy" : raw.difficulty === 3 ? "hard" : "medium",
    xp: 5
  };

  // select_all: correct_answers を追加
  if (raw.type === "select_all" && raw.correct_answers) {
    adapted.correct_answers = raw.correct_answers;
  }

  // swipe_judgment: is_true と statement を追加
  if (raw.type === "swipe_judgment") {
    adapted.statement = raw.content?.statement || raw.statement || adapted.question;
    adapted.is_true = raw.correct_answer === "right";
  }

  // sort_order: items と correct_order を追加
  if (raw.type === "sort_order") {
    adapted.items = raw.content?.items || raw.items || [];
    adapted.correct_order = raw.correct_order || [];
    const itemCount = adapted.items.length;
    const shuffled = Array.from({length: itemCount}, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    adapted.initial_order = shuffled;
  }

  // matching: left_items, right_items, correct_pairs を追加
  if (raw.type === "matching") {
    adapted.left_items = raw.content?.left_items || raw.left_items || [];
    adapted.right_items = raw.content?.right_items || raw.right_items || [];
    adapted.correct_pairs = raw.correct_pairs || [];
  }

  // conversation: your_response_prompt を追加
  if (raw.type === "conversation") {
    adapted.your_response_prompt = raw.content?.your_response_prompt || raw.your_response_prompt || "";
  }

  return adapted;
}

// JSONファイルからレッスンデータを生成
export function loadLessons(unit: string): Lesson[] {
  try {
    // 事前にインポートされたJSONを使用
    let rawData: any = null;
    switch (unit) {
      case "mental":
        rawData = mentalQuestions;
        break;
      default:
        return [];
    }

    // 新しいフォーマット(questionsプロパティを持つオブジェクト)または古いフォーマット(配列)に対応
    const rawQuestions = Array.isArray(rawData) ? rawData : (rawData.questions || []);

    const questions = rawQuestions.map(adaptQuestion);

    console.log(`[loadLessons] ${unit}: ${questions.length} questions total`);

    // 6レベル分のレッスンを生成（各15問）
    const lessons: Lesson[] = [];
    const questionsPerLesson = 15;

    for (let level = 1; level <= 6; level++) {
      const startIdx = (level - 1) * questionsPerLesson;
      const endIdx = startIdx + questionsPerLesson;

      // もし質問が足りない場合は、最初から繰り返す
      let lessonQuestions: any[] = [];
      if (questions.length >= endIdx) {
        lessonQuestions = questions.slice(startIdx, endIdx);
      } else if (questions.length > startIdx) {
        // 残りの問題を使い切って、最初から足りない分を補う
        lessonQuestions = questions.slice(startIdx);
        const needed = questionsPerLesson - lessonQuestions.length;
        lessonQuestions = lessonQuestions.concat(questions.slice(0, needed));
      } else {
        // 全く足りない場合は最初から繰り返す
        const repeatCount = Math.ceil(questionsPerLesson / questions.length);
        for (let i = 0; i < repeatCount; i++) {
          lessonQuestions = lessonQuestions.concat(questions);
        }
        lessonQuestions = lessonQuestions.slice(0, questionsPerLesson);
      }

      const totalXP = lessonQuestions.reduce((sum, q) => sum + q.xp, 0);
      const lessonTitle = rawData.title || getLessonTitle(unit, level);

      lessons.push({
        id: `${unit}_lesson_${level}`,
        unit,
        level,
        title: lessonTitle,
        questions: lessonQuestions,
        totalXP,
      });
    }

    console.log(`[loadLessons] Created ${lessons.length} lessons for ${unit}`);
    return lessons;
  } catch (error) {
    console.error(`Failed to load lessons for unit ${unit}:`, error);
    return [];
  }
}

// レッスンタイトルを生成（10レッスン対応）
function getLessonTitle(unit: string, level: number): string {
  const titles: Record<string, string[]> = {
    mental: [
      "呼吸法の基礎", "マインドフルネス入門", "認知的再評価",
      "感情調整", "ストレス軽減", "不安対処",
      "リラクゼーション", "バイオフィードバック", "瞑想実践", "総合演習"
    ],
    money: [
      "予算管理の基本", "衝動買い防止", "貯金戦略",
      "支出記録", "金融リテラシー", "計画的支出",
      "自動貯金", "家計簿活用", "投資の基礎", "総合演習"
    ],
    work: [
      "生産性向上の秘訣", "時間管理術", "先延ばし撃退",
      "タスク分割", "優先順位付け", "集中力向上",
      "目標設定", "効率化テク", "休憩の取り方", "総合演習"
    ],
    health: [
      "運動習慣の作り方", "睡眠の科学", "栄養バランス",
      "有酸素運動", "筋力トレーニング", "睡眠衛生",
      "水分補給", "ストレッチ", "健康診断", "総合演習"
    ],
    social: [
      "共感力を高める", "コミュニケーション術", "関係性の構築",
      "積極的傾聴", "感謝の表現", "対立解決",
      "境界線設定", "信頼構築", "社会的つながり", "総合演習"
    ],
    study: [
      "効果的な学習法", "記憶定着のコツ", "テスト効果の活用",
      "分散学習", "想起練習", "自己説明",
      "メタ認知", "反復練習", "教える学習", "総合演習"
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
