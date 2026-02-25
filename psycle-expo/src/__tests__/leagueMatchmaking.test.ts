jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

jest.mock('../../lib/analytics', () => ({
  __esModule: true,
  default: {
    track: jest.fn(),
  },
}));

import {
  resolveNextTierFromLastWeek,
  selectBestLeagueCandidateByXpProxy,
  type LeagueCandidateScore,
} from '../../lib/league';
import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as unknown as {
  rpc: jest.Mock;
  from: jest.Mock;
};

function createMembershipQuery(result: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
  return builder;
}

describe('league matchmaking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveNextTierFromLastWeek', () => {
    test('promoted=true の場合は tier+1', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: '2026-W10', error: null });
      mockSupabase.from.mockReturnValue(
        createMembershipQuery({
          data: { promoted: true, demoted: false, leagues: { tier: 2 } },
          error: null,
        })
      );

      await expect(resolveNextTierFromLastWeek('user-1')).resolves.toBe(3);
    });

    test('demoted=true の場合は tier-1（下限0）', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: '2026-W10', error: null });
      mockSupabase.from.mockReturnValue(
        createMembershipQuery({
          data: { promoted: false, demoted: true, leagues: { tier: 0 } },
          error: null,
        })
      );

      await expect(resolveNextTierFromLastWeek('user-1')).resolves.toBe(0);
    });

    test('neutral の場合は同tier', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: '2026-W10', error: null });
      mockSupabase.from.mockReturnValue(
        createMembershipQuery({
          data: { promoted: false, demoted: false, leagues: { tier: 4 } },
          error: null,
        })
      );

      await expect(resolveNextTierFromLastWeek('user-1')).resolves.toBe(4);
    });

    test('前週履歴がなければ Bronze(0)', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: '2026-W10', error: null });
      mockSupabase.from.mockReturnValue(
        createMembershipQuery({
          data: null,
          error: null,
        })
      );

      await expect(resolveNextTierFromLastWeek('user-1')).resolves.toBe(0);
    });

    test('promoted でも上限5を超えない', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: '2026-W10', error: null });
      mockSupabase.from.mockReturnValue(
        createMembershipQuery({
          data: { promoted: true, demoted: false, leagues: { tier: 5 } },
          error: null,
        })
      );

      await expect(resolveNextTierFromLastWeek('user-1')).resolves.toBe(5);
    });
  });

  describe('selectBestLeagueCandidateByXpProxy', () => {
    const candidates: LeagueCandidateScore[] = [
      { leagueId: 'l1', memberCount: 12, avgTotalXp: 120, createdAt: '2026-03-10T00:00:00.000Z' },
      { leagueId: 'l2', memberCount: 25, avgTotalXp: 220, createdAt: '2026-03-09T00:00:00.000Z' },
      { leagueId: 'l3', memberCount: 20, avgTotalXp: 180, createdAt: '2026-03-08T00:00:00.000Z' },
    ];

    test('xp差が最小のリーグを選ぶ', () => {
      const picked = selectBestLeagueCandidateByXpProxy(candidates, 170);
      expect(picked?.leagueId).toBe('l3');
    });

    test('xp差が同じなら memberCount が多い方を優先', () => {
      const picked = selectBestLeagueCandidateByXpProxy(
        [
          { leagueId: 'a', memberCount: 10, avgTotalXp: 100, createdAt: '2026-03-10T00:00:00.000Z' },
          { leagueId: 'b', memberCount: 20, avgTotalXp: 200, createdAt: '2026-03-10T00:00:00.000Z' },
        ],
        150
      );
      expect(picked?.leagueId).toBe('b');
    });

    test('xp差とmemberCountが同じなら createdAt が古い方を優先', () => {
      const picked = selectBestLeagueCandidateByXpProxy(
        [
          { leagueId: 'newer', memberCount: 20, avgTotalXp: 150, createdAt: '2026-03-11T00:00:00.000Z' },
          { leagueId: 'older', memberCount: 20, avgTotalXp: 150, createdAt: '2026-03-10T00:00:00.000Z' },
        ],
        150
      );
      expect(picked?.leagueId).toBe('older');
    });

    test('候補が空なら null', () => {
      expect(selectBestLeagueCandidateByXpProxy([], 100)).toBeNull();
    });
  });
});
