import type { LeagueInfo } from "./league";

type LeagueSummary = Pick<LeagueInfo, "tier_icon" | "tier_name">;

export function formatProfileLeagueLabel(
  league: LeagueSummary | null,
  unjoinedLabel: string
): string {
  if (!league) return unjoinedLabel;

  const icon = String(league.tier_icon || "").trim();
  const name = String(league.tier_name || "").trim();
  const label = [icon, name].filter(Boolean).join(" ").trim();
  return label || unjoinedLabel;
}
