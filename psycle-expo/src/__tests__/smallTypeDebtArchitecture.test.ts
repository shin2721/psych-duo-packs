import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("small type debt architecture", () => {
  test("target files remove small any-based type holes", () => {
    const settingsRows = read("components/settings/SettingsRows.tsx");
    const editProfile = read("app/settings/edit-profile.tsx");
    const evidenceBottomSheet = read("components/EvidenceBottomSheet.tsx");
    const evidenceSources = read("components/evidenceBottomSheetSources.ts");
    const leagueReward = read("lib/leagueReward.ts");
    const data = read("lib/data.ts");

    expect(settingsRows).toContain("icon: IoniconName;");
    expect(settingsRows).not.toContain("icon: any");

    expect(editProfile).toContain("catch (error: unknown)");
    expect(editProfile).toContain("mapEditProfileErrorMessage(getErrorMessage(error))");
    expect(editProfile).not.toContain("catch (error: any)");

    expect(evidenceBottomSheet).toContain("EvidenceBottomSheetDetails");
    expect(evidenceSources).toContain("interface CuratedSourcesJson");
    expect(evidenceSources).toContain("(curatedSourcesData as CuratedSourcesJson).sources || {}");
    expect(evidenceBottomSheet).not.toContain("curatedSourcesData as any");

    expect(leagueReward).toContain("interface LeagueResultRow");
    expect(leagueReward).toContain("const row = data as LeagueResultRow;");
    expect(leagueReward).not.toContain("data as any");

    expect(data).toContain("export interface TrailNode");
    expect(data).toContain("export const trailsByGenre: Record<string, TrailNode[]> = {");
    expect(data).not.toContain("Record<string, any[]>");
  });
});
