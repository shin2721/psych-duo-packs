const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "content-intake");

const FILES = {
  pain: path.join(DATA_DIR, "pain-backlog.json"),
  candidate: path.join(DATA_DIR, "lesson-candidate-backlog.json"),
  research: path.join(DATA_DIR, "research-radar.json"),
};

const DOMAINS = new Set(["mental", "money", "work", "health", "social", "study"]);
const PAIN_SOURCES = new Set([
  "user_interview",
  "app_behavior",
  "support_review",
  "search_query",
  "community_observation",
  "manual_research",
]);
const PAIN_STATUSES = new Set(["new", "triaged", "linked_to_candidate", "closed"]);
const DECISIONS = new Set([
  "ignore",
  "backlog",
  "refresh_existing",
  "mastery_variant",
  "new_core_lesson",
  "human_review",
]);
const FINDING_CLASSES = new Set([
  "new_mechanism",
  "better_intervention",
  "boundary_update",
  "replication",
  "contradiction",
  "interesting_but_not_actionable",
]);
const CONTROL_QUALITY = new Set(["none", "weak", "moderate", "strong", "not_applicable"]);
const PREREGISTRATION = new Set(["yes", "no", "unclear", "not_applicable"]);
const GENERALIZABILITY = new Set(["low", "medium", "high", "unclear"]);
const REPLICATION_STATUS = new Set(["none", "mixed", "supported", "failed", "not_applicable"]);
const HYPE_RISK = new Set(["low", "medium", "high"]);
const SAFE_USAGE_SCOPE = new Set(["fact", "explanation", "intervention", "reflection_only"]);
const OWNERS = new Set(["content_ops", "product", "research_review"]);
const FIT_TYPES = new Set(["refresh", "mastery", "duplicate", "none"]);
const SCORE_FIELDS = ["pain", "recurrence", "actionability", "evidence_strength", "novelty"];
const INSIGHT_LAYER_FIELDS = [
  "surprising_question",
  "research_finding",
  "critical_caveat",
  "usable_scope",
  "practice_prompt",
];

function main() {
  const command = process.argv[2];
  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  if (command === "validate") {
    const result = validateAll(loadAll());
    printValidation(result);
    if (result.errors.length > 0) process.exitCode = 1;
    return;
  }

  if (command === "add-pain") {
    addItem("pain", normalizePain(readPayload()));
    return;
  }

  if (command === "add-research") {
    addItem("research", normalizeResearch(readPayload()));
    return;
  }

  if (command === "add-candidate") {
    addCandidate(normalizeCandidate(readPayload()));
    return;
  }

  throw new Error(`Unknown content-intake command: ${command}`);
}

function printUsage() {
  console.log(`Usage:
  node scripts/content-intake.js validate
  node scripts/content-intake.js add-pain <payload.json | inline-json>
  node scripts/content-intake.js add-research <payload.json | inline-json>
  node scripts/content-intake.js add-candidate <payload.json | inline-json>`);
}

