import {
  getHealthDataContinuityForLesson,
  getHealthDataContinuityMap,
} from "../data/lessons/health_units";
import {
  getMentalDataContinuityForLesson,
  getMentalDataContinuityMap,
} from "../data/lessons/mental_units";
import {
  getMoneyDataContinuityForLesson,
  getMoneyDataContinuityMap,
} from "../data/lessons/money_units";
import {
  getSocialDataContinuityForLesson,
  getSocialDataContinuityMap,
} from "../data/lessons/social_units";
import {
  getStudyDataContinuityForLesson,
  getStudyDataContinuityMap,
} from "../data/lessons/study_units";
import {
  getWorkDataContinuityForLesson,
  getWorkDataContinuityMap,
} from "../data/lessons/work_units";
import type {
  LessonContinuityMetadata,
  LessonContinuityResolution,
} from "../types/lessonContinuity";

type ContinuityGetter = (lessonId: string) => LessonContinuityMetadata | null;
type ContinuityMapGetter = () => Record<string, LessonContinuityMetadata>;

const CONTINUITY_LOADERS: Record<
  string,
  {
    getForLesson: ContinuityGetter;
    getMap: ContinuityMapGetter;
  }
> = {
  mental: {
    getForLesson: getMentalDataContinuityForLesson,
    getMap: getMentalDataContinuityMap,
  },
  money: {
    getForLesson: getMoneyDataContinuityForLesson,
    getMap: getMoneyDataContinuityMap,
  },
  work: {
    getForLesson: getWorkDataContinuityForLesson,
    getMap: getWorkDataContinuityMap,
  },
  health: {
    getForLesson: getHealthDataContinuityForLesson,
    getMap: getHealthDataContinuityMap,
  },
  social: {
    getForLesson: getSocialDataContinuityForLesson,
    getMap: getSocialDataContinuityMap,
  },
  study: {
    getForLesson: getStudyDataContinuityForLesson,
    getMap: getStudyDataContinuityMap,
  },
};

export function getUnitFromAnyLessonId(lessonId: string): string | null {
  const lessonSplit = lessonId.split("_lesson_");
  if (lessonSplit.length > 1 && lessonSplit[0]) {
    return lessonSplit[0];
  }

  const match = lessonId.match(/^([a-z]+)_(?:l\d+|m\d+)$/);
  if (match?.[1]) {
    return match[1];
  }

  return null;
}

export function resolveLessonIdWithContinuities(
  requestedLessonId: string,
  continuities: LessonContinuityMetadata[]
): LessonContinuityResolution {
  const direct = continuities.find((continuity) => continuity.lesson_id === requestedLessonId) ?? null;
  if (direct && direct.continuity_mode === "retire") {
    return {
      requestedLessonId,
      resolvedLessonId: null,
      redirected: true,
      continuity: direct,
    };
  }

  const reverse =
    continuities.find((continuity) => continuity.predecessor_lesson_ids.includes(requestedLessonId)) ?? null;
  if (reverse) {
    if (reverse.continuity_mode === "retire") {
      return {
        requestedLessonId,
        resolvedLessonId: null,
        redirected: true,
        continuity: reverse,
      };
    }

    return {
      requestedLessonId,
      resolvedLessonId: reverse.lesson_id,
      redirected: reverse.lesson_id !== requestedLessonId,
      continuity: reverse,
    };
  }

  return {
    requestedLessonId,
    resolvedLessonId: requestedLessonId,
    redirected: false,
    continuity: direct,
  };
}

export function getContinuityForLesson(lessonId: string): LessonContinuityMetadata | null {
  const unit = getUnitFromAnyLessonId(lessonId);
  if (!unit) return null;
  return CONTINUITY_LOADERS[unit]?.getForLesson(lessonId) ?? null;
}

export function listContinuitiesForUnit(unit: string): LessonContinuityMetadata[] {
  const map = CONTINUITY_LOADERS[unit]?.getMap();
  return map ? Object.values(map) : [];
}

export function resolveRuntimeLessonId(requestedLessonId: string): LessonContinuityResolution {
  const unit = getUnitFromAnyLessonId(requestedLessonId);
  if (!unit) {
    return {
      requestedLessonId,
      resolvedLessonId: requestedLessonId,
      redirected: false,
      continuity: null,
    };
  }

  return resolveLessonIdWithContinuities(requestedLessonId, listContinuitiesForUnit(unit));
}

export function lessonSetHasResolvedId(
  lessonIds: Set<string>,
  lessonId: string
): boolean {
  const resolvedTargetLessonId = resolveRuntimeLessonId(lessonId).resolvedLessonId ?? lessonId;

  for (const candidateLessonId of lessonIds) {
    const resolvedCandidateLessonId =
      resolveRuntimeLessonId(candidateLessonId).resolvedLessonId ?? candidateLessonId;
    if (resolvedCandidateLessonId === resolvedTargetLessonId) {
      return true;
    }
  }

  return false;
}
