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
    const config = {
      relative_gap_weight: 1.0,
      variance_penalty_weight: 0.35,
      min_members_for_variance: 3,
    };

    const makeCandidate = (overrides: Partial<LeagueCandidateScore>): LeagueCandidateScore => ({
      leagueId: overrides.leagueId ?? 'candidate',
      memberCount: overrides.memberCount ?? 10,
      avgTotalXp: overrides.avgTotalXp ?? 0,
      stddevTotalXp: overrides.stddevTotalXp ?? 0,
      relativeGap: Number.NaN,
      relativeStddev: Number.NaN,
      matchScore: Number.NaN,
      createdAt: overrides.createdAt ?? '2026-03-10T00:00:00.000Z',
    });

    test('相対差が小さいリーグを優先する（絶対差ではなく相対差）', () => {
      const picked = selectBestLeagueCandidateByXpProxy(
        [
          makeCandidate({ leagueId: 'a', avgTotalXp: 100, stddevTotalXp: 5 }),
          makeCandidate({ leagueId: 'b', avgTotalXp: 280, stddevTotalXp: 5 }),
        ],
        200,
        config
      );

      // abs差は a(100)の方が小さいが、相対差は b(0.286)の方が小さい
      expect(picked?.leagueId).toBe('b');
    });

    test('相対差が同等なら stddev が小さいリーグを優先', () => {
      const picked = selectBestLeagueCandidateByXpProxy(
        [
          makeCandidate({ leagueId: 'high-variance', avgTotalXp: 80, stddevTotalXp: 50 }),
          makeCandidate({ leagueId: 'low-variance', avgTotalXp: 125, stddevTotalXp: 10 }),
        ],
        100,
        config
      );
      expect(picked?.leagueId).toBe('low-variance');
    });

    test('memberCount が閾値未満なら分散ペナルティを無効化', () => {
      const picked = selectBestLeagueCandidateByXpProxy(
        [
          makeCandidate({ leagueId: 'small-no-penalty', avgTotalXp: 100, stddevTotalXp: 999, memberCount: 2 }),
          makeCandidate({ leagueId: 'large-penalty', avgTotalXp: 100, stddevTotalXp: 10, memberCount: 10 }),
        ],
        100,
        config
      );
      expect(picked?.leagueId).toBe('small-no-penalty');
    });

    test('matchScore が同じなら memberCount が多い方を優先', () => {
      const picked = selectBestLeagueCandidateByXpProxy(
        [
          makeCandidate({ leagueId: 'small', avgTotalXp: 150, stddevTotalXp: 0, memberCount: 10 }),
          makeCandidate({ leagueId: 'large', avgTotalXp: 150, stddevTotalXp: 0, memberCount: 20 }),
        ],
        150,
        config
      );
      expect(picked?.leagueId).toBe('large');
    });

    test('matchScore と memberCount が同じなら createdAt が古い方を優先', () => {
      const picked = selectBestLeagueCandidateByXpProxy(
        [
          makeCandidate({
            leagueId: 'newer',
            avgTotalXp: 150,
            stddevTotalXp: 0,
            memberCount: 20,
            createdAt: '2026-03-11T00:00:00.000Z',
          }),
          makeCandidate({
            leagueId: 'older',
            avgTotalXp: 150,
            stddevTotalXp: 0,
            memberCount: 20,
            createdAt: '2026-03-10T00:00:00.000Z',
          }),
        ],
        150,
        config
      );
      expect(picked?.leagueId).toBe('older');
    });

    test('候補が空なら null', () => {
      expect(selectBestLeagueCandidateByXpProxy([], 100, config)).toBeNull();
    });
  });
});
