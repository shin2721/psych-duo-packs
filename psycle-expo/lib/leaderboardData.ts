import { supabase } from './supabase';
import type { LeaderboardEntry } from './social';

export async function fetchGlobalLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

