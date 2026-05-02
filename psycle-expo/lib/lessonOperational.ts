import type { LessonOperationalMetadata, RuntimeThemeManifest } from "../types/lessonOperational";
import type { LessonContinuityMetadata, LessonContinuityResolution } from "../types/lessonContinuity";
import { listContinuitiesForUnit, resolveLessonIdWithContinuities, resolveRuntimeLessonId } from "./lessonContinuity";
import { getLessonOperationalMetadata } from "./lessons";
import {
  areThemeDependenciesSatisfied,
  getRuntimeThemeManifest,
  isThemeReviewOverdue,
} from "./themeManifestRuntime";

export type LessonRuntimeAccessBlockReason =
  | "package_killed"
  | "continuity_retired"
  | "dependency_unmet"
  | "theme_not_active"
  | "theme_review_overdue"
  | "package_not_production"
  | "tier_a_stale";

export interface LessonSupportSurfacingEligibility {
  eligible: boolean;
  reason: LessonRuntimeAccessBlockReason | null;
}

export interface LessonRuntimeAccessResolution {
  allowed: boolean;
  reason: LessonRuntimeAccessBlockReason | null;
  requestedLessonId: string;
  resolvedLessonId: string | null;
  continuity: LessonContinuityMetadata | null;
}

function getThemeIdFromLessonId(lessonId: string | null): string | null {
  if (!lessonId) return null;
  const unitMatch = lessonId.match(/^([a-z]+)_/);
  return unitMatch?.[1] ?? null;
}

function isPastDue(value: string | undefined, nowMs: number): boolean {
  if (!value) return false;
  const ts = Date.parse(value);
  return !Number.isNaN(ts) && ts <= nowMs;
}

function getRequiredPackageIds(lessonOperational: LessonOperationalMetadata | null | undefined): string[] {
  const requiresPackageIds = lessonOperational?.content_package?.package_dependencies?.requires_package_ids;
  if (!Array.isArray(requiresPackageIds)) return [];
  return requiresPackageIds.filter((packageId): packageId is string => typeof packageId === "string" && packageId.length > 0);
}

export function getLessonSupportSurfacingEligibility(args: {
  lessonId: string;
  nowMs?: number;
  lessonOperational?: LessonOperationalMetadata | null;
  themeManifest?: RuntimeThemeManifest | null;
  lessonOperationalById?: Record<string, LessonOperationalMetadata | null>;
  themeManifestById?: Record<string, RuntimeThemeManifest | null>;
  completedThemeIds?: string[];
}): LessonSupportSurfacingEligibility {
  const runtimeAccess = resolveLessonRuntimeAccess(args);
  return {
    eligible: runtimeAccess.allowed,
    reason: runtimeAccess.reason,
  };
}

export function resolveLessonRuntimeAccess(args: {
  lessonId: string;
  nowMs?: number;
  lessonOperational?: LessonOperationalMetadata | null;
  themeManifest?: RuntimeThemeManifest | null;
  lessonOperationalById?: Record<string, LessonOperationalMetadata | null>;
  themeManifestById?: Record<string, RuntimeThemeManifest | null>;
  requestedLessonOperational?: LessonOperationalMetadata | null;
  continuityResolution?: LessonContinuityResolution | null;
  continuities?: LessonContinuityMetadata[];
  completedThemeIds?: string[];
}): LessonRuntimeAccessResolution {
  return resolveLessonRuntimeAccessInternal(args, new Set<string>());
}

