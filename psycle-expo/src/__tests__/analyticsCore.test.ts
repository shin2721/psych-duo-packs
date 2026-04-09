jest.mock("expo/env", () => ({}), { virtual: true });
jest.mock("expo/virtual/env", () => ({}), { virtual: true });
jest.mock("../../lib/analytics.config", () => ({
  analyticsConfig: {
    enabled: true,
    debug: false,
    appEnv: "dev",
    endpoint: "https://example.com/analytics",
    posthogHost: undefined,
    posthogApiKey: undefined,
  },
}));

type AnalyticsModule = typeof import("../../lib/analytics");
type AsyncStorageModule = typeof import("@react-native-async-storage/async-storage");

async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function loadAnalytics(): AnalyticsModule["Analytics"] {
  return require("../../lib/analytics").Analytics;
}

function loadAsyncStorage(): AsyncStorageModule {
  return require("@react-native-async-storage/async-storage");
}

describe("analytics core", () => {
  let fetchMock: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.useRealTimers();
    const AsyncStorage = loadAsyncStorage();
    await AsyncStorage.clear();
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
    jest.dontMock("../../lib/analytics-debug");
  });

  test("track queues before initialize and flushes after initialize succeeds", async () => {
    const Analytics = loadAnalytics();

    Analytics.track("lesson_start", { lessonId: "lesson-1", genreId: "genre-1" });
    await Analytics.initialize({ debug: false });
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String((request as RequestInit).body));
    expect(payload.name).toBe("lesson_start");
    expect(payload.properties).toEqual({
      lessonId: "lesson-1",
      genreId: "genre-1",
    });
  });

  test("initialize reuses a shared promise while initialization is in flight", async () => {
    jest.useFakeTimers();
    const AsyncStorage = loadAsyncStorage();
    const getItemSpy = jest
      .spyOn(AsyncStorage, "getItem")
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(null), 5);
          })
      );
    const Analytics = loadAnalytics();

    const first = Analytics.initialize({ debug: false });
    const second = Analytics.initialize({ debug: false });

    await jest.runAllTimersAsync();
    await expect(Promise.all([first, second])).resolves.toEqual([
      undefined,
      undefined,
    ]);
    expect(getItemSpy).toHaveBeenCalled();
  });

  test("trackAppOpen only tracks once behind the storage guard", async () => {
    const Analytics = loadAnalytics();
    const trackSpy = jest.spyOn(Analytics, "track");

    await Analytics.trackAppOpen();
    await Analytics.trackAppOpen();

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith("app_open");
  });

  test("send and storage failures stay recoverable", async () => {
    const Analytics = loadAnalytics();
    const AsyncStorage = loadAsyncStorage();
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await Analytics.initialize({ debug: false });

    expect(() =>
      Analytics.track("lesson_start", {
        lessonId: "lesson-1",
        genreId: "genre-1",
      })
    ).not.toThrow();
    await flushMicrotasks();

    const getItemSpy = jest
      .spyOn(AsyncStorage, "getItem")
      .mockRejectedValueOnce(new Error("storage down"));

    await expect(Analytics.trackAppOpen()).resolves.toBeUndefined();
    expect(getItemSpy).toHaveBeenCalled();
  });

  test("lazy initialization failures do not throw back into track", async () => {
    jest.doMock("../../lib/analytics-debug", () => {
      const actual = jest.requireActual("../../lib/analytics-debug");
      return {
        ...actual,
        setCurrentAnonId: jest.fn(() => {
          throw new Error("debug hook failed");
        }),
      };
    });

    const Analytics = loadAnalytics();

    expect(() =>
      Analytics.track("lesson_start", {
        lessonId: "lesson-1",
        genreId: "genre-1",
      })
    ).not.toThrow();
    await flushMicrotasks();
  });

  test("setUserId preserves anonId while attaching userId to sent events", async () => {
    const Analytics = loadAnalytics();

    await Analytics.initialize({ debug: false });

    const anonId = Analytics.getAnonId();
    Analytics.setUserId("user-123");
    Analytics.track("lesson_complete", {
      lessonId: "lesson-1",
      genreId: "genre-1",
    });
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String((request as RequestInit).body));
    expect(payload.anonId).toBe(anonId);
    expect(payload.userId).toBe("user-123");
  });
});
