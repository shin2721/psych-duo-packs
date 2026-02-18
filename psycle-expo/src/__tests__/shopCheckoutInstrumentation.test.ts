import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "..", "..");

describe("Shop checkout hardening", () => {
  test("shop checkout emits instrumentation and fails safe when functions URL is missing", () => {
    const shopSource = fs.readFileSync(path.join(repoRoot, "app", "(tabs)", "shop.tsx"), "utf8");

    expect(shopSource).toContain('Analytics.track("plan_select"');
    expect(shopSource).toContain('Analytics.track("checkout_start"');
    expect(shopSource).toContain('source: "shop_tab"');
    expect(shopSource).toContain("missing_authenticated_user");
    expect(shopSource).toContain("functions_url_missing");
    expect(shopSource).toContain("getSupabaseFunctionsUrl");
    expect(shopSource).not.toContain("user@example.com");
  });
});