function resolveLessonRuntimeAccessInternal(
  args: {
    lessonId: string;
    nowMs?: number;
    lessonOperational?: LessonOperationalMetadata | null;
    themeManifest?: RuntimeThemeManifest | null;
    lessonOperationalById?: Record<string, LessonOperationalMetadata | null>;
    themeManifestById?: Record<string, RuntimeThemeManifest | null>;
    requestedLessonOperational?: LessonOperationalMetadata | null;
    continuityResolution?: LessonContinuityResolution | null;
    continuities?: LessonContinuityMetadata[];
    completedThemeIds?: string[];
  },
  dependencyChain: Set<string>
): LessonRuntimeAccessResolution {
  const nowMs = args.nowMs ?? Date.now();
  const unitMatch = args.lessonId.match(/^([a-z]+)_/);
  const continuityResolution =
    args.continuityResolution ??
    (unitMatch?.[1] && args.continuities
      ? resolveLessonIdWithContinuities(args.lessonId, args.continuities)
      : resolveRuntimeLessonId(args.lessonId));
  const resolvedLessonId = continuityResolution.resolvedLessonId;
  const requestedLessonOperational =
    args.requestedLessonOperational ??
    args.lessonOperationalById?.[args.lessonId] ??
    getLessonOperationalMetadata(args.lessonId);
  if (requestedLessonOperational?.content_package?.state === "killed") {
    return {
      allowed: false,
      reason: "package_killed",
      requestedLessonId: args.lessonId,
      resolvedLessonId,
      continuity: continuityResolution.continuity,
    };
  }

  if (!resolvedLessonId) {
    return {
      allowed: false,
      reason: "continuity_retired",
      requestedLessonId: args.lessonId,
      resolvedLessonId: null,
      continuity: continuityResolution.continuity,
    };
  }

  const resolvedLessonOperational =
    args.lessonOperational ??
    args.lessonOperationalById?.[resolvedLessonId] ??
    getLessonOperationalMetadata(resolvedLessonId);
  if (resolvedLessonOperational?.content_package?.state === "killed") {
    return {
      allowed: false,
      reason: "package_killed",
      requestedLessonId: args.lessonId,
      resolvedLessonId,
      continuity: continuityResolution.continuity,
    };
  }

  const lessonOperational =
    args.lessonOperational ??
    args.lessonOperationalById?.[resolvedLessonId] ??
    getLessonOperationalMetadata(resolvedLessonId);
  const themeId = getThemeIdFromLessonId(resolvedLessonId) ?? unitMatch?.[1] ?? null;
  const themeManifest =
    args.themeManifest ?? (themeId ? args.themeManifestById?.[themeId] ?? getRuntimeThemeManifest(themeId) : null);

  if (!areThemeDependenciesSatisfied(themeManifest, args.completedThemeIds ?? [])) {
    return {
      allowed: false,
      reason: "dependency_unmet",
      requestedLessonId: args.lessonId,
      resolvedLessonId,
      continuity: continuityResolution.continuity,
    };
  }

  const requiredPackageIds = getRequiredPackageIds(lessonOperational);
  if (requiredPackageIds.length > 0) {
    for (const dependencyLessonId of requiredPackageIds) {
      const canonicalDependencyId =
        resolveRuntimeLessonId(dependencyLessonId).resolvedLessonId ?? dependencyLessonId;
      if (dependencyChain.has(canonicalDependencyId)) {
        return {
          allowed: false,
          reason: "dependency_unmet",
          requestedLessonId: args.lessonId,
          resolvedLessonId,
          continuity: continuityResolution.continuity,
        };
      }

      const dependencyResult = resolveLessonRuntimeAccessInternal(
        {
          lessonId: dependencyLessonId,
          nowMs,
          lessonOperationalById: args.lessonOperationalById,
          themeManifestById: args.themeManifestById,
          completedThemeIds: args.completedThemeIds,
        },
        new Set([...dependencyChain, canonicalDependencyId])
      );

      if (!dependencyResult.allowed) {
        return {
          allowed: false,
          reason: "dependency_unmet",
          requestedLessonId: args.lessonId,
          resolvedLessonId,
          continuity: continuityResolution.continuity,
        };
      }
    }
  }

  if (themeManifest?.theme_status && themeManifest.theme_status !== "active") {
    return {
      allowed: false,
      reason: "theme_not_active",
      requestedLessonId: args.lessonId,
      resolvedLessonId,
      continuity: continuityResolution.continuity,
    };
  }

  if (
    themeManifest?.rollout_stage === "production_default" &&
    isThemeReviewOverdue(themeManifest, nowMs)
  ) {
    return {
      allowed: false,
      reason: "theme_review_overdue",
      requestedLessonId: args.lessonId,
      resolvedLessonId,
      continuity: continuityResolution.continuity,
    };
  }

  const packageState = lessonOperational?.content_package?.state;
  if (packageState && packageState !== "production") {
    return {
      allowed: false,
      reason: "package_not_production",
      requestedLessonId: args.lessonId,
      resolvedLessonId,
      continuity: continuityResolution.continuity,
    };
  }

  if (
    lessonOperational?.severity_tier === "A" &&
    isPastDue(lessonOperational.next_review_due_at, nowMs)
  ) {
    return {
      allowed: false,
      reason: "tier_a_stale",
      requestedLessonId: args.lessonId,
      resolvedLessonId,
      continuity: continuityResolution.continuity,
    };
  }

  return {
    allowed: true,
    reason: null,
    requestedLessonId: args.lessonId,
    resolvedLessonId,
    continuity: continuityResolution.continuity,
  };
}
