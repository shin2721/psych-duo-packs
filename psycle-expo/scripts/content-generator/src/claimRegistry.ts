import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { GeneratedQuestion, Lane, LessonBlueprint, Seed } from "./types";

export type ClaimRegistryEntry = {
  claim_id: string;
  claim_text: string;
  source_id: string;
  source_type: Seed["source_type"];
  source_grade: "gold" | "silver" | "bronze";
  source_span: string;
  review_date: string;
  lane: Lane;
  domain: Seed["domain"];
  academic_reference: string;
  discovery_url: string;
  lesson_job: string;
  target_shift: string;
  done_condition: string;
  takeaway_action: string;
  counterfactual?: string;
  intervention_path?: string;
  novelty_reason?: string;
  refresh_value_reason?: string;
  last_seen_at: string;
};

type ClaimRegistryFile = {
  claims: Record<string, ClaimRegistryEntry>;
};

const REGISTRY_DIR = join(__dirname, "..", "output", "_registry");
const REGISTRY_PATH = join(REGISTRY_DIR, "claim-registry.json");

function ensureRegistryDir(): void {
  if (!existsSync(REGISTRY_DIR)) {
    mkdirSync(REGISTRY_DIR, { recursive: true });
  }
}

export function loadClaimRegistry(): ClaimRegistryFile {
  if (!existsSync(REGISTRY_PATH)) {
    return { claims: {} };
  }

  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, "utf-8")) as ClaimRegistryFile;
  } catch {
    return { claims: {} };
  }
}

function saveClaimRegistry(registry: ClaimRegistryFile): void {
  ensureRegistryDir();
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");
}

export function upsertClaimRegistryEntry(entry: ClaimRegistryEntry): void {
  const registry = loadClaimRegistry();
  registry.claims[entry.claim_id] = entry;
  saveClaimRegistry(registry);
}

export function upsertClaimFromQuestion(args: {
  question: GeneratedQuestion;
  seed: Seed;
  originalLink: string;
  lessonBlueprint?: LessonBlueprint;
}): void {
  const { question, seed, originalLink, lessonBlueprint } = args;
  if (!question.claim_id || !question.source_span || !question.review_date || !question.lane) {
    return;
  }

  upsertClaimRegistryEntry({
    claim_id: question.claim_id,
    claim_text: seed.core_principle,
    source_id: question.source_id,
    source_type: question.source_type ?? seed.source_type,
    source_grade: question.evidence_grade,
    source_span: question.source_span,
    review_date: question.review_date,
    lane: question.lane,
    domain: seed.domain,
    academic_reference: seed.academic_reference,
    discovery_url: originalLink,
    lesson_job:
      lessonBlueprint?.job ||
      question.lesson_blueprint?.job ||
      `${seed.core_principle} を日常の選び方に戻す`,
    target_shift:
      lessonBlueprint?.target_shift ||
      question.lesson_blueprint?.target_shift ||
      `${seed.common_misconception} から ${seed.actionable_tactic} へ移す`,
    done_condition:
      lessonBlueprint?.done_condition ||
      question.lesson_blueprint?.done_condition ||
      `${seed.actionable_tactic} を次の場面で1回試せる状態になる`,
    takeaway_action:
      lessonBlueprint?.takeaway_action ||
      question.lesson_blueprint?.takeaway_action ||
      seed.actionable_tactic,
    counterfactual:
      lessonBlueprint?.counterfactual ||
      question.lesson_blueprint?.counterfactual,
    intervention_path:
      lessonBlueprint?.intervention_path ||
      question.lesson_blueprint?.intervention_path,
    novelty_reason:
      lessonBlueprint?.novelty_reason ||
      question.lesson_blueprint?.novelty_reason,
    refresh_value_reason:
      lessonBlueprint?.refresh_value_reason ||
      question.lesson_blueprint?.refresh_value_reason,
    last_seen_at: new Date().toISOString(),
  });
}

export function getClaimRegistryEntries(claimIds: string[]): ClaimRegistryEntry[] {
  const registry = loadClaimRegistry();
  return claimIds
    .map((claimId) => registry.claims[claimId])
    .filter((entry): entry is ClaimRegistryEntry => Boolean(entry));
}
