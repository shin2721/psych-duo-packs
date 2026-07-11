const {
  checkAlignment,
  extractLessonTexts,
  findMissingDoiSources,
  normalizeDoi,
} = require("../../scripts/lint-claim-alignment.js");

function makeEvidence(doi: string) {
  return {
    claim: "判断を一度保留するという限定的な判断補助。",
    source_label: "Example source",
    evidence_grade: "bronze",
    citations: [{ doi }],
    status: "active",
    review: { human_approved: true },
  };
}

describe("claim alignment linter", () => {
  test("reads the repository's array-form lesson data", () => {
    const lesson = [
      {
        question: "必ず正しい？",
        choices: ["必ず正しい", "条件で変わる"],
        explanation: "結果は条件で変わる。",
        actionable_advice: "次の場面で一度確認する。",
      },
    ];

    expect(extractLessonTexts(lesson)).toEqual([
      "結果は条件で変わる。",
      "次の場面で一度確認する。",
    ]);
  });

  test("normalizes DOI source IDs and canonical DOI strings equally", () => {
    expect(normalizeDoi("doi_10_1080_01639625_2025_2608885")).toBe(
      normalizeDoi("https://doi.org/10.1080/01639625.2025.2608885")
    );
  });

  test("rejects a question DOI that is absent from its evidence package", () => {
    const lesson = [
      {
        source_id: "doi_10_1080_01639625_2025_2608885",
        explanation: "個人の原因は断定しない。",
      },
    ];
    const evidence = makeEvidence("10.1000/unrelated");

    expect(findMissingDoiSources(lesson, evidence)).toEqual([
      "doi_10_1080_01639625_2025_2608885",
    ]);
    expect(checkAlignment(lesson, evidence, "money_l01")).toContain(
      "Lesson DOI source missing from evidence citations: doi_10_1080_01639625_2025_2608885"
    );
  });

  test("accepts the matching DOI in the evidence package", () => {
    const lesson = [
      {
        source_id: "doi_10_1080_01639625_2025_2608885",
        explanation: "個人の原因は断定しない。",
      },
    ];
    const evidence = makeEvidence("10.1080/01639625.2025.2608885");

    expect(findMissingDoiSources(lesson, evidence)).toEqual([]);
    expect(checkAlignment(lesson, evidence, "money_l01")).toEqual([]);
  });
});
