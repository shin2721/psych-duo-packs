import fs from "fs";
import path from "path";

const progressionFile = path.join(
  __dirname,
  "../../lib/app-state/progression.tsx"
);

describe("progression logging policy", () => {
  test("recoverable sync paths use dev helpers and do not keep legacy console calls", () => {
    const source = fs.readFileSync(progressionFile, "utf8");

    expect(source).toContain('logDev("Progression Supabase sync failed (using local data):", error)');
    expect(source).toContain('logDev("Progression local storage read failed:", error)');
    expect(source).toContain('warnDev("Failed to sync XP to Supabase", error)');
    expect(source).toContain('warnDev("Failed to sync streak to Supabase", error)');
    expect(source).toContain('warnDev("[League] Failed to add weekly XP:", error)');

    expect(source).not.toContain('console.log("Progression Supabase sync failed (using local data):"');
    expect(source).not.toContain('console.log("Progression local storage read failed:"');
    expect(source).not.toContain('console.error("Failed to sync XP to Supabase"');
    expect(source).not.toContain('console.error("Failed to sync streak to Supabase"');
    expect(source).not.toContain('console.log("[League] Weekly XP added:"');
  });
});
