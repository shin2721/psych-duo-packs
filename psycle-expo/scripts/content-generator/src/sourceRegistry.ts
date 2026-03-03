import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";

export type SourceConfig = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
};

export type SourceRegistryLoadInfo = {
  usedFallback: boolean;
  source: "file" | "default";
  reason?: string;
};

const SOURCE_REGISTRY_PATH = join(__dirname, "..", "config", "source-registry.json");

const DEFAULT_SOURCE_REGISTRY: readonly SourceConfig[] = [
  {
    id: "sciencedaily_psychology",
    name: "ScienceDaily (Psychology)",
    url: "https://www.sciencedaily.com/rss/mind_brain/psychology.xml",
    enabled: true,
  },
  {
    id: "sciencedaily_mind_brain",
    name: "ScienceDaily (Mind & Brain)",
    url: "https://www.sciencedaily.com/rss/mind_brain.xml",
    enabled: true,
  },
  {
    id: "psypost_feed",
    name: "PsyPost",
    url: "https://www.psypost.org/feed/",
    enabled: true,
  },
];

const SourceSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  url: z
    .string()
    .min(1)
    .url()
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "url must use http/https"),
  enabled: z.boolean(),
});

const SourceRegistryFileSchema = z.object({
  sources: z.array(SourceSchema).min(1),
});

let lastLoadInfo: SourceRegistryLoadInfo = {
  usedFallback: false,
  source: "default",
};

function cloneSources(sources: readonly SourceConfig[]): SourceConfig[] {
  return sources.map((source) => ({ ...source }));
}

function withEnabledSourcesOnly(sources: SourceConfig[]): SourceConfig[] {
  return sources.filter((source) => source.enabled);
}

function fallback(reason: string): SourceConfig[] {
  lastLoadInfo = {
    usedFallback: true,
    source: "default",
    reason,
  };
  return withEnabledSourcesOnly(cloneSources(DEFAULT_SOURCE_REGISTRY));
}

export function getDefaultSourceRegistry(): SourceConfig[] {
  return cloneSources(DEFAULT_SOURCE_REGISTRY);
}

export function getLastSourceRegistryLoadInfo(): SourceRegistryLoadInfo {
  return { ...lastLoadInfo };
}

export function validateSourceRegistryInput(
  raw: unknown
): { success: true; data: SourceConfig[] } | { success: false; reasons: string[] } {
  const parsed = SourceRegistryFileSchema.safeParse(raw);
  if (!parsed.success) {
    const reasons = parsed.error.issues.map((issue) => issue.message);
    return { success: false, reasons };
  }

  const sources = parsed.data.sources;
  const ids = sources.map((source) => source.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    return {
      success: false,
      reasons: [`duplicate_source_id:${Array.from(new Set(duplicateIds)).join(",")}`],
    };
  }

  const enabledSources = sources.filter((source) => source.enabled);
  if (enabledSources.length === 0) {
    return { success: false, reasons: ["no_enabled_sources"] };
  }

  return { success: true, data: sources };
}

export function loadSourceRegistryFromFile(filePath: string): SourceConfig[] {
  if (!existsSync(filePath)) {
    return fallback(`config_not_found:${filePath}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return fallback(`config_parse_error:${filePath}`);
  }

  const validated = validateSourceRegistryInput(raw);
  if (!validated.success) {
    return fallback(`config_validation_error:${validated.reasons.join("|")}`);
  }

  lastLoadInfo = {
    usedFallback: false,
    source: "file",
  };
  return withEnabledSourcesOnly(cloneSources(validated.data));
}

export function loadSourceRegistry(): SourceConfig[] {
  return loadSourceRegistryFromFile(SOURCE_REGISTRY_PATH);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const validateMode = args.includes("--validate");
  if (validateMode) {
    if (!existsSync(SOURCE_REGISTRY_PATH)) {
      console.error(`NG source registry: config_not_found:${SOURCE_REGISTRY_PATH}`);
      process.exit(1);
    }
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(SOURCE_REGISTRY_PATH, "utf-8"));
    } catch {
      console.error(`NG source registry: config_parse_error:${SOURCE_REGISTRY_PATH}`);
      process.exit(1);
    }
    const validated = validateSourceRegistryInput(raw);
    if (!validated.success) {
      console.error(`NG source registry: ${validated.reasons.join(", ")}`);
      process.exit(1);
    }
    const enabledCount = validated.data.filter((source) => source.enabled).length;
    console.log(`OK source registry: total=${validated.data.length}, enabled=${enabledCount}`);
    process.exit(0);
  }
}
