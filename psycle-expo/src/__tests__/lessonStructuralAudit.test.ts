import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const appRoot = path.resolve(__dirname, "../..");

describe("lesson structural audit", () => {
  test("accepts a six-question lesson without requiring fixed copy or swipe", () => {
    const fixtureRoot = mkdtempSync(path.join(tmpdir(), "psycle-lesson-audit-"));
    const fixturePath = path.join(fixtureRoot, "fixture_l01.ja.json");
    const questions = Array.from({ length: 6 }, (_, index) => ({
      id: `fixture_l01_${String(index + 1).padStart(3, "0")}`,
      type: "multiple_choice",
      question: `場面${index + 1}では何を見る？`,
      choices: ["A", "B", "C"],
      correct_index: 0,
      explanation: `場面${index + 1}で使える別の見方`,
      claim_id: "fixture_claim",
      source_id: "fixture_source",
      evidence_grade: "silver",
      difficulty: "easy",
      xp: 5,
      actionable_advice: index === 5 ? "次の場面で10秒だけ試す" : undefined,
      expanded_details: {
        best_for: ["仕事", "買い物", "会話"],
        limitations: ["緊急時には使わない"],
      },
    }));
    writeFileSync(fixturePath, JSON.stringify(questions, null, 2), "utf8");

    try {
      const result = spawnSync(
        process.execPath,
        [path.join(appRoot, "scripts", "audit-lesson-quality-algorithm.js")],
        {
          cwd: appRoot,
          encoding: "utf8",
          env: {
            ...process.env,
            PSYCLE_AUDIT_LESSON_ID: "fixture_l01",
            PSYCLE_AUDIT_LESSON_PATH: fixturePath,
          },
        }
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("questions: 6 (not fixed by this audit)");
      expect(result.stdout).toContain("lesson structural contracts: OK");
      expect(`${result.stdout}\n${result.stderr}`).not.toContain("16/16");
      expect(`${result.stdout}\n${result.stderr}`).not.toContain("100/100");
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
