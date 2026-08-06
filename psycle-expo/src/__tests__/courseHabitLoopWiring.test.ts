import fs from "node:fs";
import path from "node:path";

const courseScreenPath = path.join(__dirname, "../../app/(tabs)/course.tsx");
const nodeColumnPath = path.join(
  __dirname,
  "../../components/course-world/CourseWorldNodeColumn.tsx"
);

describe("course habit loop wiring", () => {
  test("minimal course surface hides engagement panels without tracking them as shown", () => {
    const courseSource = fs.readFileSync(courseScreenPath, "utf8");

    expect(courseSource).toContain("SHOW_COURSE_ENGAGEMENT_PANELS = false");
    expect(courseSource).toContain('presentation="ring_theme"');
    expect(courseSource).not.toContain("habitSummary={{");
    expect(courseSource).toContain("engagement_return_reason_shown");
    expect(courseSource).toContain("streak_repair_available");
    expect(courseSource).toContain("comeback_reward_available");
    expect(courseSource).toContain("return_support_available");
  });

  test("course world converts habit state into today's return reason", () => {
    const nodeColumnSource = fs.readFileSync(nodeColumnPath, "utf8");

    expect(nodeColumnSource).toContain("goalRemainingTitle");
    expect(nodeColumnSource).toContain("goalCompleteTitle");
    expect(nodeColumnSource).toContain("STREAK");
    expect(nodeColumnSource).toContain("GOAL");
  });
});
