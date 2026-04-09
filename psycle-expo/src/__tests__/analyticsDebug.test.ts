jest.mock("expo/env", () => ({}), { virtual: true });
jest.mock("expo/virtual/env", () => ({}), { virtual: true });

describe("analytics debug", () => {
  const loadDebugModule = () => require("../../lib/analytics-debug");

  beforeEach(() => {
    jest.resetModules();
  });

  test("tracked events increment counters without widening to arbitrary names", () => {
    const {
      getDebugState,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-1");
    recordDebugEvent("app_open", "sent", "anon-1");
    recordDebugEvent("custom_event", "sent", "anon-1");

    const state = getDebugState();
    expect(state.counters.app_open).toBe(1);
    expect(state.counters.custom_event).toBeUndefined();
  });

  test("system events stay out of tracked counters", () => {
    const {
      getDebugState,
      recordSystemEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-2");
    recordSystemEvent("initialized", "anon-2");

    const state = getDebugState();
    expect(state.counters.app_open).toBe(0);
    expect(state.events[0]).toMatchObject({
      type: "system",
      name: "initialized",
      anonId: "anon-2",
    });
  });
});
