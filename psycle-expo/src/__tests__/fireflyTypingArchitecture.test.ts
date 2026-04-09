import fs from "node:fs";

const source = fs.readFileSync(
  "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/components/Firefly.tsx",
  "utf8"
);

describe("firefly typing architecture", () => {
  test("firefly uses typed style props and removes as any", () => {
    expect(source).toContain("style?: StyleProp<ViewStyle>;");
    expect(source).toContain("satisfies ViewStyle");
    expect(source).toContain("satisfies ImageStyle");
    expect(source).not.toContain("style?: any;");
    expect(source).not.toContain("as any");
  });
});
