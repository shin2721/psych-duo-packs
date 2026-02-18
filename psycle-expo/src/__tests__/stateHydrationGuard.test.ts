import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "..", "..");

describe("State hydration guard", () => {
  test("state provider gates persistence until hydration completes", () => {
    const stateSource = fs.readFileSync(path.join(repoRoot, "lib", "state.tsx"), "utf8");

    expect(stateSource).toContain("const [isStateHydrated, setIsStateHydrated] = useState(false);");
    expect(stateSource).toContain("setIsStateHydrated(false);");
    expect(stateSource).toContain("setIsStateHydrated(true);");
    expect(stateSource).toContain("AsyncStorage.getItem(`mistakes_${user.id}`)");

    const guardMatches = stateSource.match(/if \(!user \|\| !isStateHydrated\) return;/g) ?? [];
    expect(guardMatches.length).toBeGreaterThanOrEqual(8);
  });
});
