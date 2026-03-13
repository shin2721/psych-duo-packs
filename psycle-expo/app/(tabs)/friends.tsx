import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useEconomyState } from '../../lib/state';
import { useToast } from '../../components/ToastProvider';
import { theme } from '../../lib/theme';
import { FriendSearch } from '../../components/FriendSearch';
import {
  buildWeeklyFriendChallenge,
  claimFriendChallengeReward as claimFriendChallengeRewardOnce,
  evaluateFriendChallengeProgress,
  getFriendChallengeRewardGems,
  hasFriendChallengeClaimed,
  type WeeklyFriendChallenge,
} from '../../lib/friendChallenges';
import { Analytics } from '../../lib/analytics';
import i18n from '../../lib/i18n';

interface Friend {
    friend_id: string;
    username: string;
    total_xp: number;
    current_streak: number;
}

interface FriendRequest {
    id: string;
    from_user_id: string;
    username: string;
    total_xp: number;
}

interface LeaderboardProfile {
    user_id: string;
    username: string | null;
    total_xp: number | null;
    current_streak: number | null;
}

type ViewType = 'friends' | 'requests' | 'search';
const FRIEND_CHALLENGE_REWARD_GEMS = getFriendChallengeRewardGems();

export default function FriendsScreen() {
    const [view, setView] = useState<ViewType>('friends');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [friendChallenge, setFriendChallenge] = useState<WeeklyFriendChallenge | null>(null);
    const [friendChallengeClaimed, setFriendChallengeClaimed] = useState(false);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendsError, setFriendsError] = useState<string | null>(null);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState<string | null>(null);
    const { user } = useAuth();
    const { addGems } = useEconomyState();
    const { showToast } = useToast();
    const bottomTabBarHeight = useBottomTabBarHeight();
    const listBottomInset = bottomTabBarHeight + theme.spacing.lg;
    const viewRef = useRef<ViewType>(view);
    const friendsRequestIdRef = useRef(0);
    const requestsRequestIdRef = useRef(0);
    const challengeRequestIdRef = useRef(0);

    useEffect(() => {
        viewRef.current = view;
    }, [view]);

    useEffect(() => {
        if (view === 'friends') {
            requestsRequestIdRef.current += 1;
            void fetchFriends();
            void fetchFriendChallenge();
        } else if (view === 'requests') {
            friendsRequestIdRef.current += 1;
            challengeRequestIdRef.current += 1;
            void fetchRequests();
        } else {
            friendsRequestIdRef.current += 1;
            requestsRequestIdRef.current += 1;
            challengeRequestIdRef.current += 1;
        }
    }, [view, user?.id]);

    const fetchFriendChallenge = async () => {
        const requestId = ++challengeRequestIdRef.current;

        if (!user) {
            if (requestId !== challengeRequestIdRef.current) return;
            setFriendChallenge(null);
            setFriendChallengeClaimed(false);
            return;
        }

        try {
            const challenge = await buildWeeklyFriendChallenge(user.id);
            if (requestId !== challengeRequestIdRef.current) return;
            setFriendChallenge(challenge);
            if (!challenge) {
                setFriendChallengeClaimed(false);
                return;
            }

            const claimed = await hasFriendChallengeClaimed(user.id, challenge.weekId);
            if (requestId !== challengeRequestIdRef.current) return;
            setFriendChallengeClaimed(claimed);

            Analytics.track('friend_challenge_shown', {
                weekId: challenge.weekId,
                source: 'friends_tab',
            });
        } catch (error) {
            if (requestId !== challengeRequestIdRef.current) return;
            console.error('Error fetching friend challenge:', error);
            setFriendChallenge(null);
            setFriendChallengeClaimed(false);
        }
    };

    const fetchFriends = async () => {
        const requestId = ++friendsRequestIdRef.current;

        if (!user) {
            if (requestId !== friendsRequestIdRef.current) return;
            setFriends([]);
            setFriendsError(null);
            setFriendsLoading(false);
            return;
        }

        setFriendsLoading(true);
        setFriendsError(null);
        try {
            const { data, error } = await supabase
                .from('friendships')
                .select('friend_id')
                .eq('user_id', user.id);

            if (error) throw error;
            const friendIds = (data ?? []).map((item) => item.friend_id).filter(Boolean);
            const leaderboardMap = await fetchLeaderboardMap(friendIds);

            const formattedFriends = (data ?? []).map(item => {
                const profile = leaderboardMap.get(item.friend_id);
                return {
                friend_id: item.friend_id,
                username: profile?.username || String(i18n.t('friends.fallbackUnknownUser')),
                total_xp: profile?.total_xp || 0,
                current_streak: profile?.current_streak || 0,
                };
            });

            if (requestId !== friendsRequestIdRef.current) return;
            setFriends(formattedFriends);
        } catch (error) {
            if (requestId !== friendsRequestIdRef.current) return;
            console.error('Error fetching friends:', error);
            setFriendsError(String(i18n.t('common.unexpectedError')));
        } finally {
            if (requestId === friendsRequestIdRef.current) {
                setFriendsLoading(false);
            }
        }
    };

    const fetchRequests = async () => {
        const requestId = ++requestsRequestIdRef.current;

        if (!user) {
            if (requestId !== requestsRequestIdRef.current) return;
            setRequests([]);
            setRequestsError(null);
            setRequestsLoading(false);
            return;
        }

        setRequestsLoading(true);
        setRequestsError(null);
        try {
            const { data, error } = await supabase
                .from('friend_requests')
                .select('id, from_user_id')
                .eq('to_user_id', user.id)
                .eq('status', 'pending');

            if (error) throw error;
            const fromUserIds = (data ?? []).map((item) => item.from_user_id).filter(Boolean);
            const leaderboardMap = await fetchLeaderboardMap(fromUserIds);

            const formattedRequests = (data ?? []).map(item => {
                const profile = leaderboardMap.get(item.from_user_id);
                return {
                id: item.id,
                from_user_id: item.from_user_id,
                username: profile?.username || String(i18n.t('friends.fallbackUnknownUser')),
                total_xp: profile?.total_xp || 0,
                };
            });

            if (requestId !== requestsRequestIdRef.current) return;
            setRequests(formattedRequests);
        } catch (error) {
            if (requestId !== requestsRequestIdRef.current) return;
            console.error('Error fetching requests:', error);
            setRequestsError(String(i18n.t('common.unexpectedError')));
        } finally {
            if (requestId === requestsRequestIdRef.current) {
                setRequestsLoading(false);
            }
        }
    };

    const fetchLeaderboardMap = async (userIds: string[]): Promise<Map<string, LeaderboardProfile>> => {
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
            console.error('Error fetching leaderboard profiles:', error);
        }

        return map;
    };

    const acceptRequest = async (requestId: string, fromUserId: string) => {
        if (!user) return;

        try {
            // Update request status
            await supabase
                .from('friend_requests')
                .update({ status: 'accepted' })
                .eq('id', requestId);

            // Create bidirectional friendship
            await supabase.from('friendships').insert([
                { user_id: user.id, friend_id: fromUserId },
                { user_id: fromUserId, friend_id: user.id },
            ]);

            showToast(String(i18n.t('friends.alerts.requestAcceptedMessage')), 'success');
            if (viewRef.current === 'requests') {
                void fetchRequests();
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            showToast(String(i18n.t('friends.alerts.acceptFailed')), 'error');
        }
    };

    const rejectRequest = async (requestId: string) => {
        try {
            await supabase
                .from('friend_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

            if (viewRef.current === 'requests') {
                void fetchRequests();
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            showToast(String(i18n.t('friends.alerts.rejectFailed')), 'error');
        }
    };

    const removeFriend = async (friendId: string) => {
        if (!user) return;

        Alert.alert(
            String(i18n.t('friends.alerts.removeTitle')),
            String(i18n.t('friends.alerts.removeMessage')),
            [
                { text: String(i18n.t('common.cancel')), style: 'cancel' },
                {
                    text: String(i18n.t('friends.alerts.removeConfirm')),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase
                                .from('friendships')
                                .delete()
                                .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

                            if (viewRef.current === 'friends') {
                                void fetchFriends();
                            }
                        } catch (error) {
                            console.error('Error removing friend:', error);
                            showToast(String(i18n.t('friends.alerts.removeFailed')), 'error');
                        }
                    },
                },
            ]
        );
    };

    const handleClaimFriendChallengeReward = async () => {
        if (!user || !friendChallenge || friendChallengeClaimed) return;

        const progress = evaluateFriendChallengeProgress({
            myWeeklyXp: friendChallenge.myWeeklyXp,
            opponentWeeklyXp: friendChallenge.opponentWeeklyXp,
        });

        if (!progress.completed) {
            showToast(String(i18n.t('friends.challenge.notCompleted')), 'error');
            return;
        }

        try {
            const claimResult = await claimFriendChallengeRewardOnce({
                userId: user.id,
                weekId: friendChallenge.weekId,
                opponentId: friendChallenge.opponentId,
                rewardGems: FRIEND_CHALLENGE_REWARD_GEMS,
            });

            if (claimResult === 'claimed') {
                addGems(FRIEND_CHALLENGE_REWARD_GEMS);
                setFriendChallengeClaimed(true);
                Analytics.track('friend_challenge_completed', {
                    weekId: friendChallenge.weekId,
                    opponentId: friendChallenge.opponentId,
                    rewardGems: FRIEND_CHALLENGE_REWARD_GEMS,
                    source: 'friends_tab',
                });
                showToast(
                    String(i18n.t('friends.challenge.rewardClaimed', { gems: FRIEND_CHALLENGE_REWARD_GEMS })),
                    'success'
                );
                return;
            }

            if (claimResult === 'already_claimed') {
                setFriendChallengeClaimed(true);
                showToast(String(i18n.t('friends.challenge.claimed')), 'success');
                return;
            }

            throw new Error('friend challenge claim failed');
        } catch (error) {
            console.error('Error claiming friend challenge reward:', error);
            showToast(String(i18n.t('friends.challenge.rewardFailed')), 'error');
        }
    };

    const friendChallengeProgress = friendChallenge
        ? evaluateFriendChallengeProgress({
            myWeeklyXp: friendChallenge.myWeeklyXp,
            opponentWeeklyXp: friendChallenge.opponentWeeklyXp,
        })
        : null;

    const renderFriend = ({ item }: { item: Friend }) => (
        <View style={styles.card} testID={`friend-row-${item.friend_id}`}>
            <View style={styles.userInfo}>
                <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
                    {item.username}
                </Text>
                <View style={styles.stats}>
                    <Text style={styles.statText}>
                        {String(i18n.t('friends.stats.xpValue', { xp: item.total_xp }))}
                    </Text>
                    <Text style={styles.statText}>
                        {String(i18n.t('friends.stats.streakValue', { count: item.current_streak }))}
                    </Text>
                </View>
            </View>
            <Pressable
                style={styles.removeButton}
                onPress={() => removeFriend(item.friend_id)}
                testID={`friend-remove-${item.friend_id}`}
                accessibilityRole="button"
                accessibilityLabel={`${String(i18n.t('friends.alerts.removeTitle'))}: ${item.username}`}
            >
                <Ionicons name="person-remove" size={20} color={theme.colors.error} />
            </Pressable>
        </View>
    );

    const renderRequest = ({ item }: { item: FriendRequest }) => (
        <View style={styles.card} testID={`request-row-${item.id}`}>
            <View style={styles.userInfo}>
                <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
                    {item.username}
                </Text>
                <Text style={styles.statText}>
                    {String(i18n.t('friends.stats.xpValue', { xp: item.total_xp }))}
                </Text>
            </View>
            <View style={styles.requestActions}>
                <Pressable
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => acceptRequest(item.id, item.from_user_id)}
                    testID={`request-accept-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${String(i18n.t('friends.alerts.requestAcceptedMessage'))}: ${item.username}`}
                >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                </Pressable>
                <Pressable
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => rejectRequest(item.id)}
                    testID={`request-reject-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${String(i18n.t('friends.tabs.requests'))}: ${item.username}`}
                >
                    <Ionicons name="close" size={20} color="#fff" />
                </Pressable>
            </View>
        </View>
    );

    const renderLoadError = (message: string | null, retry: () => void, testID: string) => (
        <View style={styles.emptyContainer} testID="friends-load-error">
            <Text style={styles.errorTitle}>{String(i18n.t('common.error'))}</Text>
            <Text style={styles.emptyText}>{message}</Text>
            <Pressable style={styles.retryButton} onPress={retry} testID={testID}>
                <Text style={styles.retryButtonText}>{String(i18n.t('common.retry'))}</Text>
            </Pressable>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} testID="friends-screen">
            <View style={styles.header}>
                <Text style={styles.title}>{String(i18n.t('friends.title'))}</Text>
            </View>

            <View style={styles.segmentedControl}>
                <Pressable
                    style={[styles.segment, view === 'friends' && styles.activeSegment]}
                    onPress={() => setView('friends')}
                    testID="friends-tab-friends"
                    accessibilityRole="button"
                    accessibilityLabel={String(i18n.t('friends.tabs.friends'))}
                    accessibilityState={{ selected: view === 'friends' }}
                >
                    <Text style={[styles.segmentText, view === 'friends' && styles.activeSegmentText]}>
                        {String(i18n.t('friends.tabs.friends'))}
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.segment, view === 'requests' && styles.activeSegment]}
                    onPress={() => setView('requests')}
                    testID="friends-tab-requests"
                    accessibilityRole="button"
                    accessibilityLabel={
                        requests.length > 0
                            ? String(i18n.t('friends.tabs.requestsWithCount', { count: requests.length }))
                            : String(i18n.t('friends.tabs.requests'))
                    }
                    accessibilityState={{ selected: view === 'requests' }}
                >
                    <Text style={[styles.segmentText, view === 'requests' && styles.activeSegmentText]}>
                        {requests.length > 0
                            ? String(i18n.t('friends.tabs.requestsWithCount', { count: requests.length }))
                            : String(i18n.t('friends.tabs.requests'))}
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.segment, view === 'search' && styles.activeSegment]}
                    onPress={() => setView('search')}
                    testID="friends-tab-search"
                    accessibilityRole="button"
                    accessibilityLabel={String(i18n.t('friends.tabs.search'))}
                    accessibilityState={{ selected: view === 'search' }}
                >
                    <Text style={[styles.segmentText, view === 'search' && styles.activeSegmentText]}>
                        {String(i18n.t('friends.tabs.search'))}
                    </Text>
                </Pressable>
            </View>

            <View style={styles.content}>
                {view === 'friends' && (
                    <>
                        {friendsLoading ? (
                            <View style={styles.emptyContainer} testID="friends-loading">
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        ) : friendsError ? (
                            renderLoadError(friendsError, fetchFriends, 'friends-retry')
                        ) : (
                            <>
                        {friendChallenge && friendChallengeProgress && (
                            <View style={styles.challengeCard} testID="friends-challenge-card">
                                <View style={styles.challengeHeaderRow}>
                                    <Ionicons name="trophy" size={18} color={theme.colors.warn} />
                                    <Text style={styles.challengeTitle}>
                                        {String(i18n.t('friends.challenge.title'))}
                                    </Text>
                                </View>
                                <Text style={styles.challengeSubtitle}>
                                    {String(i18n.t('friends.challenge.subtitle', { name: friendChallenge.opponentName }))}
                                </Text>
                                <Text style={styles.challengeProgress}>
                                    {String(
                                        i18n.t('friends.challenge.progress', {
                                            mine: friendChallengeProgress.myWeeklyXp,
                                            theirs: friendChallengeProgress.opponentWeeklyXp,
                                        })
                                    )}
                                </Text>
                                <Text
                                    style={[
                                        styles.challengeStatus,
                                        friendChallengeProgress.completed
                                            ? styles.challengeStatusReady
                                            : styles.challengeStatusPending,
                                    ]}
                                >
                                    {friendChallengeProgress.completed
                                        ? String(i18n.t('friends.challenge.readyToClaim'))
                                        : String(i18n.t('friends.challenge.keepGoing'))}
                                </Text>
                                <Pressable
                                    style={[
                                        styles.challengeButton,
                                        (friendChallengeClaimed || !friendChallengeProgress.completed) &&
                                            styles.challengeButtonDisabled,
                                    ]}
                                    disabled={friendChallengeClaimed || !friendChallengeProgress.completed}
                                    onPress={handleClaimFriendChallengeReward}
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                        friendChallengeClaimed
                                            ? String(i18n.t('friends.challenge.claimed'))
                                            : String(
                                                  i18n.t('friends.challenge.claim', {
                                                      gems: FRIEND_CHALLENGE_REWARD_GEMS,
                                                  })
                                              )
                                    }
                                    accessibilityState={{
                                        disabled: friendChallengeClaimed || !friendChallengeProgress.completed,
                                    }}
                                >
                                    <Text style={styles.challengeButtonText}>
                                        {friendChallengeClaimed
                                            ? String(i18n.t('friends.challenge.claimed'))
                                            : String(
                                                  i18n.t('friends.challenge.claim', {
                                                      gems: FRIEND_CHALLENGE_REWARD_GEMS,
                                                  })
                                              )}
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                        {friends.length === 0 ? (
                            <View style={styles.emptyContainer} testID="friends-empty">
                                <Ionicons name="people" size={64} color={theme.colors.sub} />
                                <Text style={styles.emptyText}>{String(i18n.t('friends.empty.friendsTitle'))}</Text>
                                <Text style={styles.emptySubtext}>{String(i18n.t('friends.empty.friendsSubtitle'))}</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={friends}
                                renderItem={renderFriend}
                                keyExtractor={(item) => item.friend_id}
                                testID="friends-list"
                                contentContainerStyle={[styles.list, { paddingBottom: listBottomInset }]}
                            />
                        )}
                            </>
                        )}
                    </>
                )}

                {view === 'requests' && (
                    requestsLoading ? (
                        <View style={styles.emptyContainer} testID="requests-loading">
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                    ) : requestsError ? (
                        renderLoadError(requestsError, fetchRequests, 'requests-retry')
                    ) : requests.length === 0 ? (
                        <View style={styles.emptyContainer} testID="requests-empty">
                            <Ionicons name="mail" size={64} color={theme.colors.sub} />
                            <Text style={styles.emptyText}>{String(i18n.t('friends.empty.requestsTitle'))}</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={requests}
                            renderItem={renderRequest}
                            keyExtractor={(item) => item.id}
                            testID="requests-list"
                            contentContainerStyle={[styles.list, { paddingBottom: listBottomInset }]}
                        />
                    )
                )}

                {view === 'search' && (
                    <FriendSearch onRequestSent={() => setView('requests')} />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    header: {
        padding: 20,
        paddingTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    segment: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeSegment: {
        backgroundColor: theme.colors.primary,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.sub,
    },
    activeSegmentText: {
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    list: {
        paddingBottom: 20,
    },
    challengeCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.line,
        padding: 14,
        marginBottom: 12,
    },
    challengeHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    challengeSubtitle: {
        fontSize: 13,
        color: theme.colors.sub,
        marginBottom: 4,
    },
    challengeProgress: {
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 6,
    },
    challengeStatus: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
    },
    challengeStatusReady: {
        color: theme.colors.success,
    },
    challengeStatusPending: {
        color: theme.colors.sub,
    },
    challengeButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    challengeButtonDisabled: {
        opacity: 0.45,
    },
    challengeButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.line,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
        flexShrink: 1,
    },
    stats: {
        flexDirection: 'row',
        gap: 16,
    },
    statText: {
        fontSize: 14,
        color: theme.colors.sub,
    },
    removeButton: {
        padding: 8,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: theme.colors.success,
    },
    rejectButton: {
        backgroundColor: theme.colors.error,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.sub,
        marginTop: 8,
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    retryButton: {
        marginTop: 14,
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
