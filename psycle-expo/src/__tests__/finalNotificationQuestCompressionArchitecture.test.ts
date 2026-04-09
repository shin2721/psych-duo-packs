import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("final notification and quest compression architecture", () => {
  test("notifications delegates core implementation to notificationsCore", () => {
    const source = read("lib/notifications.ts");
    const core = read("lib/notificationsCore.ts");

    expect(source).toContain('from "./notificationsCore"');
    expect(source).not.toContain("async function scheduleReminder");
    expect(core).toContain("async function scheduleReminder");
    expect(core).toContain("export async function syncDailyReminders");
  });

  test("questDefinitions delegates templates and factory helpers", () => {
    const source = read("lib/questDefinitions.ts");
    const templates = read("lib/questTemplates.ts");
    const factory = read("lib/questFactory.ts");

    expect(source).toContain('from "./questTemplates"');
    expect(source).toContain('from "./questFactory"');
    expect(source).not.toContain("const QUEST_TEMPLATE_BY_ID");
    expect(templates).toContain("const map = new Map<string, QuestTemplate>()");
    expect(factory).toContain("export function createQuestInstanceFromTemplate");
    expect(factory).toContain("export function getQuestTemplateNeed");
  });
});
