import {
  isCourseWorldDrag,
  resolveCourseWorldRelease,
} from "../../components/course-world/courseWorldGesture";

describe("course world ring gesture resolution", () => {
  test("a release with meaningful movement is never treated as a tap", () => {
    expect(isCourseWorldDrag(7, 0)).toBe(true);
    expect(isCourseWorldDrag(0, -7)).toBe(true);
    expect(isCourseWorldDrag(6, 6)).toBe(false);
  });

  test("a quick release can select the previous lesson even when move events were missed", () => {
    expect(
      resolveCourseWorldRelease({
        currentIdx: 1,
        dx: 50,
        nodeCount: 2,
        velocityX: 0,
        width: 390,
      })
    ).toMatchObject({
      nextIndex: 0,
      slotOffset: 1,
    });
  });
});
