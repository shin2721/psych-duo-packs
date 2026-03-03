import { parseExtractedSeedPayload } from "../../scripts/content-generator/src/extractor";

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    core_principle: "テスト原理",
    core_principle_en: "Test Principle",
    counter_intuitive_insight: "直感に反する気づき",
    common_misconception: "よくある誤解",
    actionable_tactic: "今日できる行動",
    academic_reference: "Author (2025)",
    domain: "mental",
    evidence_grade: "silver",
    cultural_notes: "日本語文脈",
    extractionConfidence: 0.8,
    ...overrides,
  };
}

describe("content-generator extractor payload validation", () => {
  test("returns normalized seed when payload is valid", () => {
    const parsed = parseExtractedSeedPayload(makePayload(), "https://example.com/article");

    expect(parsed).not.toBeNull();
    expect(parsed!.domain).toBe("mental");
    expect(parsed!.originalLink).toBe("https://example.com/article");
    expect(parsed!.suggested_question_types).toEqual([]);
  });

  test("returns null when payload shape is invalid", () => {
    const parsed = parseExtractedSeedPayload({ domain: "mental" }, "https://example.com/article");
    expect(parsed).toBeNull();
  });

  test("returns null when domain is invalid", () => {
    const parsed = parseExtractedSeedPayload(makePayload({ domain: "unknown_domain" }), "https://example.com/article");
    expect(parsed).toBeNull();
  });

  test("normalizes productivity alias to study", () => {
    const parsed = parseExtractedSeedPayload(
      makePayload({ domain: "productivity" }),
      "https://example.com/article"
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.domain).toBe("study");
  });

  test("normalizes relationships alias to social", () => {
    const parsed = parseExtractedSeedPayload(
      makePayload({ domain: "relationships" }),
      "https://example.com/article"
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.domain).toBe("social");
  });
});

