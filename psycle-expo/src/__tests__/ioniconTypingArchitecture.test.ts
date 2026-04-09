import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("ionicon typing architecture", () => {
  test("shared IoniconName type is used by icon-heavy files", () => {
    const echoSteps = read("components/games/EchoSteps.tsx");
    const badges = read("lib/badges.ts");
    const profile = read("app/(tabs)/profile.tsx");
    const interests = read("app/onboarding/interests.tsx");

    expect(read("lib/ioniconName.ts")).toContain("export type IoniconName");
    expect(echoSteps).toContain("const ICON_POOL: IoniconName[]");
    expect(echoSteps).not.toContain("as any");
    expect(badges).toContain("icon: IoniconName;");
    expect(profile).not.toContain("avatarIcon as any");
    expect(interests).toContain("const iconMap: Record<string, IoniconName>");
  });
});
