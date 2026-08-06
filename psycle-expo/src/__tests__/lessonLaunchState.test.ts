import {
  resolveLessonLaunchGate,
  resolveLessonRuntimeAvailability,
} from "../../lib/lesson/lessonLaunchState";

describe("lesson launch state", () => {
  test("classifies insufficient energy separately from a missing question", () => {
    const consumeEnergy = jest.fn(() => false);

    expect(
      resolveLessonLaunchGate({
        consumeEnergy,
        lessonEnergyCost: 1,
        questionCount: 5,
      })
    ).toBe("energy_blocked");
    expect(consumeEnergy).toHaveBeenCalledTimes(1);

    expect(
      resolveLessonRuntimeAvailability({
        hasCurrentQuestion: false,
        launchState: "energy_blocked",
      })
    ).toEqual({
      canStart: false,
      energyBlocked: true,
      loadError: false,
    });
  });

  test("does not charge an empty lesson or an explicit development preview", () => {
    const consumeEnergy = jest.fn(() => true);

    expect(
      resolveLessonLaunchGate({
        consumeEnergy,
        lessonEnergyCost: 1,
        questionCount: 0,
      })
    ).toBe("failed");
    expect(
      resolveLessonLaunchGate({
        consumeEnergy,
        lessonEnergyCost: 1,
        questionCount: 5,
        skipEnergyCharge: true,
      })
    ).toBe("ready");
    expect(consumeEnergy).not.toHaveBeenCalled();
  });

  test("allows a funded lesson and only treats real load failure as loadError", () => {
    expect(
      resolveLessonLaunchGate({
        consumeEnergy: () => true,
        lessonEnergyCost: 1,
        questionCount: 5,
      })
    ).toBe("ready");
    expect(
      resolveLessonRuntimeAvailability({
        hasCurrentQuestion: true,
        launchState: "ready",
      })
    ).toEqual({
      canStart: true,
      energyBlocked: false,
      loadError: false,
    });
    expect(
      resolveLessonRuntimeAvailability({
        hasCurrentQuestion: false,
        launchState: "failed",
      })
    ).toEqual({
      canStart: false,
      energyBlocked: false,
      loadError: true,
    });
  });
});
