// lib/api.ts
import Constants from "expo-constants";

interface ExpoConfigExtra {
  BASE_URL?: string;
}

interface ConstantsWithManifest2 {
  manifest2?: {
    extra?: {
      expoClient?: {
        extra?: ExpoConfigExtra;
      };
    };
  };
}

function readBaseUrl(): string | undefined {
  const expoConfigBaseUrl = Constants.expoConfig?.extra?.BASE_URL;
  if (typeof expoConfigBaseUrl === "string" && expoConfigBaseUrl.length > 0) {
    return expoConfigBaseUrl;
  }

  const manifest2BaseUrl =
    (Constants as ConstantsWithManifest2).manifest2?.extra?.expoClient?.extra?.BASE_URL;
  if (typeof manifest2BaseUrl === "string" && manifest2BaseUrl.length > 0) {
    return manifest2BaseUrl;
  }

  return undefined;
}

const BASE_URL =
  readBaseUrl();

export type CatalogItem = { id: string; title?: string };
export type Manifest = { packs: string[] };

export async function fetchCatalog(): Promise<CatalogItem[]> {
  const r = await fetch(`${BASE_URL}/catalog.json`, { cache: "no-store" });
  const j = await r.json();
  if (Array.isArray(j?.tracks)) return j.tracks;
  if (Array.isArray(j)) return j;
  if (j && typeof j === "object" && Array.isArray(j.tracks)) return j.tracks;
  return [];
}

export async function fetchManifest(trackId: string): Promise<Manifest> {
  const r = await fetch(`${BASE_URL}/${trackId}/manifest.json`, { cache: "no-store" });
  return r.json();
}

export function buildRunnerUrl(track: string, pack: string, params?: Record<string, string | number>) {
  const q = new URLSearchParams({ track, pack, autostart: "1" });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      q.set(key, String(value));
    });
  }
  return `${BASE_URL}/public/runner.html?${q.toString()}`;
}
