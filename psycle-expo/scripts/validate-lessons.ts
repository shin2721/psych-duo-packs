#!/usr/bin/env node

/**
 * Lesson JSON Validator (Enhanced)
 * 
 * レッスンJSONファイルとEvidence Cardの品質チェック
 * 仕様詳細は docs/PRINCIPLES.md を参照
 */

import * as fs from 'fs';
import * as path from 'path';
import * as themeManifestLib from './lib/theme-manifest.js';
import * as contentPackageLib from './lib/content-package.js';

const {
  inferThemeIdFromLessonPath,
  evaluateThemeManifestReadiness,
} = themeManifestLib as {
  inferThemeIdFromLessonPath: (lessonPath: string) => string | null;
  evaluateThemeManifestReadiness: (
    themeId: string,
    rootDir?: string,
    target?: 'production' | 'staging'
  ) => {
    ready: boolean;
    errors: string[];
    warnings: string[];
    manifestPath: string;
    manifest: Record<string, unknown> | null;
  };
};

const {
  evaluateContentPackageReadiness,
} = contentPackageLib as {
  evaluateContentPackageReadiness: (
    lessonPath: string,
    options?: { rootDir?: string; mode?: 'audit' | 'promote' }
  ) => {
    ready: boolean;
    errors: string[];
    warnings: string[];
  };
};

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
const ALLOWED_EXPIRY_ACTIONS = ['auto_hide', 'auto_demote', 'refresh_queue'];
const ALLOWED_SEVERITY_TIERS = ['A', 'B', 'C'];
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
  severity_tier?: 'A' | 'B' | 'C';
  review_sla_days?: number;
  expiry_action?: 'auto_hide' | 'auto_demote' | 'refresh_queue';
  last_verified?: string;
  last_verified_at?: string;
  next_review_due_at?: string;
  stale_route_owner?: string;
  refresh_value_reason_candidate?: string;
  review: {
    critic_score?: number;
    human_approved?: boolean;
    auto_approved?: boolean;
    approval_mode?: string;
    reviewer?: string;
    approval_reasons?: string[];
    evaluated_at?: string;
  };
  promotion?: {
    eligible?: boolean;
    reasons?: string[];
    warnings?: string[];
  };
  content_package?: {
    lesson_path?: string;
    evidence_path?: string;
    theme_manifest_path?: string;
    continuity_metadata_path?: string;
    analytics_contract_id?: string;
    analytics_contract_version?: number;
    analytics_schema_lineage?: string;
    analytics_backward_compat_until?: string;
    package_dependencies?: {
      requires_package_ids?: string[];
      dependency_rule?: string;
      invalidation_rule?: string;
    };
    owner_id?: string;
    state?: string;
    rollback_route?: string;
    rollback_class?: string;
    localized_locales?: string[];
    localization_owner?: string;
    approval_locale_set?: string[];
    semantic_parity_rule?: string;
    tone_guard?: string;
    readiness?: {
      quality_gate_pass?: boolean;
      dependency_valid?: boolean;
      continuity_complete?: boolean;
      analytics_wired?: boolean;
      rollback_defined?: boolean;
    };
    readiness_authority?: Record<
      string,
      {
        owner?: string;
        auto_source?: string;
        final_authority?: string;
      }
    >;
    completeness?: Record<string, boolean>;
    review_decision?: {
      change_type?: string;
      human_review_required?: boolean;
      approved_source?: string;
      reviewer_id?: string;
      review_reason?: string;
      reviewed_at?: string;
      rollback_trigger_if_reverted?: string;
    };
  };
}

interface LessonValidatorOptions {
  rootDir?: string;
  lessonDirs?: string[];
  stagingDirs?: string[];
}

export class LessonValidator {
  private errors: ValidationError[] = [];
  private allIds: Set<string> = new Set();
  private validatedThemes: Set<string> = new Set();
  private readonly rootDir: string;
  private readonly lessonDirs: string[];
  private readonly stagingDirs: string[];

  constructor(options: LessonValidatorOptions = {}) {
    this.rootDir = options.rootDir ?? process.cwd();
    this.lessonDirs = options.lessonDirs ?? LESSON_DIRS;
    this.stagingDirs = options.stagingDirs ?? STAGING_DIRS;
  }

  validate(): boolean {
    console.log('🔍 レッスンバリデーション開始...\n');

    // 本番ディレクトリ（エラー扱い）
    for (const dir of this.lessonDirs) {
      this.validateDirectory(dir, 'error');
    }

    // stagingディレクトリ（警告扱い）
    for (const dir of this.stagingDirs) {
      this.validateDirectory(dir, 'warning');
    }

    this.printResults();
    
    // エラーがあれば失敗
    const hasErrors = this.errors.some(e => e.type === 'error');
    return !hasErrors;
  }

  private validateDirectory(dirPath: string, severity: 'error' | 'warning'): void {
    const absoluteDirPath = path.isAbsolute(dirPath) ? dirPath : path.join(this.rootDir, dirPath);

    if (!fs.existsSync(absoluteDirPath)) {
      return;
    }

    const files = fs.readdirSync(absoluteDirPath).filter(f => f.endsWith('.ja.json'));
    
    for (const file of files) {
      const filePath = path.join(absoluteDirPath, file);
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

      this.validateThemeManifest(filePath, severity);
      this.validateContentPackage(filePath, severity);

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

      // レッスン構成チェック（5〜10問）
      if (lessons.length < 5 || lessons.length > 10) {
        this.addError(
          filePath,
          severity === 'error' ? 'warning' : 'warning',
          `問題数が想定レンジ外です: ${lessons.length}問 (期待: 5〜10問)`
        );
      }

    } catch (error) {
      this.addError(filePath, severity, `JSONパースエラー: ${error.message}`);
    }
  }

