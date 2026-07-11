import entitlements from "../../config/entitlements.json";

interface LessonDefaultsConfig {
  defaults?: {
    first_session_lesson_size?: number;
    lesson_size?: number;
    optimal_p_max?: number;
    optimal_p_min?: number;
  };
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : fallback;
}

const lessonDefaults = entitlements as LessonDefaultsConfig;

export const DEFAULT_LESSON_SIZE = normalizePositiveInt(
  lessonDefaults.defaults?.lesson_size,
  10
);

export const FIRST_SESSION_LESSON_SIZE = normalizePositiveInt(
  lessonDefaults.defaults?.first_session_lesson_size,
  Math.min(5, DEFAULT_LESSON_SIZE)
);

export const OPTIMAL_P_MIN =
  typeof lessonDefaults.defaults?.optimal_p_min === "number"
    ? lessonDefaults.defaults.optimal_p_min
    : 0.55;

export const OPTIMAL_P_MAX =
  typeof lessonDefaults.defaults?.optimal_p_max === "number"
    ? lessonDefaults.defaults.optimal_p_max
    : 0.7;
