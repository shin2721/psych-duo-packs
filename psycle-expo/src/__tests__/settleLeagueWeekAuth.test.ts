import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "..", "..");

describe("settle-league-week auth guard", () => {
  test("edge function requires POST and x-cron-secret", () => {
    const fnSource = fs.readFileSync(
      path.join(repoRoot, "supabase", "functions", "settle-league-week", "index.ts"),
      "utf8"
    );

    expect(fnSource).toContain("req.method !== 'POST'");
    expect(fnSource).toContain("LEAGUE_SETTLE_CRON_SECRET");
    expect(fnSource).toContain("x-cron-secret");
    expect(fnSource).toContain("status: 403");
    expect(fnSource).toContain("status: 405");
  });
});
