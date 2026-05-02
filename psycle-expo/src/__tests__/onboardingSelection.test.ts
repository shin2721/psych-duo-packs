import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_ONBOARDING_GENRE_ID,
  getFirstLessonTargetForGenre,
  getOnboardingPrimaryGenreToApply,
  loadPrimaryOnboardingGenre,
  normalizeSelectedGenres,
  ONBOARDING_SELECTED_GENRES_KEY,
  saveOnboardingSelectedGenres,
} from "../../lib/onboardingSelection";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("onboardingSelection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("normalizes selected genres and removes invalid ids", () => {
    expect(normalizeSelectedGenres(["money", "invalid", "money", "study"])).toEqual(["money", "study"]);
  });

  test("saves a deterministic primary genre for first-session routing", async () => {
    await expect(saveOnboardingSelectedGenres(["work", "study"])).resolves.toEqual(["work", "study"]);
    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      ONBOARDING_SELECTED_GENRES_KEY,
      JSON.stringify(["work", "study"])
    );
  });

  test("falls back to mental when no valid onboarding genre exists", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(JSON.stringify(["unknown"]));
    await expect(loadPrimaryOnboardingGenre()).resolves.toBe(DEFAULT_ONBOARDING_GENRE_ID);
  });

  test("builds the first lesson target from the selected genre", () => {
    expect(getFirstLessonTargetForGenre("social")).toEqual({
      genreId: "social",
      lessonFile: "social_l01",
    });
  });

  test("applies the onboarding primary genre only before first lesson completion", () => {
    expect(
      getOnboardingPrimaryGenreToApply({
        completedLessonCount: 0,
        primaryGenreId: "work",
        selectedGenre: "mental",
      })
    ).toBe("work");
    expect(
      getOnboardingPrimaryGenreToApply({
        completedLessonCount: 1,
        primaryGenreId: "work",
        selectedGenre: "mental",
      })
    ).toBeNull();
    expect(
      getOnboardingPrimaryGenreToApply({
        completedLessonCount: 0,
        primaryGenreId: "unknown",
        selectedGenre: "mental",
      })
    ).toBeNull();
  });
});
