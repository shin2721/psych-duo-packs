import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "..", "..");

function readRepoFile(...segments: string[]): string {
  const targetPath = path.join(repoRoot, ...segments);
  return fs.readFileSync(targetPath, "utf8");
}

describe("Auth guest removal", () => {
  test("AuthContext no longer exposes signInAsGuest or fake guest token flow", () => {
    const authContextSource = readRepoFile("lib", "AuthContext.tsx");

    expect(authContextSource).not.toContain("signInAsGuest");
    expect(authContextSource).not.toContain("guest_token");
    expect(authContextSource).not.toContain("AsyncStorage.getItem('guestSession')");
    expect(authContextSource).toContain("AsyncStorage.removeItem('guestSession')");
  });

  test("Auth screen no longer renders guest login button", () => {
    const authScreenSource = readRepoFile("app", "auth.tsx");

    expect(authScreenSource).not.toContain("auth-guest-login");
    expect(authScreenSource).not.toContain("guestLogin");
  });
});
