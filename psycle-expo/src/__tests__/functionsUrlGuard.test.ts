import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "..", "..");
const HARDCODED_PRODUCTION_FUNCTIONS_HOST = "nudmnbmasmtacoluyvqo.functions.supabase.co";

describe("Supabase Functions URL guard", () => {
  test("plans module no longer contains a hardcoded production fallback URL", () => {
    const plansSource = fs.readFileSync(path.join(repoRoot, "lib", "plans.ts"), "utf8");
    const billingSource = fs.readFileSync(path.join(repoRoot, "lib", "billing.ts"), "utf8");

    expect(plansSource).toContain("getSupabaseFunctionsUrl");
    expect(plansSource).not.toContain(HARDCODED_PRODUCTION_FUNCTIONS_HOST);
    expect(billingSource).toContain("getSupabaseFunctionsUrl");
    expect(billingSource).not.toContain("SUPABASE_FUNCTION_URL");
    expect(billingSource).not.toContain(HARDCODED_PRODUCTION_FUNCTIONS_HOST);
  });

  test("getSupabaseFunctionsUrl fail-safe behavior is explicitly defined in source", () => {
    const plansSource = fs.readFileSync(path.join(repoRoot, "lib", "plans.ts"), "utf8");

    expect(plansSource).toMatch(/if \(!configuredUrl\)\s*\{\s*return null;\s*\}/);
    expect(plansSource).toContain("configuredUrl.replace(/\\/+$/, \"\")");
  });
});
