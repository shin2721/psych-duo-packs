import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { getLastSourceRegistryLoadInfo, loadSourceRegistryFromFile } from "../../scripts/content-generator/src/sourceRegistry";

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), "psycle-source-registry-"));
}

function writeRegistryFile(tempDir: string, filename: string, content: string): string {
  const filePath = join(tempDir, filename);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("content-generator source registry", () => {
  test("loads valid JSON and returns enabled sources", () => {
    const tempDir = createTempDir();
    try {
      const filePath = writeRegistryFile(
        tempDir,
        "valid.json",
        JSON.stringify({
          sources: [
            { id: "source_a", name: "Source A", url: "https://example.com/a.xml", enabled: true },
            { id: "source_b", name: "Source B", url: "https://example.com/b.xml", enabled: false },
          ],
        })
      );
      const sources = loadSourceRegistryFromFile(filePath);
      const info = getLastSourceRegistryLoadInfo();

      expect(sources).toHaveLength(1);
      expect(sources[0].id).toBe("source_a");
      expect(info.usedFallback).toBe(false);
      expect(info.source).toBe("file");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("excludes disabled sources from the loaded result", () => {
    const tempDir = createTempDir();
    try {
      const filePath = writeRegistryFile(
        tempDir,
        "enabled-filter.json",
        JSON.stringify({
          sources: [
            { id: "source_a", name: "Source A", url: "https://example.com/a.xml", enabled: true },
            { id: "source_b", name: "Source B", url: "https://example.com/b.xml", enabled: false },
            { id: "source_c", name: "Source C", url: "https://example.com/c.xml", enabled: true },
          ],
        })
      );
      const sources = loadSourceRegistryFromFile(filePath);

      expect(sources.map((source) => source.id)).toEqual(["source_a", "source_c"]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("falls back when URL is invalid", () => {
    const tempDir = createTempDir();
    try {
      const filePath = writeRegistryFile(
        tempDir,
        "invalid-url.json",
        JSON.stringify({
          sources: [{ id: "source_a", name: "Source A", url: "ftp://example.com/a.xml", enabled: true }],
        })
      );
      const sources = loadSourceRegistryFromFile(filePath);
      const info = getLastSourceRegistryLoadInfo();

      expect(sources).toHaveLength(3);
      expect(info.usedFallback).toBe(true);
      expect(info.reason).toContain("config_validation_error");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("falls back when source ids are duplicated", () => {
    const tempDir = createTempDir();
    try {
      const filePath = writeRegistryFile(
        tempDir,
        "duplicate-id.json",
        JSON.stringify({
          sources: [
            { id: "source_a", name: "Source A", url: "https://example.com/a.xml", enabled: true },
            { id: "source_a", name: "Source B", url: "https://example.com/b.xml", enabled: true },
          ],
        })
      );
      const sources = loadSourceRegistryFromFile(filePath);
      const info = getLastSourceRegistryLoadInfo();

      expect(sources).toHaveLength(3);
      expect(info.usedFallback).toBe(true);
      expect(info.reason).toContain("duplicate_source_id");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("falls back when JSON is malformed", () => {
    const tempDir = createTempDir();
    try {
      const filePath = writeRegistryFile(tempDir, "malformed.json", "{ invalid json");
      const sources = loadSourceRegistryFromFile(filePath);
      const info = getLastSourceRegistryLoadInfo();

      expect(sources).toHaveLength(3);
      expect(info.usedFallback).toBe(true);
      expect(info.reason).toContain("config_parse_error");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("falls back when file is missing", () => {
    const tempDir = createTempDir();
    try {
      const filePath = join(tempDir, "missing.json");
      const sources = loadSourceRegistryFromFile(filePath);
      const info = getLastSourceRegistryLoadInfo();

      expect(sources).toHaveLength(3);
      expect(info.usedFallback).toBe(true);
      expect(info.reason).toContain("config_not_found");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("falls back when all sources are disabled", () => {
    const tempDir = createTempDir();
    try {
      const filePath = writeRegistryFile(
        tempDir,
        "all-disabled.json",
        JSON.stringify({
          sources: [{ id: "source_a", name: "Source A", url: "https://example.com/a.xml", enabled: false }],
        })
      );
      const sources = loadSourceRegistryFromFile(filePath);
      const info = getLastSourceRegistryLoadInfo();

      expect(sources).toHaveLength(3);
      expect(info.usedFallback).toBe(true);
      expect(info.reason).toContain("no_enabled_sources");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
