import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("remoteContent logging policy", () => {
  test("success-path console logs are removed or routed through devLog", () => {
    const source = read("lib/remoteContent.ts");

    expect(source).not.toContain("console.log('[RemoteContent] Already up to date')");
    expect(source).not.toContain("console.log(`[RemoteContent] Update available:");
    expect(source).not.toContain("console.log(`[RemoteContent] Lessons to download:");
    expect(source).not.toContain("console.log(`[RemoteContent] Successfully updated to v");
    expect(source).not.toContain("console.log(`[RemoteContent] Cleared ");
    expect(source).toContain("logDev(`[RemoteContent] Content updated to v");
    expect(source).toContain("logDev(`[RemoteContent] Cleared ${removedCount} cached items`)");
  });

  test("recoverable warnings are routed through warnDev helper", () => {
    const shared = read("lib/remoteContent.shared.ts");
    const runtime = read("lib/remoteContentRuntime.ts");
    const source = read("lib/remoteContent.ts");

    expect(shared).toContain("function warnRemoteContent(message: string, error?: unknown): void");
    expect(shared).toContain("warnDev(`[RemoteContent] ${message}`, error);");
    expect(runtime).toContain('warnRemoteContent("Failed to get cached manifest:", error);');
    expect(runtime).toContain('warnRemoteContent("Error fetching manifest:", error);');
    expect(runtime).toContain("warnRemoteContent(`Failed to get cached lesson ${lessonId}:`, error);");
    expect(runtime).toContain("warnRemoteContent(`Error downloading lesson ${meta.id}:`, error);");
    expect(runtime).toContain("warnRemoteContent(`SHA256 mismatch for ${meta.id}`");
    expect(source).not.toContain("console.warn(`[RemoteContent] ROLLBACK:");
  });
});
