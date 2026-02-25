jest.mock('../../lib/analytics', () => ({
  __esModule: true,
  default: {
    track: jest.fn(),
  },
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

import { addWeeklyXp, ensureJoinedLeagueForCurrentWeek } from '../../lib/league';
import Analytics from '../../lib/analytics';
import { supabase } from '../../lib/supabase';

const mockTrack = (Analytics as unknown as { track: jest.Mock }).track;
const mockSupabase = supabase as unknown as {
  rpc: jest.Mock;
  from: jest.Mock;
};

type SupabaseResult<T> = { data: T; error: any };

function createMembershipBuilder(result: SupabaseResult<any>) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockResolvedValue({ error: null }),
    in: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
  return builder;
}

function setupNoMembershipThenJoinFlow() {
  let leagueMemberQueryCount = 0;
  let leagueInsertCount = 0;

  mockSupabase.rpc.mockImplementation((fn: string) => {
    if (fn === 'get_current_week_id') {
      return Promise.resolve({ data: '2026-W12', error: null });
    }
    if (fn === 'get_last_week_id') {
      return Promise.resolve({ data: '2026-W11', error: null });
    }
    if (fn === 'add_weekly_xp') {
      return Promise.resolve({ error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'league_members') {
      leagueMemberQueryCount += 1;

      // 1: ensure current-week membership -> none
      // 2: resolve last-week tier -> none
      // 3: join flow current-week membership recheck -> none
      if (leagueMemberQueryCount <= 3) {
        return createMembershipBuilder({ data: null, error: null });
      }

      // 4: insert membership for joined league
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    }

    if (table === 'leagues') {
      leagueInsertCount += 1;

      // 1: candidate listing (none found)
      if (leagueInsertCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          insert: jest.fn(),
          single: jest.fn(),
        };
      }

      // 2: create new league
      const builder: any = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'league-new' }, error: null }),
      };
      return builder;
    }

    if (table === 'leaderboard') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { total_xp: 120 }, error: null }),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    }

    throw new Error(`Unexpected table mock: ${table}`);
  });
}

describe('league auto join on xp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('未参加ユーザーでも ensureJoinedLeagueForCurrentWeek が参加を完了する', async () => {
    setupNoMembershipThenJoinFlow();

    const result = await ensureJoinedLeagueForCurrentWeek('user-a');

    expect(result).toEqual({
      leagueId: 'league-new',
      tier: 0,
      joinedNow: true,
    });
  });

  test('未参加ユーザーでも addWeeklyXp で最終的に週次XP加算RPCが呼ばれる', async () => {
    setupNoMembershipThenJoinFlow();

    await addWeeklyXp('user-b', 25);

    expect(mockSupabase.rpc).toHaveBeenCalledWith('add_weekly_xp', {
      p_user_id: 'user-b',
      p_xp: 25,
    });

    expect(mockTrack).toHaveBeenCalledWith('league_auto_joined_on_xp', {
      tier: 0,
      joinedNow: true,
      source: 'xp_gain',
    });
  });
});
