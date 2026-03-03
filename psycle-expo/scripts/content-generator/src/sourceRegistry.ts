export type SourceConfig = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
};

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

export function loadSourceRegistry(): SourceConfig[] {
  return DEFAULT_SOURCE_REGISTRY.filter((source) => source.enabled).map((source) => ({ ...source }));
}
