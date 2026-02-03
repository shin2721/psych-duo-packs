#!/usr/bin/env node

/**
 * Lesson JSON Validator (Enhanced)
 * 
 * レッスンJSONファイルとEvidence Cardの品質チェック
 * 仕様詳細は docs/PRINCIPLES.md を参照
 */

import * as fs from 'fs';
import * as path from 'path';

// 設定
const LESSON_DIRS = [
  'data/lessons/mental_units',
  'data/lessons/money_units', 
  'data/lessons/work_units',
  'data/lessons/health_units',
  'data/lessons/social_units',
  'data/lessons/study_units'
];

const STAGING_DIRS = [
  'data/lessons/_staging/mental_units',
  'data/lessons/_staging/money_units',
  'data/lessons/_staging/work_units', 
  'data/lessons/_staging/health_units',
  'data/lessons/_staging/social_units',
  'data/lessons/_staging/study_units'
];

const ALLOWED_EVIDENCE_GRADES = ['gold', 'silver', 'bronze'];
const ALLOWED_QUESTION_TYPES = [
  'ab', 'mcq3', 'truefalse', 'cloze1', 'swipe_judgment', 'select_all',
  'sort_order', 'matching', 'consequence_scenario', 'conversation', 'term_card',
  'multiple_choice', 'true_false', 'fill_blank' // legacy support
];

const MAX_QUESTION_LENGTH = 200;
const MAX_EXPLANATION_LENGTH = 300;

interface ValidationError {
  file: string;
  type: 'error' | 'warning';
  message: string;
  questionId?: string;
}

interface Question {
  id: string;
  type: string;
  question: string;
  explanation: string;
  difficulty?: string;
  xp?: number;
  evidence_grade?: string;
  [key: string]: any;
}

interface EvidenceCard {
  source_type: string;
  citation: {
    doi?: string;
    pmid?: string;
    url?: string;
  };
  claim: string;
  limitations: string;
  evidence_grade: string;
  generated_by: string;
  review: {
    critic_score: number;
    human_approved: boolean;
    reviewer: string;
  };
}

class LessonValidator {
  private errors: ValidationError[] = [];
  private allIds: Set<string> = new Set();

  validate(): boolean {
    console.log('🔍 レッスンバリデーション開始...\n');

    // 本番ディレクトリ（エラー扱い）
    for (const dir of LESSON_DIRS) {
      this.validateDirectory(dir, 'error');
    }

    // stagingディレクトリ（警告扱い）
    for (const dir of STAGING_DIRS) {
      this.validateDirectory(dir, 'warning');
    }

    this.printResults();
    
    // エラーがあれば失敗
    const hasErrors = this.errors.some(e => e.type === 'error');
    return !hasErrors;
  }

