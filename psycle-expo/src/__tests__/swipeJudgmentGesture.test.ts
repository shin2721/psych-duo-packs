import {
  hasHorizontalSwipeIntent,
  resolveSwipeJudgmentDirection,
} from "../../components/question-types/swipeJudgmentGesture";

describe("swipe judgment gesture", () => {
  test("claims only a clearly horizontal gesture", () => {
    expect(hasHorizontalSwipeIntent({ dx: 8, dy: 1 })).toBe(true);
    expect(hasHorizontalSwipeIntent({ dx: 5, dy: 0 })).toBe(false);
    expect(hasHorizontalSwipeIntent({ dx: 12, dy: 20 })).toBe(false);
  });

  test("does not commit a slow short movement", () => {
    expect(resolveSwipeJudgmentDirection({ dx: -20, dy: 1, vx: -0.1 })).toBeNull();
  });

  test("commits a deliberate drag in either direction", () => {
    expect(resolveSwipeJudgmentDirection({ dx: -48, dy: 4, vx: -0.1 })).toBe("left");
    expect(resolveSwipeJudgmentDirection({ dx: 48, dy: 4, vx: 0.1 })).toBe("right");
  });

  test("commits a short fast flick", () => {
    expect(resolveSwipeJudgmentDirection({ dx: -20, dy: 1, vx: -0.6 })).toBe("left");
    expect(resolveSwipeJudgmentDirection({ dx: 20, dy: 1, vx: 0.6 })).toBe("right");
  });

  test("rejects a vertical-dominant diagonal gesture", () => {
    expect(resolveSwipeJudgmentDirection({ dx: 50, dy: 90, vx: 0.8 })).toBeNull();
  });
});
