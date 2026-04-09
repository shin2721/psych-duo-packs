import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("profile / review / mistakes-hub / auth shell architecture", () => {
  test("profile screen composes extracted profile sections", () => {
    const source = read("app/(tabs)/profile.tsx");
    const sections = read("components/profile/ProfileSections.tsx");

    expect(source).toContain("ProfileHeader");
    expect(source).toContain("ProfileCardSection");
    expect(source).toContain("ProfileStatsGrid");
    expect(source).toContain("ProfileBadgesSection");
    expect(source).toContain("ProfileQuickActionsSection");
    expect(source).not.toContain("function StatCard(");
    expect(source).not.toContain("function ActionRow(");

    expect(sections).toContain("export function ProfileHeader");
    expect(sections).toContain("export function ProfileCardSection");
    expect(sections).toContain("export function ProfileStatsGrid");
  });

  test("review screen composes extracted review sections", () => {
    const source = read("app/review.tsx");
    const sections = read("components/review/ReviewSections.tsx");

    expect(source).toContain("ReviewScreenHeader");
    expect(source).toContain("ReviewIntroSection");
    expect(source).toContain("ReviewFeedbackBanner");
    expect(source).not.toContain("statsCard:");
    expect(source).not.toContain("reviewFeedback:");

    expect(sections).toContain("export function ReviewScreenHeader");
    expect(sections).toContain("export function ReviewIntroSection");
    expect(sections).toContain("export function ReviewFeedbackBanner");
  });

  test("mistakes hub screen composes extracted state and session chrome", () => {
    const source = read("app/mistakes-hub.tsx");
    const sections = read("components/review/MistakesHubSections.tsx");

    expect(source).toContain("MistakesHubStateView");
    expect(source).toContain("MistakesHubSessionHeader");
    expect(source).not.toContain("progressTrack:");
    expect(source).not.toContain("statePanelWrap:");

    expect(sections).toContain("export function MistakesHubStateView");
    expect(sections).toContain("export function MistakesHubSessionHeader");
  });

  test("auth screen composes extracted auth sections", () => {
    const source = read("app/auth.tsx");
    const sections = read("components/auth/AuthSections.tsx");

    expect(source).toContain("AuthCard");
    expect(source).toContain("AuthCredentialsSection");
    expect(source).toContain("AuthResetButton");
    expect(source).toContain("AuthPrimaryActions");
    expect(source).toContain("AuthGuestSection");
    expect(source).not.toContain("passwordField:");
    expect(source).not.toContain("guestButtonContainer:");

    expect(sections).toContain("export function AuthCard");
    expect(sections).toContain("export function AuthCredentialsSection");
    expect(sections).toContain("export function AuthPrimaryActions");
    expect(sections).toContain("export function AuthGuestSection");
  });
});