  private validateDirectory(dirPath: string, severity: 'error' | 'warning'): void {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ja.json'));
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      this.validateFile(filePath, severity);
    }
  }

  private validateFile(filePath: string, severity: 'error' | 'warning'): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lessons: Question[] = JSON.parse(content);

      if (!Array.isArray(lessons)) {
        this.addError(filePath, severity, 'ファイルは配列である必要があります');
        return;
      }

      // Evidence Card チェック
      this.validateEvidenceCard(filePath, severity);

      // レッスン内ID重複チェック
      const lessonIds = new Set<string>();
      
      for (const [index, question] of lessons.entries()) {
        const questionContext = `問題${index + 1}`;
        
        // 必須フィールドチェック
        this.validateRequiredFields(filePath, severity, question);
        
        // ID重複チェック（レッスン内）
        if (question.id) {
          if (lessonIds.has(question.id)) {
            this.addError(filePath, severity, `ID重複（レッスン内）: ${question.id}`, question.id);
          }
          lessonIds.add(question.id);

          // ID重複チェック（全体）
          if (this.allIds.has(question.id)) {
            this.addError(filePath, severity, `ID重複（全体）: ${question.id}`, question.id);
          }
          this.allIds.add(question.id);

          // ID形式チェック
          this.validateIdFormat(filePath, severity, question.id);
        }

        // 型チェック
        this.validateTypes(filePath, severity, question);
        
        // 文字数チェック
        this.validateLength(filePath, severity, question);
        
        // evidence_gradeチェック
        this.validateEvidenceGrade(filePath, severity, question);
      }

      // レッスン構成チェック（10問推奨）
      if (lessons.length !== 10) {
        this.addError(filePath, severity === 'error' ? 'warning' : 'warning', 
          `問題数が10問ではありません: ${lessons.length}問`);
      }

    } catch (error) {
      this.addError(filePath, severity, `JSONパースエラー: ${error.message}`);
    }
  }

  private validateEvidenceCard(lessonPath: string, severity: 'error' | 'warning'): void {
    const evidencePath = lessonPath.replace('.ja.json', '.evidence.json');
    
    if (!fs.existsSync(evidencePath)) {
      this.addError(lessonPath, severity, 'Evidence Cardが見つかりません');
      return;
    }

    try {
      const evidenceContent = fs.readFileSync(evidencePath, 'utf-8');
      const evidence: EvidenceCard = JSON.parse(evidenceContent);

      // 必須フィールドチェック
      const requiredFields = ['source_type', 'citation', 'claim', 'limitations', 'evidence_grade', 'generated_by', 'review'];
      for (const field of requiredFields) {
        if (!evidence[field]) {
          this.addError(evidencePath, severity, `Evidence Card必須フィールド不足: ${field}`);
        }
      }

      // evidence_grade一致チェック
      if (evidence.evidence_grade && !ALLOWED_EVIDENCE_GRADES.includes(evidence.evidence_grade)) {
        this.addError(evidencePath, severity, `無効なevidence_grade: ${evidence.evidence_grade}`);
      }

      // 本番配置時のhuman_approved チェック
      const isProduction = !lessonPath.includes('_staging');
      if (isProduction && evidence.review && !evidence.review.human_approved) {
        this.addError(evidencePath, 'error', '本番配置にはhuman_approved=trueが必要です');
      }

    } catch (error) {
      this.addError(evidencePath, severity, `Evidence Card JSONパースエラー: ${error.message}`);
    }
  }

  private validateIdFormat(filePath: string, severity: 'error' | 'warning', id: string): void {
    // ID形式: {domain}_lNN_NNN
    const idPattern = /^(mental|money|work|health|social|study)_l\d+_\d+$/;
    if (!idPattern.test(id)) {
      this.addError(filePath, severity, `ID形式が不正: ${id} (期待形式: {domain}_lNN_NNN)`, id);
    }
  }

  private validateRequiredFields(filePath: string, severity: 'error' | 'warning', 
                                question: Question): void {
    const required = ['id', 'type', 'question', 'explanation', 'difficulty', 'xp', 'evidence_grade'];
    
    for (const field of required) {
      if (!question[field]) {
        this.addError(filePath, severity, `必須フィールド不足: ${field}`, question.id);
      }
    }
  }

  private validateTypes(filePath: string, severity: 'error' | 'warning', 
                       question: Question): void {
    if (question.type && !ALLOWED_QUESTION_TYPES.includes(question.type)) {
      this.addError(filePath, severity, 
        `許可されていない問題タイプ: ${question.type}`, question.id);
    }
  }

  private validateLength(filePath: string, severity: 'error' | 'warning', 
                        question: Question): void {
    if (question.question && question.question.length > MAX_QUESTION_LENGTH) {
      this.addError(filePath, severity, 
        `問題文が長すぎます: ${question.question.length}文字 (上限${MAX_QUESTION_LENGTH})`, 
        question.id);
    }

    if (question.explanation && question.explanation.length > MAX_EXPLANATION_LENGTH) {
      this.addError(filePath, severity, 
        `解説が長すぎます: ${question.explanation.length}文字 (上限${MAX_EXPLANATION_LENGTH})`, 
        question.id);
    }
  }

  private validateEvidenceGrade(filePath: string, severity: 'error' | 'warning', 
                               question: Question): void {
    if (question.evidence_grade && !ALLOWED_EVIDENCE_GRADES.includes(question.evidence_grade)) {
      this.addError(filePath, severity, 
        `無効なevidence_grade: ${question.evidence_grade} (許可: ${ALLOWED_EVIDENCE_GRADES.join(', ')})`, 
        question.id);
    }
  }

  private addError(file: string, type: 'error' | 'warning', message: string, questionId?: string): void {
    this.errors.push({ file, type, message, questionId });
  }

  private printResults(): void {
    const errors = this.errors.filter(e => e.type === 'error');
    const warnings = this.errors.filter(e => e.type === 'warning');

    console.log('\n📊 バリデーション結果');
    console.log('==================');

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ 問題なし');
      return;
    }

    if (errors.length > 0) {
      console.log(`\n❌ エラー: ${errors.length}件`);
      for (const error of errors) {
        const location = error.questionId ? ` (${error.questionId})` : '';
        console.log(`  ${error.file}${location}: ${error.message}`);
      }
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  警告: ${warnings.length}件`);
      for (const warning of warnings) {
        const location = warning.questionId ? ` (${warning.questionId})` : '';
        console.log(`  ${warning.file}${location}: ${warning.message}`);
      }
    }

    console.log('\n📋 サマリー');
    console.log(`エラー: ${errors.length}件, 警告: ${warnings.length}件`);
    
    if (errors.length > 0) {
      console.log('\n❌ バリデーション失敗: エラーを修正してください');
    } else {
      console.log('\n✅ バリデーション成功: 警告がありますが続行可能です');
    }
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new LessonValidator();
  const success = validator.validate();
  process.exit(success ? 0 : 1);
}
