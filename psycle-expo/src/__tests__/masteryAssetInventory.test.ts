import { getMentalDataContinuityMap } from "../../data/lessons/mental_units";
import { getLessonOperationalMetadata } from "../../lib/lessons";
import { listAvailableMasteryLessonIds } from "../../lib/masteryInventory";

const expectedMentalMasteryIds = ["mental_m01", "mental_m02", "mental_m03"];

describe("mental mastery asset inventory", () => {
  test("exposes shipped mastery lessons to runtime inventory", () => {
    expect(listAvailableMasteryLessonIds("mental")).toEqual(
      expect.arrayContaining(expectedMentalMasteryIds)
    );
  });

  test("ships operational metadata and continuity metadata for each mastery lesson", () => {
    const continuityMap = getMentalDataContinuityMap();

    expectedMentalMasteryIds.forEach((lessonId) => {
      const metadata = getLessonOperationalMetadata(lessonId);

      expect(metadata?.content_package?.state).toBe("production");
      expect(metadata?.content_package?.readiness?.quality_gate_pass).toBe(true);
      expect(metadata?.content_package?.continuity_metadata_path).toContain(`${lessonId}.continuity.json`);
      expect(continuityMap[lessonId]?.continuity_mode).toBe("net_new");
    });
  });
});
