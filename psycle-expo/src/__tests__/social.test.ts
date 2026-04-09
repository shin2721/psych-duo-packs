jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import {
  fetchFriendProfiles,
  fetchFriendRequests,
  fetchFriendStatus,
  fetchFriendsLeaderboard,
  removeFriendship,
  searchUsersByName,
  sendFriendRequest,
} from '../../lib/social';
import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as unknown as {
  from: jest.Mock;
};

function createQueryBuilder(result: { data?: any; error?: any } = {}) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: result.data ?? [], error: result.error ?? null }),
    order: jest.fn().mockResolvedValue({ data: result.data ?? [], error: result.error ?? null }),
    insert: jest.fn().mockResolvedValue({ error: result.error ?? null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    or: jest.fn().mockResolvedValue({ error: result.error ?? null }),
    then: undefined,
  };

  builder.eq.mockImplementation(() => builder);
  builder.select.mockImplementation(() => builder);
  builder.in.mockImplementation(() => Promise.resolve({ data: result.data ?? [], error: result.error ?? null }));
  builder.ilike.mockImplementation(() => builder);
  builder.neq.mockImplementation(() => builder);
  builder.update.mockImplementation(() => builder);
  builder.delete.mockImplementation(() => builder);

  return builder;
}

describe('social guest guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('guest user returns empty social data without querying Supabase', async () => {
    await expect(fetchFriendProfiles('guest_user_1', 'Unknown')).resolves.toEqual([]);
    await expect(fetchFriendRequests('guest_user_1', 'Unknown')).resolves.toEqual([]);
    await expect(fetchFriendStatus('guest_user_1')).resolves.toEqual({
      friendIds: new Set(),
      pendingRequestIds: new Set(),
    });
    await expect(fetchFriendsLeaderboard('guest_user_1')).resolves.toEqual([]);
    await expect(searchUsersByName('alex', 'guest_user_1')).resolves.toEqual([]);

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});

describe('social authenticated flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendFriendRequest preserves success and duplicate semantics', async () => {
    const sentBuilder = createQueryBuilder();
    const duplicateBuilder = createQueryBuilder({ error: { code: '23505' } });

    mockSupabase.from
      .mockReturnValueOnce(sentBuilder)
      .mockReturnValueOnce(duplicateBuilder);

    await expect(sendFriendRequest('user-1', 'user-2')).resolves.toBe('sent');
    await expect(sendFriendRequest('user-1', 'user-2')).resolves.toBe('already_sent');
  });

  test('removeFriendship keeps delete path for authenticated users', async () => {
    const deleteBuilder = createQueryBuilder();
    mockSupabase.from.mockReturnValue(deleteBuilder);

    await expect(removeFriendship('user-1', 'friend-1')).resolves.toBeUndefined();

    expect(mockSupabase.from).toHaveBeenCalledWith('friendships');
    expect(deleteBuilder.delete).toHaveBeenCalled();
    expect(deleteBuilder.or).toHaveBeenCalledWith(
      'and(user_id.eq.user-1,friend_id.eq.friend-1),and(user_id.eq.friend-1,friend_id.eq.user-1)'
    );
  });
});
