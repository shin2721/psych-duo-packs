import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("remaining error policy cleanup", () => {
  test("recoverable lesson/settings/shop/screen failures route through warnDev", () => {
    const lessonFlowCompletion = read("lib/lesson/lessonFlowCompletion.ts");
    const settingsNotifications = read("lib/settings/useSettingsNotifications.ts");
    const shopCheckout = read("lib/shop/shopCheckout.ts");
    const editProfile = read("app/settings/edit-profile.tsx");
    const questImpressions = read("lib/quests/useQuestEventImpressions.ts");

    expect(lessonFlowCompletion).toContain('warnDev("[Notifications] Failed to sync reminders from lesson:", error);');
    expect(lessonFlowCompletion).not.toContain('console.error("[Notifications] Failed to sync reminders from lesson:');

    expect(settingsNotifications).toContain('warnDev("Failed to load notification preference:", error);');
    expect(settingsNotifications).not.toContain('console.error("Failed to load notification preference:');

    expect(shopCheckout).toContain('warnDev("Failed to persist checkout context", error);');
    expect(shopCheckout).not.toContain('console.warn("Failed to persist checkout context"');

    expect(editProfile).toContain('warnDev("Failed to load profile settings:", error);');
    expect(editProfile).not.toContain('console.error("Failed to load profile settings:');

    expect(questImpressions).toContain('warnDev("[EventCampaign] Failed to read impression state:", error);');
    expect(questImpressions).toContain('warnDev("[EventCampaign] Failed to persist impression state:", error);');
    expect(questImpressions).toContain('warnDev("[EventCampaign] Failed to track impressions:", error);');
    expect(questImpressions).not.toContain('console.error("[EventCampaign] Failed to read impression state:');
    expect(questImpressions).not.toContain('console.error("[EventCampaign] Failed to persist impression state:');
    expect(questImpressions).not.toContain('console.error("[EventCampaign] Failed to track impressions:');
  });
});