function readPayload() {
  const raw = process.argv[3];
  if (!raw) throw new Error("Missing payload path or inline JSON.");
  const input = fs.existsSync(raw) ? fs.readFileSync(raw, "utf8") : raw;
  return JSON.parse(input);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function loadAll() {
  return {
    pain: readJson(FILES.pain),
    candidate: readJson(FILES.candidate),
    research: readJson(FILES.research),
  };
}

function addItem(kind, item) {
  const file = FILES[kind];
  const doc = readJson(file);
  const idField = kind === "pain" ? "pain_id" : "research_id";
  assertNoDuplicate(doc.items, idField, item[idField], kind);
  doc.items.push(item);
  const nextAll = { ...loadAll(), [kind]: doc };
  const result = validateAll(nextAll);
  if (result.errors.length > 0) {
    printValidation(result);
    process.exit(1);
  }
  writeJson(file, doc);
  printValidation(result);
  console.log(`Added ${kind}: ${item[idField]}`);
}

function addCandidate(candidate) {
  const all = loadAll();
  assertNoDuplicate(all.candidate.items, "candidate_id", candidate.candidate_id, "candidate");
  all.candidate.items.push(candidate);

  const linkedPainIds = new Set(candidate.linked_pain_ids || []);
  if (linkedPainIds.size > 0) {
    all.pain.items = all.pain.items.map((item) =>
      linkedPainIds.has(item.pain_id)
        ? { ...item, candidate_status: "linked_to_candidate" }
        : item
    );
  }

  const result = validateAll(all);
  if (result.errors.length > 0) {
    printValidation(result);
    process.exit(1);
  }
  writeJson(FILES.candidate, all.candidate);
  writeJson(FILES.pain, all.pain);
  printValidation(result);
  console.log(`Added candidate: ${candidate.candidate_id}`);
}

function normalizePain(item) {
  const now = new Date().toISOString();
  return {
    pain_id: item.pain_id || makeId("pain"),
    domain: item.domain,
    recurring_pain: item.recurring_pain,
    life_scene: item.life_scene,
    source: item.source || "manual_research",
    observed_signal: item.observed_signal || "",
    affected_user_segment: item.affected_user_segment || "unknown",
    recurrence_notes: item.recurrence_notes || "",
    candidate_status: item.candidate_status || "new",
    created_at: item.created_at || now,
  };
}

function normalizeResearch(item) {
  const now = new Date().toISOString();
  return {
    research_id: item.research_id || makeId("research"),
    domain: item.domain,
    title: item.title,
    source_url: item.source_url,
    source_id: item.source_id || item.source_url,
    critique: item.critique,
    psycle_decision: item.psycle_decision || "human_review",
    decision_reason: item.decision_reason || "",
    ...(item.linked_candidate_id ? { linked_candidate_id: item.linked_candidate_id } : {}),
    reviewed_at: item.reviewed_at || now,
  };
}

function normalizeCandidate(item) {
  const now = new Date().toISOString();
  const score = normalizeScore(item.worthiness_score || {});
  return {
    candidate_id: item.candidate_id || makeId("candidate"),
    domain: item.domain,
    linked_pain_ids: item.linked_pain_ids || [],
    source_research_ids: item.source_research_ids || [],
    lesson_job: item.lesson_job,
    target_shift: item.target_shift,
    takeaway_action: item.takeaway_action,
    insight_layer: normalizeInsightLayer(item.insight_layer || {}),
    worthiness_score: score,
    decision: item.decision || inferDecision(score.total),
    decision_reason: item.decision_reason || "",
    ...(item.existing_lesson_fit ? { existing_lesson_fit: item.existing_lesson_fit } : {}),
    owner: item.owner || "content_ops",
    created_at: item.created_at || now,
  };
}

function normalizeScore(score) {
  const normalized = { ...score };
  let total = 0;
  for (const field of SCORE_FIELDS) {
    total += Number(normalized[field] || 0);
  }
  normalized.total = Number(normalized.total || total);
  return normalized;
}

function inferDecision(total) {
  if (total >= 12) return "new_core_lesson";
  if (total >= 9) return "backlog";
  return "ignore";
}

function makeId(prefix) {
  return `${prefix}_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
}

function assertNoDuplicate(items, field, id, kind) {
  if (!id) throw new Error(`${kind}.${field} is required.`);
  if (items.some((item) => item[field] === id)) {
    throw new Error(`Duplicate ${kind}.${field}: ${id}`);
  }
}

function validateAll(all) {
  const errors = [];
  const warnings = [];
  validateDoc("pain", all.pain, errors);
  validateDoc("candidate", all.candidate, errors);
  validateDoc("research", all.research, errors);

  validatePainItems(all.pain.items || [], errors);
  validateResearchItems(all.research.items || [], errors);
  validateCandidateItems(all.candidate.items || [], all, errors, warnings);

  return { errors, warnings };
}

function validateDoc(kind, doc, errors) {
  if (!doc || doc.schema_version !== 1) errors.push(`${kind}.schema_version must be 1.`);
  if (!Array.isArray(doc?.items)) errors.push(`${kind}.items must be an array.`);
}

function validatePainItems(items, errors) {
  const seen = new Set();
  items.forEach((item, index) => {
    const label = `pain.items[${index}]`;
    requireString(item.pain_id, `${label}.pain_id`, errors);
    requireDomain(item.domain, `${label}.domain`, errors);
    requireString(item.recurring_pain, `${label}.recurring_pain`, errors);
    requireString(item.life_scene, `${label}.life_scene`, errors);
    requireOneOf(item.source, PAIN_SOURCES, `${label}.source`, errors);
    requireOneOf(item.candidate_status, PAIN_STATUSES, `${label}.candidate_status`, errors);
    requireString(item.created_at, `${label}.created_at`, errors);
    checkDuplicate(seen, item.pain_id, `${label}.pain_id`, errors);
  });
}

function validateResearchItems(items, errors) {
  const seen = new Set();
  items.forEach((item, index) => {
    const label = `research.items[${index}]`;
    requireString(item.research_id, `${label}.research_id`, errors);
    requireDomain(item.domain, `${label}.domain`, errors);
    requireString(item.title, `${label}.title`, errors);
    requireString(item.source_url, `${label}.source_url`, errors);
    requireString(item.source_id, `${label}.source_id`, errors);
    requireOneOf(item.psycle_decision, DECISIONS, `${label}.psycle_decision`, errors);
    requireString(item.decision_reason, `${label}.decision_reason`, errors);
    validateCritique(item.critique, `${label}.critique`, errors);
    requireString(item.reviewed_at, `${label}.reviewed_at`, errors);
    checkDuplicate(seen, item.research_id, `${label}.research_id`, errors);
  });
}

function validateCritique(critique, label, errors) {
  if (!critique || typeof critique !== "object") {
    errors.push(`${label} is required.`);
    return;
  }
  requireOneOf(critique.finding_class, FINDING_CLASSES, `${label}.finding_class`, errors);
  requireString(critique.study_design, `${label}.study_design`, errors);
  if (critique.sample_size !== null && !Number.isInteger(critique.sample_size)) {
    errors.push(`${label}.sample_size must be an integer or null.`);
  }
  requireOneOf(critique.control_quality, CONTROL_QUALITY, `${label}.control_quality`, errors);
  requireString(critique.effect_size, `${label}.effect_size`, errors);
  requireOneOf(critique.preregistration, PREREGISTRATION, `${label}.preregistration`, errors);
  if (!Array.isArray(critique.confounders)) errors.push(`${label}.confounders must be an array.`);
  requireOneOf(critique.generalizability, GENERALIZABILITY, `${label}.generalizability`, errors);
  requireOneOf(critique.replication_status, REPLICATION_STATUS, `${label}.replication_status`, errors);
  requireOneOf(critique.hype_risk, HYPE_RISK, `${label}.hype_risk`, errors);
  requireOneOf(critique.safe_usage_scope, SAFE_USAGE_SCOPE, `${label}.safe_usage_scope`, errors);
}

function validateCandidateItems(items, all, errors, warnings) {
  const seen = new Set();
  const painIds = new Set((all.pain.items || []).map((item) => item.pain_id));
  const researchIds = new Set((all.research.items || []).map((item) => item.research_id));
  items.forEach((item, index) => {
    const label = `candidate.items[${index}]`;
    requireString(item.candidate_id, `${label}.candidate_id`, errors);
    requireDomain(item.domain, `${label}.domain`, errors);
    requireString(item.lesson_job, `${label}.lesson_job`, errors);
    requireString(item.target_shift, `${label}.target_shift`, errors);
    requireString(item.takeaway_action, `${label}.takeaway_action`, errors);
    validateInsightLayer(item.insight_layer, `${label}.insight_layer`, errors);
    requireOneOf(item.decision, DECISIONS, `${label}.decision`, errors);
    requireString(item.decision_reason, `${label}.decision_reason`, errors);
    requireOneOf(item.owner, OWNERS, `${label}.owner`, errors);
    validateScore(item.worthiness_score, `${label}.worthiness_score`, errors);
    validateStringArray(item.linked_pain_ids, `${label}.linked_pain_ids`, errors);
    validateStringArray(item.source_research_ids, `${label}.source_research_ids`, errors);
    for (const painId of item.linked_pain_ids || []) {
      if (!painIds.has(painId)) warnings.push(`${label}.linked_pain_ids references missing pain_id: ${painId}`);
    }
    for (const researchId of item.source_research_ids || []) {
      if (!researchIds.has(researchId)) {
        warnings.push(`${label}.source_research_ids references missing research_id: ${researchId}`);
      }
    }
    if (item.existing_lesson_fit) {
      requireString(item.existing_lesson_fit.lesson_id, `${label}.existing_lesson_fit.lesson_id`, errors);
      requireOneOf(item.existing_lesson_fit.fit_type, FIT_TYPES, `${label}.existing_lesson_fit.fit_type`, errors);
    }
    requireString(item.created_at, `${label}.created_at`, errors);
    checkDuplicate(seen, item.candidate_id, `${label}.candidate_id`, errors);
  });
}

function normalizeInsightLayer(layer) {
  return {
    surprising_question: layer.surprising_question,
    research_finding: layer.research_finding,
    critical_caveat: layer.critical_caveat,
    usable_scope: layer.usable_scope,
    practice_prompt: layer.practice_prompt,
  };
}

function validateScore(score, label, errors) {
  if (!score || typeof score !== "object") {
    errors.push(`${label} is required.`);
    return;
  }
  let total = 0;
  for (const field of SCORE_FIELDS) {
    const value = score[field];
    if (!Number.isInteger(value) || value < 1 || value > 3) {
      errors.push(`${label}.${field} must be an integer from 1 to 3.`);
    } else {
      total += value;
    }
  }
  if (score.total !== total) errors.push(`${label}.total must equal ${total}.`);
}

function validateInsightLayer(layer, label, errors) {
  if (!layer || typeof layer !== "object") {
    errors.push(`${label} is required.`);
    return;
  }
  for (const field of INSIGHT_LAYER_FIELDS) {
    requireString(layer[field], `${label}.${field}`, errors);
  }
}

function validateStringArray(value, label, errors) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) {
    errors.push(`${label} must be an array of non-empty strings.`);
  }
}

function requireDomain(value, label, errors) {
  requireOneOf(value, DOMAINS, label, errors);
}

function requireOneOf(value, allowed, label, errors) {
  if (!allowed.has(value)) errors.push(`${label} has invalid value: ${String(value)}`);
}

function requireString(value, label, errors) {
  if (typeof value !== "string" || value.length === 0) errors.push(`${label} is required.`);
}

function checkDuplicate(seen, id, label, errors) {
  if (!id) return;
  if (seen.has(id)) errors.push(`Duplicate ${label}: ${id}`);
  seen.add(id);
}

function printValidation(result) {
  if (result.errors.length === 0) {
    console.log("content-intake validation: OK");
  } else {
    console.error("content-intake validation: FAILED");
    result.errors.forEach((error) => console.error(`ERROR ${error}`));
  }
  result.warnings.forEach((warning) => console.warn(`WARN ${warning}`));
}

main();
