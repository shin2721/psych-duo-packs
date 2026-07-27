import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve(__dirname, "../..");
const legacyCheckout = "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo";

describe("iOS repair worktree safety", () => {
  test.each([
    "scripts/ios/seed-swift-compat-headers.mjs",
    "scripts/ios/run-repair-build-detached.sh",
    "scripts/ios/run-device-repair-build-detached.sh",
  ])("%s resolves native inputs from its own checkout", (relativePath) => {
    const source = fs.readFileSync(path.join(appRoot, relativePath), "utf8");

    expect(source).not.toContain(legacyCheckout);
  });
});
