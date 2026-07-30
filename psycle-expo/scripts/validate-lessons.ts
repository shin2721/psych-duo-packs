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
import { RUNTIME_REACHABLE_QUESTION_TYPES } from '../types/question';

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
const ALLOWED_QUESTION_TYPES = new Set<string>(RUNTIME_REACHABLE_QUESTION_TYPES);

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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasValidChoiceIndex(question: Question): boolean {
  return (
    Array.isArray(question.choices) &&
    question.choices.length > 0 &&
    Number.isInteger(question.correct_index) &&
    question.correct_index >= 0 &&
    question.correct_index < question.choices.length
  );
}

/**
 * Authoring時点で、画面が回答不能・進行不能になるpayloadを拒否する。
 * 面白さや教育価値は判定しない。
 */
export function validateAuthoredQuestionPayload(question: Question): string[] {
  const errors: string[] = [];

  if (!ALLOWED_QUESTION_TYPES.has(question.type)) {
    return [
      `runtime未接続の問題タイプ: ${question.type} (許可: ${RUNTIME_REACHABLE_QUESTION_TYPES.join(', ')})`,
    ];
  }

  const requireChoices = (minimum: number) => {
    if (
      !Array.isArray(question.choices) ||
      question.choices.length < minimum ||
      question.choices.some((choice) => !isNonEmptyString(choice))
    ) {
      errors.push(`choices は非空文字列を${minimum}件以上必要です`);
    }
  };

  const requireChoiceAnswer = () => {
    if (!hasValidChoiceIndex(question)) {
      errors.push('correct_index は choices の有効なindexである必要があります');
    }
  };

  if (['multiple_choice', 'fill_blank', 'fill_blank_tap', 'quick_reflex'].includes(question.type)) {
    requireChoices(2);
    requireChoiceAnswer();
  }

  if (question.type === 'true_false') {
    if (!Array.isArray(question.choices) || question.choices.length !== 2) {
      errors.push('true_false の choices は2件必要です');
    } else if (question.choices.some((choice) => !isNonEmptyString(choice))) {
      errors.push('true_false の choices は非空文字列である必要があります');
    }
    requireChoiceAnswer();
  }

  if (question.type === 'fill_blank_tap' && !isNonEmptyString(question.statement)) {
    errors.push('fill_blank_tap は statement が必要です');
  }

  if (question.type === 'quick_reflex' && question.time_limit !== undefined) {
    if (typeof question.time_limit !== 'number' || !Number.isFinite(question.time_limit) || question.time_limit <= 0) {
      errors.push('quick_reflex の time_limit は正のnumberである必要があります');
    }
  }

  if (question.type === 'micro_input' && !isNonEmptyString(question.input_answer)) {
    errors.push('micro_input は input_answer が必要です');
  }

  if (question.type === 'swipe_judgment') {
    const hasCanonicalAnswer = typeof question.is_true === 'boolean';
    const hasAdaptableLegacyAnswer = ['right', 'left', 'True', 'False'].includes(
      question.correct_answer
    );
    if (!hasCanonicalAnswer && !hasAdaptableLegacyAnswer) {
      errors.push('swipe_judgment は is_true または有効な correct_answer が必要です');
    }
    const left = question.swipe_labels?.left ?? question.left_label;
    const right = question.swipe_labels?.right ?? question.right_label;
    if (!isNonEmptyString(left) || !isNonEmptyString(right)) {
      errors.push('swipe_judgment は左右のラベルが必要です');
    } else if (left.trim() === right.trim()) {
      errors.push('swipe_judgment の左右ラベルは異なる必要があります');
    }
  }

  if (question.type === 'conversation') {
    requireChoices(1);
    for (const field of ['correct_index', 'recommended_index'] as const) {
      const value = question[field];
      if (
        value !== undefined &&
        value !== null &&
        (!Number.isInteger(value) || value < 0 || !Array.isArray(question.choices) || value >= question.choices.length)
      ) {
        errors.push(`${field} は choices の有効なindexである必要があります`);
      }
    }
  }

  if (question.type === 'select_all') {
    requireChoices(2);
    if (question.correct_answers !== undefined) {
      if (!Array.isArray(question.correct_answers) || question.correct_answers.length === 0) {
        errors.push('select_all の correct_answers は1件以上必要です');
      } else {
        const uniqueAnswers = new Set(question.correct_answers);
        if (uniqueAnswers.size !== question.correct_answers.length) {
          errors.push('select_all の correct_answers に重複があります');
        }
        if (
          !Array.isArray(question.choices) ||
          question.correct_answers.some(
            (index: unknown) =>
              !Number.isInteger(index) ||
              (index as number) < 0 ||
              (index as number) >= question.choices.length
          )
        ) {
          errors.push('select_all の correct_answers は choices の有効なindexである必要があります');
        }
      }
    }
  }

  if (question.type === 'sort_order') {
    if (!Array.isArray(question.items) || question.items.length < 2) {
      errors.push('sort_order は items を2件以上必要です');
    }
    if (
      !Array.isArray(question.correct_order) ||
      !Array.isArray(question.items) ||
      question.correct_order.length !== question.items.length
    ) {
      errors.push('sort_order の correct_order は items と同じ件数が必要です');
    } else if (question.correct_order.every((item: unknown) => typeof item === 'number')) {
      const sorted = [...question.correct_order].sort((left: number, right: number) => left - right);
      if (sorted.some((value: number, index: number) => value !== index)) {
        errors.push('sort_order の数値correct_orderは0始まりのpermutationである必要があります');
      }
    } else if (question.correct_order.every((item: unknown) => typeof item === 'string')) {
      if (
        new Set(question.correct_order).size !== question.correct_order.length ||
        question.correct_order.some((item: string) => !question.items.includes(item))
      ) {
        errors.push('sort_order の文字列correct_orderはitemsのpermutationである必要があります');
      }
    } else {
      errors.push('sort_order の correct_order はnumber[]またはstring[]である必要があります');
    }
  }

  if (question.type === 'matching') {
    if (!Array.isArray(question.left_items) || question.left_items.length === 0) {
      errors.push('matching は left_items が必要です');
    }
    if (!Array.isArray(question.right_items) || question.right_items.length === 0) {
      errors.push('matching は right_items が必要です');
    }
    if (!Array.isArray(question.correct_pairs) || question.correct_pairs.length === 0) {
      errors.push('matching は correct_pairs が必要です');
    } else if (
      !Array.isArray(question.left_items) ||
      !Array.isArray(question.right_items) ||
      question.correct_pairs.some(
        (pair: unknown) =>
          !Array.isArray(pair) ||
          pair.length !== 2 ||
          !Number.isInteger(pair[0]) ||
          !Number.isInteger(pair[1]) ||
          pair[0] < 0 ||
          pair[0] >= question.left_items.length ||
          pair[1] < 0 ||
          pair[1] >= question.right_items.length
      )
    ) {
      errors.push('matching の correct_pairs は左右配列の有効なindexペアである必要があります');
    }
  }

  if (
    question.type === 'consequence_scenario' &&
    question.consequence_type !== 'positive' &&
    question.consequence_type !== 'negative'
  ) {
    errors.push('consequence_scenario は positive/negative の consequence_type が必要です');
  }

  if (question.type === 'term_card') {
    if (!isNonEmptyString(question.term)) {
      errors.push('term_card は term が必要です');
    }
    if (!isNonEmptyString(question.definition)) {
      errors.push('term_card は definition が必要です');
    }
  }

  return errors;
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
  private placeholderSourceIds: Set<string> | null = null;

  constructor(options: LessonValidatorOptions = {}) {
    this.rootDir = options.rootDir ?? process.cwd();
    this.lessonDirs = options.lessonDirs ?? LESSON_DIRS;
    this.stagingDirs = options.stagingDirs ?? STAGING_DIRS;
  }

  /**
   * curated_sources.json で type: "unverified_placeholder" のsource_id集合。
   * 仮登録出典はパイロット（staging）でのみ使用でき、productionパッケージには
   * 入れない。notesの「昇格禁止」を機械で強制するゲート。
   */
  private getPlaceholderSourceIds(): Set<string> {
    if (this.placeholderSourceIds) return this.placeholderSourceIds;
    this.placeholderSourceIds = new Set();
    try {
      const registryPath = path.join(this.rootDir, 'data', 'curated_sources.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as {
        sources?: Record<string, { type?: string }>;
      };
      for (const [sourceId, entry] of Object.entries(registry.sources ?? {})) {
        if (entry?.type === 'unverified_placeholder') {
          this.placeholderSourceIds.add(sourceId);
        }
      }
    } catch {
      // 台帳が読めない環境（テストの一時ディレクトリ等）ではゲートを黙ってスキップ
    }
    return this.placeholderSourceIds;
  }

  private validatePlaceholderPromotion(
    filePath: string,
    severity: 'error' | 'warning',
    lessons: Question[]
  ): void {
    const placeholders = this.getPlaceholderSourceIds();
    if (placeholders.size === 0) return;

    const usedPlaceholders = [
      ...new Set(
        lessons
          .map((question) => question.source_id)
          .filter((sourceId): sourceId is string => !!sourceId && placeholders.has(sourceId))
      ),
    ];
    if (usedPlaceholders.length === 0) return;

    let packageState: string | undefined;
    try {
      const evidencePath = filePath.replace(/\.[a-z]{2}\.json$/, '.evidence.json');
      const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf-8')) as {
        content_package?: { state?: string };
      };
      packageState = evidence.content_package?.state;
    } catch {
      return;
    }

    if (packageState === 'production') {
      this.addError(
        filePath,
        severity,
        `未検証の仮登録出典を使うレッスンはproductionへ昇格できません: ${usedPlaceholders.join(', ')}（原典検証の上curated_sources.jsonへ正式登録するか、package stateをstagingへ）`
      );
    }
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

      // 仮登録出典の昇格ブロック
      this.validatePlaceholderPromotion(filePath, severity, lessons);

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

      // 本番配置時の promotion gate チェック。
      // 「本番配置」はパスだけでなく content_package.state でも判定する。
      // ランタイム（lessonOperational）は state==="staging" を dev限定として
      // ブロックするので、staging宣言済みパッケージは本番配置ではない。
      const isProduction =
        !lessonPath.includes('_staging') &&
        evidence.content_package?.state !== 'staging';
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
    if (!question.type) {
      return;
    }

    for (const message of validateAuthoredQuestionPayload(question)) {
      this.addError(filePath, severity, message, question.id);
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
