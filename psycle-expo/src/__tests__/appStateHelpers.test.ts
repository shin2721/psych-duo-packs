jest.mock("../../lib/app-state/persistence", () => ({
  getUserStorageKey: jest.fn((key: string, userId: string) => `${userId}:${key}`),
  persistJson: jest.fn().mockResolvedValue(undefined),
  persistNumber: jest.fn().mockResolvedValue(undefined),
  persistString: jest.fn().mockResolvedValue(undefined),
}));

import { runHydrationTask } from "../../lib/app-state/hydration";
import {
  createPersistJsonEffect,
  createPersistNumberEffect,
  createPersistStringEffect,
} from "../../lib/app-state/persistEffects";
import {
  getUserStorageKey,
  persistJson,
  persistNumber,
  persistString,
} from "../../lib/app-state/persistence";

const mockGetUserStorageKey = getUserStorageKey as jest.Mock;
const mockPersistJson = persistJson as jest.Mock;
const mockPersistNumber = persistNumber as jest.Mock;
const mockPersistString = persistString as jest.Mock;

async function flushAsyncWork() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("runHydrationTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("marks hydration start and finish around a successful task", async () => {
    const setIsHydrated = jest.fn();
    const onSuccess = jest.fn();

    runHydrationTask({
      setIsHydrated,
      task: async () => "ready",
      onSuccess,
    });

    await flushAsyncWork();

    expect(setIsHydrated.mock.calls).toEqual([[false], [true]]);
    expect(onSuccess).toHaveBeenCalledWith("ready");
  });

  test("reports recoverable task failures and still finishes hydration", async () => {
    const setIsHydrated = jest.fn();
    const onError = jest.fn();

    runHydrationTask({
      setIsHydrated,
      task: async () => {
        throw new Error("boom");
      },
      onError,
    });

    await flushAsyncWork();

    expect(setIsHydrated.mock.calls).toEqual([[false], [true]]);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  test("cancellation suppresses success and final hydration flip", async () => {
    const setIsHydrated = jest.fn();
    const onSuccess = jest.fn();
    let resolveTask!: () => void;

    const cancel = runHydrationTask({
      setIsHydrated,
      task: () =>
        new Promise<void>((resolve) => {
          resolveTask = resolve;
        }),
      onSuccess,
    });

    cancel();
    resolveTask();
    await flushAsyncWork();

    expect(setIsHydrated.mock.calls).toEqual([[false]]);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("persistEffects helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("skip persistence when the module is not hydrated or user is missing", async () => {
    createPersistNumberEffect({
      userId: null,
      isHydrated: true,
      key: "xp",
      value: 10,
    });
    createPersistJsonEffect({
      userId: "user-1",
      isHydrated: false,
      key: "quests",
      value: [],
    });

    await flushAsyncWork();

    expect(mockPersistNumber).not.toHaveBeenCalled();
    expect(mockPersistJson).not.toHaveBeenCalled();
  });

  test("persist helpers preserve key/value shape and allow null removal", async () => {
    createPersistNumberEffect({
      userId: "user-1",
      isHydrated: true,
      key: "xp",
      value: 15,
    });
    createPersistStringEffect({
      userId: "user-1",
      isHydrated: true,
      key: "personalizationSegment",
      value: null,
    });

    await flushAsyncWork();

    expect(mockGetUserStorageKey).toHaveBeenCalledWith("xp", "user-1");
    expect(mockPersistNumber).toHaveBeenCalledWith("user-1:xp", 15);
    expect(mockPersistString).toHaveBeenCalledWith("user-1:personalizationSegment", null);
  });

  test("persist helpers swallow recoverable storage failures", async () => {
    mockPersistJson.mockRejectedValueOnce(new Error("disk full"));

    createPersistJsonEffect({
      userId: "user-1",
      isHydrated: true,
      key: "reviewEvents",
      value: [{ id: "x" }],
    });

    await flushAsyncWork();

    expect(mockPersistJson).toHaveBeenCalledWith("user-1:reviewEvents", [{ id: "x" }]);
  });
});
