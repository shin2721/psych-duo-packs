import fs from "node:fs";

const source = fs.readFileSync(
  "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/app/(tabs)/profile.tsx",
  "utf8"
);

describe("profile screen architecture", () => {
  test("screen uses useProfileScreen and avoids direct data dependencies", () => {
    expect(source).toContain('import { useProfileScreen } from "../../lib/profile/useProfileScreen";');
    expect(source).toContain("const { leagueLabel, leagueLoading, profileUsername, avatarIcon, userEmail } = useProfileScreen();");
    expect(source).not.toContain('from "../../lib/supabase"');
    expect(source).not.toContain('from "../../lib/league"');
    expect(source).not.toContain("refreshProfile = React.useCallback");
    expect(source).not.toContain("refreshLeague = React.useCallback");
  });
});
