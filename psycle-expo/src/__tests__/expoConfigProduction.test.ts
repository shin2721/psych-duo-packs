const {
  resolveExpoConfig,
} = require("../../config/resolveExpoConfig.cjs");

describe("expo production config", () => {
  test("keeps dev-client and local networking for non-production profiles", () => {
    const config = resolveExpoConfig({ EAS_BUILD_PROFILE: "development" });

    expect(config.plugins).toContain("expo-dev-client");
    expect(config.ios.infoPlist.NSAppTransportSecurity.NSAllowsLocalNetworking).toBe(true);
    expect(config.ios.infoPlist.NSAppTransportSecurity.NSExceptionDomains["exp.direct"]).toBeTruthy();
  });

  test("strips dev-client and dev-only ATS exceptions for EAS production", () => {
    const config = resolveExpoConfig({ EAS_BUILD_PROFILE: "production" });
    const ats = config.ios.infoPlist.NSAppTransportSecurity;

    expect(config.plugins).not.toContain("expo-dev-client");
    expect(ats.NSAllowsLocalNetworking).toBeUndefined();
    expect(ats.NSExceptionDomains?.["exp.direct"]).toBeUndefined();
    expect(ats.NSAllowsArbitraryLoads).toBe(false);
    expect(config.ios.config.usesNonExemptEncryption).toBe(false);
  });
});
