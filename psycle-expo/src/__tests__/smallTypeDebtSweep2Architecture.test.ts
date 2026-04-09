import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("small type debt sweep 2 architecture", () => {
  test("target files remove remaining small any holes", () => {
    const onboarding = read("app/onboarding/index.tsx");
    const course = read("app/(tabs)/course.tsx");
    const quests = read("app/(tabs)/quests.tsx");
    const gamesExtra = read("lib/games.extra.ts");
    const api = read("lib/api.ts");
    const remoteContent = read("lib/remoteContent.ts");
    const dogfood = read("lib/dogfood.ts");

    expect(onboarding).toContain("{ icon: IoniconName; text: string }");
    expect(onboarding).not.toContain("icon: any");

    expect(course).toContain("useState<string | null>(null)");
    expect(course).not.toContain("useState<any>(null)");

    expect(quests).toContain("type QuestItem = (typeof quests)[number];");
    expect(quests).toContain("const renderQuest = (q: QuestItem) => {");
    expect(quests).not.toContain("renderQuest = (q: any)");

    expect(gamesExtra).toContain("meta?: Record<string, unknown>;");
    expect(gamesExtra).not.toContain("Record<string, any>");

    expect(api).toContain("function readBaseUrl(): string | undefined");
    expect(api).not.toContain("as any");

    expect(remoteContent).toContain("Promise<Record<string, unknown> | null>");
    expect(remoteContent).not.toContain("Promise<any | null>");

    expect(dogfood).toContain("type ExportableDogfoodJson");
    expect(dogfood).toContain("const byIntervention: Record<string, InterventionStats> = {};");
    expect(dogfood).not.toContain("Record<string, any>");
  });
});
