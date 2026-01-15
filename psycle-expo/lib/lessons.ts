import { Question } from "../types/question";

// トップレベルでJSONファイルをインポート（Metro bundlerが確実に認識するため）
// Force reload: 2025-11-13 21:20
import { mentalData, mentalData_ja } from "../data/lessons/mental_units";
import { moneyData, moneyData_ja } from "../data/lessons/money_units";
import { workData } from "../data/lessons/work_units";
import { healthData } from "../data/lessons/health_units";
import { socialData, socialData_ja } from "../data/lessons/social_units";
import { studyData } from "../data/lessons/study_units";
import i18n from "./i18n";

// Curriculum data for dynamic titles
import mentalCurriculum from "../data/curriculum_mental.json";
import moneyCurriculum from "../data/curriculum_Money.json";
import workCurriculum from "../data/curriculum_Work.json";
import healthCurriculum from "../data/curriculum_Health.json";
import socialCurriculum from "../data/curriculum_Social.json";
import studyCurriculum from "../data/curriculum_Study.json";

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



// 新しいデータ形式を古い形式に変換
function adaptQuestion(raw: any): Question {
  // タイプ変換マップ
  const typeMap: Record<string, string> = {
    'truefalse': 'true_false',
    'mcq3': 'multiple_choice',
    'ab': 'multiple_choice',
    'cloze1': 'fill_blank',
    'cloze2': 'fill_blank',
    'cloze3': 'fill_blank',
    'clozeN': 'fill_blank',
    'rank': 'sort_order',
  };

  const rawType = raw.type || "multiple_choice";
  const mappedType = typeMap[rawType] || rawType;

  const adapted: any = {
    type: mappedType,
    question: raw.content?.prompt || raw.stem || raw.question || raw.text || "質問",
    choices: raw.content?.options || raw.choices || raw.bank || [],
    correct_index: raw.correct_answer ?? raw.answer_index ?? raw.correct_index ?? 0,
    explanation: raw.snack || raw.explanation || "",
    source_id: raw.id || "",
    difficulty: raw.difficulty === 1 ? "easy" : raw.difficulty === 3 ? "hard" : "medium",
    xp: 5,
    // Multimedia fields
    image: raw.image,
    audio: raw.audio,
    imageCaption: raw.imageCaption,
    actionable_advice: raw.actionable_advice,
    evidence_grade: raw.evidence_grade,
    evidence_text: raw.evidence_text,
    // Expandable Depth fields
    expanded_details: raw.expanded_details,
  };

  // select_all: correct_answers を追加
  if (raw.type === "select_all" && raw.correct_answers) {
    adapted.correct_answers = raw.correct_answers;
  }

  // swipe_judgment: is_true と statement を追加
  if (raw.type === "swipe_judgment") {
    adapted.statement = raw.content?.statement || raw.statement || adapted.question;
    adapted.is_true = raw.is_true !== undefined ? raw.is_true : (raw.correct_answer === "right" || raw.correct_answer === "True");
    adapted.swipe_labels = raw.swipe_labels;
  }

  // sort_order: items と correct_order を追加
  if (raw.type === "sort_order") {
    adapted.items = raw.content?.items || raw.items || [];
    adapted.correct_order = raw.correct_order || [];
    const itemCount = adapted.items.length;
    const shuffled = Array.from({ length: itemCount }, (_, i) => i);
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

  // conversation: your_response_prompt と prompt を追加
  if (raw.type === "conversation") {
    adapted.your_response_prompt = raw.content?.your_response_prompt || raw.your_response_prompt || "";
    adapted.prompt = raw.content?.prompt || raw.prompt || ""; // Short prompt for chat bubble
  }

  // quick_reflex: time_limit を追加
  if (raw.type === "quick_reflex") {
    adapted.time_limit = raw.time_limit || 2000;
  }

  // consequence_scenario: consequence_type を追加
  if (raw.type === "consequence_scenario") {
    adapted.consequence_type = raw.consequence_type;
  }

  // term_card: term, definition, key_points を追加
  if (raw.type === "term_card") {
    adapted.term = raw.term;
    adapted.term_en = raw.term_en;
    adapted.definition = raw.definition;
    adapted.key_points = raw.key_points;
  }

  // swipe_choice: answer を追加 (QuestionRendererで使う)
  if (raw.type === "swipe_choice") {
    adapted.answer = raw.answer;
  }


  // micro_input: input_answer と placeholder を追加
  if (raw.type === "micro_input") {
    adapted.input_answer = raw.input_answer || "";
    adapted.placeholder = raw.placeholder || "答えを入力";
  }

  return adapted;
}

// JSONファイルからレッスンデータを生成
export function loadLessons(unit: string): Lesson[] {
  try {
    // 事前にインポートされたJSONを使用
    let rawData: any = null;
    const isJa = i18n.locale === 'ja' || i18n.locale.startsWith('ja');

    switch (unit) {
      case "mental":
        rawData = isJa && (mentalData_ja as any) ? mentalData_ja : mentalData;
        break;
      case "money":
        rawData = isJa && (moneyData_ja as any) ? moneyData_ja : moneyData;
        break;
      case "work":
        rawData = workData;
        break;
      case "health":
        // rawData = isJa && (healthData_ja as any) ? healthData_ja : healthData;
        rawData = healthData;
        break;
      case "social":
        rawData = isJa && (socialData_ja as any) ? socialData_ja : socialData;
        break;
      case "study":
        rawData = studyData;
        break;
      default:
        return [];
    }

    // 新しいフォーマット(questionsプロパティを持つオブジェクト)または古いフォーマット(配列)に対応
    const rawQuestions = Array.isArray(rawData) ? rawData : (rawData.questions || []);

    const questions: Question[] = rawQuestions.map(adaptQuestion);

    console.log(`[loadLessons] ${unit}: ${questions.length} questions total`);

    // レベル数を決定 (Curriculumから取得)
    let maxLevels = 10;
    const curricula: Record<string, any> = {
      mental: mentalCurriculum,
      money: moneyCurriculum,
      work: workCurriculum,
      health: healthCurriculum,
      social: socialCurriculum,
      study: studyCurriculum
    };

    if (curricula[unit]) {
      maxLevels = curricula[unit].units.length;
    }

    const lessons: Lesson[] = [];
    const questionsPerLesson = 10; // 1レッスンあたりの問題数（原則10問）

    for (let level = 1; level <= maxLevels; level++) {
      // レベル専用の問題をIDでフィルタリング（例: mental_l01_xxx）
      const levelPrefix = `${unit}_l${String(level).padStart(2, '0')}_`;
      let levelQuestions = questions.filter(q =>
        q.source_id && q.source_id.startsWith(levelPrefix)
      );

      // IDの降順でソート（新しいコンテンツ mental_l01_stress_... を mental_l01_001 より優先するため）
      // User reported duplicates. Sort ascending now?
      // I changed it to ascending in prev step but let's confirm.
      // And log IDs.
      levelQuestions.sort((a, b) => {
        if (a.source_id && b.source_id) {
          return a.source_id.localeCompare(b.source_id);
        }
        return 0;
      });

      let lessonQuestions: any[] = [];
      console.log(`[loadLessons Debug] Unit: ${unit} Level: ${level}`);
      console.log(`[loadLessons Debug] Level prefix: ${levelPrefix}`);
      console.log(`[loadLessons Debug] Found level questions: ${levelQuestions.length}`);
      levelQuestions.forEach(q => console.log(`  - ${q.source_id}`)); // Trace IDs

      // レベル専用の問題が15問ある場合はそれを使用
      if (levelQuestions.length >= questionsPerLesson) {
        lessonQuestions = levelQuestions.slice(0, questionsPerLesson);
        console.log(`[loadLessons Debug] Case 1: Taking exact slice. Length: ${lessonQuestions.length}`);
      } else {
        // Case 2 (Partial) or Case 3 (Empty)
        lessonQuestions = levelQuestions;
        const needed = questionsPerLesson - lessonQuestions.length;
        console.log(`[loadLessons Debug] Case 2/3: Partial/Empty. Count: ${lessonQuestions.length}, Need: ${needed}`);
      }

      // Duplication check (Level questions only)
      const ids = lessonQuestions.map(q => q.source_id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.warn(`[loadLessons WARN] DUPLICATES DETECTED in L${level}!`, ids);
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

        lessonQuestions = lessonQuestions.concat(sorted.slice(0, needed));
        console.log(`[loadLessons Debug] Filled ${needed} questions from pool (fixed order).`);
      }

      const totalXP = lessonQuestions.reduce((sum, q) => sum + q.xp, 0);
      const lessonTitle = getLessonTitle(unit, level);

      // Get references, context_note, and research_meta from curriculum
      let references: Reference[] = [];
      let context_note: string | undefined;
      let research_meta: ResearchMeta | undefined;

      if (curricula[unit]) {
        const curriculumUnit = curricula[unit].units.find((u: any) => u.level === level);
        if (curriculumUnit) {
          // Use curriculum source as reference
          if (curriculumUnit.source) {
            references = [{
              citation: curriculumUnit.source,
              note: "主要参照文献",
              level: "silver"
            }];
            // Generate context_note from source (fallback)
            context_note = `このレッスンは「${curriculumUnit.source.split('.')[0]}」の研究に基づいています。臨床や実践の現場で長年使用され、効果が確認されているアプローチです。`;
          }
          // If curriculum has explicit references, use those
          if (curriculumUnit.references) {
            references = curriculumUnit.references;
          }
          if (curriculumUnit.context_note) {
            context_note = curriculumUnit.context_note;
          }
          // Load research_meta if available
          if (curriculumUnit.research_meta) {
            research_meta = curriculumUnit.research_meta;
          }
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
        console.log(`[loadLessons] Injected Black Hole Review after Level 5`);
      }
    }

    console.log(`[loadLessons] Created ${lessons.length} lessons for ${unit}`);
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

// レッスンタイトルを生成
function getLessonTitle(unit: string, level: number): string {
  const curricula: Record<string, any> = {
    mental: mentalCurriculum,
    money: moneyCurriculum,
    work: workCurriculum,
    health: healthCurriculum,
    social: socialCurriculum,
    study: studyCurriculum
  };

  if (curricula[unit]) {
    const curriculumUnit = curricula[unit].units.find((u: any) => u.level === level);
    if (curriculumUnit) {
      return curriculumUnit.title;
    }
  }

  // Fallback titles (legacy)
  const titles: Record<string, string[]> = {
    // Mentalは上記で処理されるため削除、またはフォールバックとして残す
    mental: [
      "呼吸法の基礎", "マインドフルネス入門", "認知的再評価",
      "感情調整", "ストレス軽減", "不安対処",
      "認知行動療法(CBT)", "脳科学と感情", "レジリエンス構築", "不安障害の最新研究"
    ],
    money: [
      "予算管理の基本", "衝動買い防止", "貯金戦略",
      "支出記録", "金融リテラシー", "計画的支出",
      "行動経済学の応用", "損失回避の心理", "時間割引と意思決定", "複利の心理学"
    ],
    work: [
      "生産性向上の秘訣", "時間管理術", "先延ばし撃退",
      "タスク分割", "優先順位付け", "集中力向上",
      "フロー状態の科学", "認知負荷理論", "バーンアウト予防", "ディープワーク実践"
    ],
    health: [
      "運動習慣の作り方", "睡眠の科学", "栄養バランス",
      "有酸素運動", "筋力トレーニング", "睡眠衛生",
      "睡眠アーキテクチャ", "概日リズムの最適化", "腸脳相関", "HIIT生理学"
    ],
    social: [
      "共感力を高める", "コミュニケーション術", "関係性の構築",
      "積極的傾聴", "感謝の表現", "対立解決",
      "愛着理論の応用", "社会的ベースライン", "オキシトシン動態", "紛争解決の科学"
    ],
    study: [
      "効果的な学習法", "記憶定着のコツ", "テスト効果の活用",
      "分散学習", "想起練習", "自己説明",
      "間隔反復アルゴリズム", "メタ認知戦略", "二重符号化理論", "交互学習の科学"
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
