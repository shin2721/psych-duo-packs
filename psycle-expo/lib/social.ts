import { supabase } from './supabase';
import { isGuestUserId } from './authUtils';
import { warnDev } from './devLog';

export interface LeaderboardProfile {
  user_id: string;
  username: string | null;
  total_xp: number | null;
  current_streak: number | null;
}

export interface FriendProfile {
  friend_id: string;
  username: string;
  total_xp: number;
  current_streak: number;
}

export interface FriendRequestProfile {
  id: string;
  from_user_id: string;
  username: string;
  total_xp: number;
}

export interface FriendStatus {
  friendIds: Set<string>;
  pendingRequestIds: Set<string>;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  total_xp: number;
  current_streak: number;
  updated_at: string;
}

export type SendFriendRequestResult = 'sent' | 'already_sent';

function canUseSocialUserId(userId: string | null | undefined): userId is string {
  return typeof userId === 'string' && userId.length > 0 && !isGuestUserId(userId);
}

export async function fetchLeaderboardProfiles(userIds: string[]): Promise<Map<string, LeaderboardProfile>> {
  const map = new Map<string, LeaderboardProfile>();
  if (userIds.length === 0) return map;

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('user_id, username, total_xp, current_streak')
      .in('user_id', userIds);

    if (error) throw error;

    (data ?? []).forEach((row) => {
      if (row.user_id) {
        map.set(row.user_id, row as LeaderboardProfile);
      }
    });
  } catch (error) {
    warnDev('Error fetching leaderboard profiles:', error);
  }

  return map;
}

export async function fetchFriendProfiles(
  userId: string | null | undefined,
  fallbackUsername: string
): Promise<FriendProfile[]> {
  if (!canUseSocialUserId(userId)) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId);

  if (error) throw error;

  const friendIds = (data ?? []).map((item) => item.friend_id).filter(Boolean);
  const leaderboardMap = await fetchLeaderboardProfiles(friendIds);

  return (data ?? []).map((item) => {
    const profile = leaderboardMap.get(item.friend_id);
    return {
      friend_id: item.friend_id,
      username: profile?.username || fallbackUsername,
      total_xp: profile?.total_xp || 0,
      current_streak: profile?.current_streak || 0,
    };
  });
}

export async function fetchFriendRequests(
  userId: string | null | undefined,
  fallbackUsername: string
): Promise<FriendRequestProfile[]> {
  if (!canUseSocialUserId(userId)) return [];

  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, from_user_id')
    .eq('to_user_id', userId)
    .eq('status', 'pending');

  if (error) throw error;

  const fromUserIds = (data ?? []).map((item) => item.from_user_id).filter(Boolean);
  const leaderboardMap = await fetchLeaderboardProfiles(fromUserIds);

  return (data ?? []).map((item) => {
    const profile = leaderboardMap.get(item.from_user_id);
    return {
      id: item.id,
      from_user_id: item.from_user_id,
      username: profile?.username || fallbackUsername,
      total_xp: profile?.total_xp || 0,
    };
  });
}

export async function fetchFriendStatus(userId: string | null | undefined): Promise<FriendStatus> {
  if (!canUseSocialUserId(userId)) {
    return {
      friendIds: new Set(),
      pendingRequestIds: new Set(),
    };
  }

  const [friendsResult, requestsResult] = await Promise.all([
    supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId),
    supabase
      .from('friend_requests')
      .select('to_user_id')
      .eq('from_user_id', userId)
      .eq('status', 'pending'),
  ]);

  if (friendsResult.error) throw friendsResult.error;
  if (requestsResult.error) throw requestsResult.error;

  return {
    friendIds: new Set((friendsResult.data ?? []).map((friend) => friend.friend_id)),
    pendingRequestIds: new Set((requestsResult.data ?? []).map((request) => request.to_user_id)),
  };
}

export async function fetchFriendsLeaderboard(userId: string | null | undefined): Promise<LeaderboardEntry[]> {
  if (!canUseSocialUserId(userId)) return [];

  const { data: friends, error: friendsError } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId);

  if (friendsError) throw friendsError;

  const friendIds = friends?.map((friend) => friend.friend_id) || [];
  if (friendIds.length === 0) return [];

  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .in('user_id', friendIds)
    .order('total_xp', { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export async function searchUsersByName(
  query: string,
  currentUserId: string | null | undefined
): Promise<LeaderboardProfile[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || !canUseSocialUserId(currentUserId)) return [];

  const { data, error } = await supabase
    .from('leaderboard')
    .select('user_id, username, total_xp, current_streak')
    .ilike('username', `%${trimmedQuery}%`)
    .neq('user_id', currentUserId)
    .limit(10);

  if (error) throw error;
  return (data ?? []) as LeaderboardProfile[];
}

export async function sendFriendRequest(
  fromUserId: string | null | undefined,
  toUserId: string
): Promise<SendFriendRequestResult> {
  if (!canUseSocialUserId(fromUserId)) return 'already_sent';

  const { error } = await supabase
    .from('friend_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'pending',
    });

  if (!error) return 'sent';
  if (error.code === '23505') return 'already_sent';
  throw error;
}

export async function acceptFriendRequest(
  currentUserId: string | null | undefined,
  requestId: string,
  fromUserId: string
): Promise<void> {
  if (!canUseSocialUserId(currentUserId)) return;

  const { error: requestError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (requestError) throw requestError;

  const { error: friendshipError } = await supabase.from('friendships').insert([
    { user_id: currentUserId, friend_id: fromUserId },
    { user_id: fromUserId, friend_id: currentUserId },
  ]);

  if (friendshipError) throw friendshipError;
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);

  if (error) throw error;
}

export async function removeFriendship(
  userId: string | null | undefined,
  friendId: string
): Promise<void> {
  if (!canUseSocialUserId(userId)) return;

  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

  if (error) throw error;
}
