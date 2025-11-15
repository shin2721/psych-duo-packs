import { Lesson, QuestionCard } from '../components/LessonScreen';

/**
 * Validation result type
 */
type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

/**
 * Validates a question card structure
 */
function validateQuestionCard(card: any, index: number): string[] {
  const errors: string[] = [];

  if (!card.id || typeof card.id !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'id' field`);
  }

  if (card.type !== 'mcq') {
    errors.push(`Question ${index + 1}: Invalid 'type' field (must be 'mcq')`);
  }

  if (!card.q || typeof card.q !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'q' (question text) field`);
  }

  if (!Array.isArray(card.choices) || card.choices.length < 2) {
    errors.push(`Question ${index + 1}: Invalid 'choices' array (must have at least 2 choices)`);
  } else {
    card.choices.forEach((choice: any, choiceIndex: number) => {
      if (typeof choice !== 'string') {
        errors.push(`Question ${index + 1}, Choice ${choiceIndex + 1}: Choice must be a string`);
      }
    });
  }

  if (typeof card.answerIndex !== 'number') {
    errors.push(`Question ${index + 1}: Missing or invalid 'answerIndex' field`);
  } else if (card.answerIndex < 0 || card.answerIndex >= (card.choices?.length || 0)) {
    errors.push(`Question ${index + 1}: 'answerIndex' is out of range`);
  }

  if (!card.explain || typeof card.explain !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'explain' field`);
  }

  return errors;
}

/**
 * Validates lesson data structure
 * @param data - The lesson data to validate
 * @returns ValidationResult with isValid flag and error messages
 */
export function validateLessonData(data: any): ValidationResult {
  const errors: string[] = [];

  // Check if data exists
  if (!data) {
    return { isValid: false, errors: ['Lesson data is null or undefined'] };
  }

  // Validate top-level fields
  if (!data.id || typeof data.id !== 'string') {
    errors.push("Missing or invalid 'id' field");
  }

  // Validate meta object
  if (!data.meta || typeof data.meta !== 'object') {
    errors.push("Missing or invalid 'meta' object");
  } else {
    if (!data.meta.theme || typeof data.meta.theme !== 'string') {
      errors.push("Missing or invalid 'meta.theme' field");
    }
    if (!data.meta.track || typeof data.meta.track !== 'string') {
      errors.push("Missing or invalid 'meta.track' field");
    }
    if (!data.meta.arc || typeof data.meta.arc !== 'string') {
      errors.push("Missing or invalid 'meta.arc' field");
    }
    if (typeof data.meta.totalQuestions !== 'number' || data.meta.totalQuestions <= 0) {
      errors.push("Missing or invalid 'meta.totalQuestions' field (must be a positive number)");
    }
  }

  // Validate cards array
  if (!Array.isArray(data.cards)) {
    errors.push("Missing or invalid 'cards' array");
  } else {
    if (data.cards.length === 0) {
      errors.push("'cards' array is empty");
    }

    // Check if totalQuestions matches cards length
    if (data.meta?.totalQuestions && data.cards.length !== data.meta.totalQuestions) {
      errors.push(
        `'meta.totalQuestions' (${data.meta.totalQuestions}) doesn't match actual cards count (${data.cards.length})`
      );
    }

    // Validate each card
    data.cards.forEach((card: any, index: number) => {
      const cardErrors = validateQuestionCard(card, index);
      errors.push(...cardErrors);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a fallback lesson for error cases
 */
export function createFallbackLesson(): Lesson {
  return {
    id: 'fallback',
    meta: {
      theme: 'エラー: レッスンを読み込めませんでした',
      track: 'error',
      arc: 'フォールバック',
      totalQuestions: 1,
    },
    cards: [
      {
        id: 'fallback_001',
        type: 'mcq',
        q: 'レッスンデータの読み込みに失敗しました。JSONファイルを確認してください。',
        choices: [
          'JSONファイルの形式を確認する',
          'アプリを再起動する',
          '開発者に連絡する',
          'もう一度試す',
        ],
        answerIndex: 0,
        explain:
          'data/lessons/ディレクトリ内のJSONファイルが正しい形式かどうか確認してください。',
      },
    ],
  };
}
