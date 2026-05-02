import AsyncStorage from "@react-native-async-storage/async-storage";
import { genres } from "./data";

export const ONBOARDING_SELECTED_GENRES_KEY = "selectedGenres";
export const DEFAULT_ONBOARDING_GENRE_ID = "mental";

const VALID_GENRE_IDS = new Set(genres.map((genre) => genre.id));

export function normalizeGenreId(value: unknown, fallback = DEFAULT_ONBOARDING_GENRE_ID): string {
  return typeof value === "string" && VALID_GENRE_IDS.has(value) ? value : fallback;
}

export function normalizeSelectedGenres(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((genreId) => normalizeGenreId(genreId, ""))
    .filter((genreId) => genreId.length > 0);
  return Array.from(new Set(normalized));
}

export function getFirstLessonTargetForGenre(genreId: string): { genreId: string; lessonFile: string } {
  const normalizedGenreId = normalizeGenreId(genreId);
  return {
    genreId: normalizedGenreId,
    lessonFile: `${normalizedGenreId}_l01`,
  };
}

export function getOnboardingPrimaryGenreToApply(params: {
  completedLessonCount: number;
  primaryGenreId: string;
  selectedGenre: string;
}): string | null {
  if (params.completedLessonCount > 0) return null;
  const normalizedPrimaryGenreId = normalizeGenreId(params.primaryGenreId);
  return normalizedPrimaryGenreId === params.selectedGenre ? null : normalizedPrimaryGenreId;
}

export async function saveOnboardingSelectedGenres(genreIds: string[]): Promise<string[]> {
  const normalized = normalizeSelectedGenres(genreIds);
  const selected = normalized.length > 0 ? normalized : [DEFAULT_ONBOARDING_GENRE_ID];
  await AsyncStorage.setItem(ONBOARDING_SELECTED_GENRES_KEY, JSON.stringify(selected));
  return selected;
}

export async function loadOnboardingSelectedGenres(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(ONBOARDING_SELECTED_GENRES_KEY);
  if (!raw) return [];
  try {
    return normalizeSelectedGenres(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function loadPrimaryOnboardingGenre(): Promise<string> {
  const selected = await loadOnboardingSelectedGenres();
  return selected[0] ?? DEFAULT_ONBOARDING_GENRE_ID;
}
