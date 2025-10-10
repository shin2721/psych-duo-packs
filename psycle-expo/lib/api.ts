// lib/api.ts
import Constants from "expo-constants";

const BASE_URL =
  (Constants?.expoConfig as any)?.extra?.BASE_URL ??
  (Constants as any)?.manifest2?.extra?.expoClient?.extra?.BASE_URL;

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
  const q = new URLSearchParams({ track, pack, autostart: "1", ...(params as any) });
  return `${BASE_URL}/public/runner.html?${q.toString()}`;
}
