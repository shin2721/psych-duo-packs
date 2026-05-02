jest.mock("expo/env", () => ({}), { virtual: true });
jest.mock("expo/virtual/env", () => ({}), { virtual: true });

import { toAnalyticsDebugMeta } from "../../lib/analytics-runtime/analyticsDebugRuntime";

describe("analytics debug runtime", () => {
  test("preserves non-primitive engagement payloads as bounded strings", () => {
    const meta = toAnalyticsDebugMeta({
      selectedGenres: ["work", "study"],
      reward: { type: "gems", amount: 5 },
      omitted: undefined,
      nullValue: null,
    });

    expect(meta).toEqual({
      selectedGenres: '["work","study"]',
      reward: '{"type":"gems","amount":5}',
      nullValue: "null",
    });
  });

  test("truncates oversized debug payload values", () => {
    const meta = toAnalyticsDebugMeta({
      payload: { text: "x".repeat(500) },
    });

    expect(String(meta.payload).length).toBeLessThanOrEqual(240);
    expect(String(meta.payload)).toContain("…");
  });
});