  private validateThemeManifest(lessonPath: string, severity: 'error' | 'warning'): void {
    const themeId = inferThemeIdFromLessonPath(lessonPath);
    if (!themeId) {
      this.addError(lessonPath, severity, 'theme_id を lesson filename から推定できません');
      return;
    }

    if (this.validatedThemes.has(themeId)) {
      return;
    }
    this.validatedThemes.add(themeId);

    const target = lessonPath.includes('_staging') ? 'staging' : 'production';
    const readiness = evaluateThemeManifestReadiness(themeId, this.rootDir, target);

    for (const message of readiness.errors) {
      this.addError(readiness.manifestPath || lessonPath, severity, `[theme:${themeId}] ${message}`);
    }

    for (const message of readiness.warnings) {
      this.addError(readiness.manifestPath || lessonPath, 'warning', `[theme:${themeId}] ${message}`);
    }
  }

  private validateContentPackage(lessonPath: string, severity: 'error' | 'warning'): void {
    const readiness = evaluateContentPackageReadiness(lessonPath, {
      rootDir: this.rootDir,
      mode: 'audit',
    });

    for (const message of readiness.errors) {
      this.addError(lessonPath, severity, `[content-package] ${message}`);
    }

    for (const message of readiness.warnings) {
      this.addError(lessonPath, 'warning', `[content-package] ${message}`);
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

      if (!evidence.severity_tier || !ALLOWED_SEVERITY_TIERS.includes(evidence.severity_tier)) {
        this.addError(
          evidencePath,
          severity,
          `severity_tier は許可値のみ使用できます: ${ALLOWED_SEVERITY_TIERS.join(', ')}`
        );
      }

      if (
        typeof evidence.review_sla_days !== 'number' ||
        !Number.isFinite(evidence.review_sla_days) ||
        evidence.review_sla_days <= 0
      ) {
        this.addError(evidencePath, severity, 'review_sla_days は 1 以上の number である必要があります');
      }

      if (!evidence.expiry_action || !ALLOWED_EXPIRY_ACTIONS.includes(evidence.expiry_action)) {
        this.addError(
          evidencePath,
          severity,
          `expiry_action は許可値のみ使用できます: ${ALLOWED_EXPIRY_ACTIONS.join(', ')}`
        );
      }

      if (
        typeof evidence.stale_route_owner !== 'string' ||
        evidence.stale_route_owner.trim() === ''
      ) {
        this.addError(evidencePath, severity, 'stale_route_owner は非空文字列である必要があります');
      }

      const lastVerifiedAt = evidence.last_verified_at ?? evidence.last_verified;
      if (typeof lastVerifiedAt !== 'string' || Number.isNaN(Date.parse(lastVerifiedAt))) {
        this.addError(evidencePath, severity, 'last_verified_at は有効な日付文字列である必要があります');
      }

      if (
        typeof evidence.next_review_due_at !== 'string' ||
        Number.isNaN(Date.parse(evidence.next_review_due_at))
      ) {
        this.addError(evidencePath, severity, 'next_review_due_at は有効な日付文字列である必要があります');
      } else if (
        typeof lastVerifiedAt === 'string' &&
        !Number.isNaN(Date.parse(lastVerifiedAt)) &&
        Date.parse(evidence.next_review_due_at) < Date.parse(lastVerifiedAt)
      ) {
        this.addError(evidencePath, severity, 'next_review_due_at は last_verified_at 以降である必要があります');
      }

      if (
        evidence.expiry_action === 'refresh_queue' &&
        (typeof evidence.refresh_value_reason_candidate !== 'string' ||
          evidence.refresh_value_reason_candidate.trim() === '')
      ) {
        this.addError(
          evidencePath,
          severity,
          'expiry_action=refresh_queue の場合は refresh_value_reason_candidate が必要です'
        );
      }

      // 本番配置時の promotion gate チェック
      const isProduction = !lessonPath.includes('_staging');
      const humanApproved = evidence.review?.human_approved === true;
      const autoApproved = evidence.review?.auto_approved === true;
      const promotionEligible = evidence.promotion?.eligible === true;
      if (isProduction && !humanApproved && !autoApproved && !promotionEligible) {
        this.addError(
          evidencePath,
          'error',
          '本番配置には approved gate が必要です: human_approved=true, auto_approved=true, または promotion.eligible=true'
        );
      }

    } catch (error) {
      this.addError(evidencePath, severity, `Evidence Card JSONパースエラー: ${error.message}`);
    }
  }

  private validateIdFormat(filePath: string, severity: 'error' | 'warning', id: string): void {
    // ID形式: {domain}_(l|m)NN_NNN
    const idPattern = /^(mental|money|work|health|social|study)_[lm]\d+_\d+$/;
    if (!idPattern.test(id)) {
      this.addError(filePath, severity, `ID形式が不正: ${id} (期待形式: {domain}_(l|m)NN_NNN)`, id);
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

export function runLessonValidation(options: LessonValidatorOptions = {}): boolean {
  const validator = new LessonValidator(options);
  return validator.validate();
}

// 実行
if (process.argv[1] && /validate-lessons\.ts$/.test(process.argv[1])) {
  const success = runLessonValidation();
  process.exit(success ? 0 : 1);
}
