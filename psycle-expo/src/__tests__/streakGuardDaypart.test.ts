import { getLocalDaypart, getStreakGuardCopyVariant } from "../../lib/streaks";

describe("streak guard daypart", () => {
  test("時間帯境界を正しく判定する", () => {
    expect(getLocalDaypart(new Date(2026, 1, 14, 5, 0, 0))).toBe("morning");
    expect(getLocalDaypart(new Date(2026, 1, 14, 11, 59, 0))).toBe("morning");
    expect(getLocalDaypart(new Date(2026, 1, 14, 12, 0, 0))).toBe("daytime");
    expect(getLocalDaypart(new Date(2026, 1, 14, 17, 59, 0))).toBe("daytime");
    expect(getLocalDaypart(new Date(2026, 1, 14, 18, 0, 0))).toBe("evening");
    expect(getLocalDaypart(new Date(2026, 1, 14, 23, 59, 0))).toBe("evening");
    expect(getLocalDaypart(new Date(2026, 1, 14, 0, 0, 0))).toBe("late_night");
    expect(getLocalDaypart(new Date(2026, 1, 14, 4, 59, 0))).toBe("late_night");
  });

  test("copyVariant は daypart と同じ値を使う", () => {
    expect(getStreakGuardCopyVariant("morning")).toBe("morning");
    expect(getStreakGuardCopyVariant("daytime")).toBe("daytime");
    expect(getStreakGuardCopyVariant("evening")).toBe("evening");
    expect(getStreakGuardCopyVariant("late_night")).toBe("late_night");
  });
});

