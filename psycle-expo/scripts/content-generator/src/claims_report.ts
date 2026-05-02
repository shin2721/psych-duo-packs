import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { evidenceGradeToTier, isReviewDateStale, isSourceTypeAllowedForLane } from "./evidencePolicy";
import { loadClaimRegistry, type ClaimRegistryEntry } from "./claimRegistry";

type ClaimHealthEntry = {
  claim_id: string;
  lane: ClaimRegistryEntry["lane"];
  source_grade: ClaimRegistryEntry["source_grade"];
  source_type: ClaimRegistryEntry["source_type"];
  review_date: string;
  tier: string;
  stale: boolean;
  auto_eligible: boolean;
  reasons: string[];
};

type ClaimHealthReport = {
  generated_at: string;
  summary: {
    total: number;
    stale: number;
    autoEligible: number;
    byLane: Record<string, number>;
    byTier: Record<string, number>;
  };
  claims: ClaimHealthEntry[];
};

const REPORT_DIR = join(__dirname, "..", "output", "_reports");
const REPORT_PATH = join(REPORT_DIR, "claim-health.json");

function buildClaimHealthEntry(claim: ClaimRegistryEntry): ClaimHealthEntry {
  const reasons: string[] = [];
  const tier = evidenceGradeToTier(claim.source_grade);
  const stale = isReviewDateStale(claim.review_date, tier);
  const laneAllowsSourceType = isSourceTypeAllowedForLane(claim.source_type, claim.lane);

  if (stale) {
    reasons.push("review_date_stale");
  }

  if (!laneAllowsSourceType) {
    reasons.push("source_type_not_allowed_for_lane");
  }

  if (tier === "C") {
    reasons.push("tier_c_not_auto_promotable");
  }

  if (claim.lane === "refresh") {
    reasons.push("refresh_lane_requires_manual_promotion");
  }

  return {
    claim_id: claim.claim_id,
    lane: claim.lane,
    source_grade: claim.source_grade,
    source_type: claim.source_type,
    review_date: claim.review_date,
    tier,
    stale,
    auto_eligible: reasons.length === 0,
    reasons,
  };
}

function buildSummary(entries: ClaimHealthEntry[]): ClaimHealthReport["summary"] {
  const byLane: Record<string, number> = {};
  const byTier: Record<string, number> = {};

  for (const entry of entries) {
    byLane[entry.lane] = (byLane[entry.lane] ?? 0) + 1;
    byTier[entry.tier] = (byTier[entry.tier] ?? 0) + 1;
  }

  return {
    total: entries.length,
    stale: entries.filter((entry) => entry.stale).length,
    autoEligible: entries.filter((entry) => entry.auto_eligible).length,
    byLane,
    byTier,
  };
}

function writeClaimHealthReport(report: ClaimHealthReport): void {
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
}

function main(): void {
  const registry = loadClaimRegistry();
  const claims = Object.values(registry.claims)
    .map(buildClaimHealthEntry)
    .sort((a, b) => {
      if (a.auto_eligible !== b.auto_eligible) {
        return a.auto_eligible ? 1 : -1;
      }
      if (a.stale !== b.stale) {
        return a.stale ? -1 : 1;
      }
      return a.claim_id.localeCompare(b.claim_id);
    });

  const report: ClaimHealthReport = {
    generated_at: new Date().toISOString(),
    summary: buildSummary(claims),
    claims,
  };

  writeClaimHealthReport(report);

  console.log(`[claim-health] wrote ${REPORT_PATH}`);
  console.log(
    `[claim-health] total=${report.summary.total} stale=${report.summary.stale} autoEligible=${report.summary.autoEligible}`
  );
}

main();
