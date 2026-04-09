import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("quests / settings shell architecture", () => {
  test("quests screen delegates event impressions and section rendering", () => {
    const source = read("app/(tabs)/quests.tsx");
    const sections = read("components/quests/QuestSections.tsx");
    const hook = read("lib/quests/useQuestEventImpressions.ts");

    expect(source).toContain("useQuestEventImpressions");
    expect(source).toContain("EventCampaignSection");
    expect(source).toContain("MonthlyQuestSection");
    expect(source).toContain("QuestSection");
    expect(source).not.toContain("trackEventSectionShown");
    expect(source).not.toContain("const renderQuest =");

    expect(sections).toContain("export function QuestCard");
    expect(sections).toContain("export function QuestSection");
    expect(sections).toContain("export function EventCampaignSection");
    expect(hook).toContain("export function useQuestEventImpressions");
  });

  test("settings screen composes extracted section components", () => {
    const source = read("app/settings/index.tsx");
    const sections = read("components/settings/SettingsSections.tsx");

    expect(source).toContain("SettingsAccountSection");
    expect(source).toContain("SettingsPreferenceSection");
    expect(source).toContain("SettingsSupportSection");
    expect(source).toContain("SettingsDebugSection");
    expect(source).not.toContain("<SettingsSection title={i18n.t(\"settings.account\")}>");

    expect(sections).toContain("export function SettingsAccountSection");
    expect(sections).toContain("export function SettingsPreferenceSection");
    expect(sections).toContain("export function SettingsSupportSection");
    expect(sections).toContain("export function SettingsDebugSection");
  });
});
