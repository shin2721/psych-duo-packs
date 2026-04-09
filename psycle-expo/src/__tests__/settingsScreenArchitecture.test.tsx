import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("settings screen architecture", () => {
  test("settings screen delegates section composition and language modal to components", () => {
    const source = read("app/settings/index.tsx");
    const rows = read("components/settings/SettingsRows.tsx");
    const modal = read("components/settings/SettingsLanguageModal.tsx");
    const sections = read("components/settings/SettingsSections.tsx");

    expect(source).toContain('import { SettingsLanguageModal }');
    expect(source).toContain('import {');
    expect(source).toContain("SettingsAccountSection");
    expect(source).toContain("SettingsPreferenceSection");
    expect(source).toContain("SettingsSupportSection");
    expect(source).toContain("SettingsDebugSection");
    expect(source).toContain("<SettingsLanguageModal");
    expect(source).not.toContain("function SettingRow(");
    expect(source).not.toContain("function SettingToggle(");
    expect(source).not.toContain("function SettingStatusRow(");

    expect(rows).toContain("export function SettingRow");
    expect(rows).toContain("export function SettingToggle");
    expect(rows).toContain("export function SettingStatusRow");
    expect(sections).toContain("export function SettingsAccountSection");
    expect(sections).toContain("export function SettingsPreferenceSection");
    expect(sections).toContain("export function SettingsSupportSection");
    expect(sections).toContain("export function SettingsDebugSection");
    expect(modal).toContain("export function SettingsLanguageModal");
  });
});
