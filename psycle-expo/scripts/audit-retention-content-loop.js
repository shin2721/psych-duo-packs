const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INTAKE_DIR = path.join(ROOT, "data", "content-intake");

const pain = readItems("pain-backlog.json");
const research = readItems("research-radar.json");
const candidates = readItems("lesson-candidate-backlog.json");

const errors = [];
const warnings = [];

const painDomains = countBy(pain, "domain");
const researchDomains = countBy(research, "domain");
const candidateDomains = countBy(candidates, "domain");
const candidateDecisions = countBy(candidates, "decision");

requireAtLeast(pain.length, 10, "pain backlog items", errors);
requireAtLeast(research.length, 5, "research radar items", errors);
requireAtLeast(candidates.length, 7, "lesson candidate records", errors);
requireAtLeast(Object.keys(candidateDomains).length, 5, "candidate domains", errors);
requireAtLeast((candidateDecisions.refresh_existing || 0) + (candidateDecisions.mastery_variant || 0), 5, "refresh/mastery candidates", errors);

if ((candidateDecisions.new_core_lesson || 0) > (candidateDecisions.refresh_existing || 0) + (candidateDecisions.mastery_variant || 0)) {
  warnings.push("new_core_lesson candidates outnumber refresh/mastery candidates; check whether this creates novelty without continuity.");
}

if ((painDomains.mental || 0) > Math.ceil(pain.length * 0.5)) {
  warnings.push("pain backlog is mental-heavy; long-term retention needs cross-domain variety.");
}

for (const candidate of candidates) {
  const score = candidate.worthiness_score;
  if (!score || score.total < 12) {
    warnings.push(`${candidate.candidate_id} is below the strong-candidate threshold.`);
  }
  if (!candidate.linked_pain_ids?.length) {
    errors.push(`${candidate.candidate_id} has no linked pain.`);
  }
  if (!candidate.source_research_ids?.length) {
    warnings.push(`${candidate.candidate_id} has no linked research; keep as pain-led only if intentional.`);
  }
}

console.log("Retention content loop audit");
console.log("============================");
console.log(`pain items: ${pain.length}`);
console.log(`research items: ${research.length}`);
console.log(`candidate items: ${candidates.length}`);
console.log(`pain domains: ${formatCounts(painDomains)}`);
console.log(`research domains: ${formatCounts(researchDomains)}`);
console.log(`candidate domains: ${formatCounts(candidateDomains)}`);
console.log(`candidate decisions: ${formatCounts(candidateDecisions)}`);

for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log("retention content loop: OK");

function readItems(file) {
  return JSON.parse(fs.readFileSync(path.join(INTAKE_DIR, file), "utf8")).items || [];
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function requireAtLeast(value, minimum, label, targetErrors) {
  if (value < minimum) {
    targetErrors.push(`${label} must be at least ${minimum}; found ${value}.`);
  }
}

function formatCounts(counts) {
  const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([key, value]) => `${key}:${value}`).join(", ") || "none";
}
