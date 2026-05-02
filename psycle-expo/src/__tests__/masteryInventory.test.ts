jest.mock("../../lib/lessons", () => ({
  loadLessons: jest.fn(),
}));

import { loadLessons } from "../../lib/lessons";
import { listAvailableMasteryLessonIds } from "../../lib/masteryInventory";

const mockLoadLessons = loadLessons as jest.Mock;

describe("listAvailableMasteryLessonIds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns only mastery lesson ids in sorted order", () => {
    mockLoadLessons.mockReturnValueOnce([
      { id: "mental_l01" },
      { id: "mental_m02" },
      { id: "mental_m01" },
      { id: "mental_review_bh1" },
    ]);

    expect(listAvailableMasteryLessonIds("mental")).toEqual(["mental_m01", "mental_m02"]);
    expect(mockLoadLessons).toHaveBeenCalledWith("mental");
  });

  test("returns empty list when theme is missing", () => {
    expect(listAvailableMasteryLessonIds("")).toEqual([]);
    expect(mockLoadLessons).not.toHaveBeenCalled();
  });
});

