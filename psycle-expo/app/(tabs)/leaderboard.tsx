import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { theme } from '../../lib/theme';
import { TrophyIcon, StreakIcon } from '../../components/CustomIcons';
import { ensureJoinedLeagueForCurrentWeek, getMyLeague, LeagueInfo } from '../../lib/league';
import i18n from '../../lib/i18n';
import { useToast } from '../../components/ToastProvider';

interface LeaderboardEntry {
    id: string;
    user_id: string;
    username: string;
    total_xp: number;
    current_streak: number;
    updated_at: string;
}

interface FriendshipRow {
    friend_id: string;
}

interface FriendRequestRow {
    to_user_id: string;
}

type LeaderboardResponse = PostgrestSingleResponse<LeaderboardEntry[]>;
type FriendshipResponse = PostgrestSingleResponse<FriendshipRow[]>;
type FriendRequestResponse = PostgrestSingleResponse<FriendRequestRow[]>;

const FETCH_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`[leaderboard] ${label} timed out after ${FETCH_TIMEOUT_MS}ms`));
        }, FETCH_TIMEOUT_MS);

        Promise.resolve(promise)
            .then((value) => resolve(value))
            .catch((error) => reject(error))
            .finally(() => clearTimeout(timer));
    });
}

export default function LeaderboardScreen() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
    const [view, setView] = useState<'league' | 'global' | 'friends'>('league');
    const [leagueLoading, setLeagueLoading] = useState(true);
    const [leagueError, setLeagueError] = useState<string | null>(null);
    const [boardLoading, setBoardLoading] = useState(false);
    const [boardError, setBoardError] = useState<string | null>(null);
    const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
    const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());
    const { user } = useAuth();
    const { showToast } = useToast();
    const bottomTabBarHeight = useBottomTabBarHeight();
    const listBottomInset = bottomTabBarHeight + theme.spacing.lg;
    const leagueRequestIdRef = useRef(0);
    const boardRequestIdRef = useRef(0);
    const friendStatusRequestIdRef = useRef(0);
    const tierNames: Record<number, string> = {
        0: String(i18n.t('leaderboard.tiers.bronze')),
        1: String(i18n.t('leaderboard.tiers.silver')),
        2: String(i18n.t('leaderboard.tiers.gold')),
        3: String(i18n.t('leaderboard.tiers.platinum')),
        4: String(i18n.t('leaderboard.tiers.diamond')),
        5: String(i18n.t('leaderboard.tiers.master')),
    };

    useEffect(() => {
        void fetchFriendStatus();
        if (view === 'league') {
            boardRequestIdRef.current += 1;
            void fetchLeague();
        } else {
            leagueRequestIdRef.current += 1;
            void fetchLeaderboard(view);
        }
    }, [view, user?.id]);

    const fetchFriendStatus = async () => {
        const requestId = ++friendStatusRequestIdRef.current;

        if (!user) {
            if (requestId !== friendStatusRequestIdRef.current) return;
            setFriendIds(new Set());
            setPendingRequestIds(new Set());
            return;
        }

        try {
            // Fetch friend IDs
            const { data: friends } = await withTimeout<FriendshipResponse>(
                supabase
                .from('friendships')
                .select('friend_id')
                .eq('user_id', user.id),
                'friendships fetch'
            );

            if (requestId !== friendStatusRequestIdRef.current) return;
            setFriendIds(new Set(friends?.map((friend) => friend.friend_id) || []));

            // Fetch pending request IDs
            const { data: requests } = await withTimeout<FriendRequestResponse>(
                supabase
                .from('friend_requests')
                .select('to_user_id')
                .eq('from_user_id', user.id)
                .eq('status', 'pending'),
                'friend requests fetch'
            );

            if (requestId !== friendStatusRequestIdRef.current) return;
            setPendingRequestIds(new Set(requests?.map((request) => request.to_user_id) || []));
        } catch (error) {
            if (requestId !== friendStatusRequestIdRef.current) return;
            console.error('[leaderboard] failed to fetch friend status', error);
        }
    };

    const sendFriendRequest = async (toUserId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('friend_requests')
                .insert({
                    from_user_id: user.id,
                    to_user_id: toUserId,
                    status: 'pending',
                });

            if (error) {
                if (error.code === '23505') {
                    showToast(String(i18n.t('leaderboard.alerts.alreadySentMessage')));
                } else {
                    throw error;
                }
            } else {
                setPendingRequestIds(prev => new Set(prev).add(toUserId));
                showToast(String(i18n.t('leaderboard.alerts.successMessage')), 'success');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            showToast(String(i18n.t('leaderboard.alerts.failedToSend')), 'error');
        }
    };

    const fetchLeague = async () => {
        const requestId = ++leagueRequestIdRef.current;

        if (!user) {
            if (requestId !== leagueRequestIdRef.current) return;
            setLeagueError(null);
            setLeagueLoading(false);
            setLeagueInfo(null);
            return;
        }
        setLeagueLoading(true);
        setLeagueError(null);
        try {
            let info = await withTimeout(getMyLeague(user.id), 'getMyLeague');
            if (!info) {
                // Not in a league yet, try to join
                await withTimeout(ensureJoinedLeagueForCurrentWeek(user.id), 'ensureJoinedLeagueForCurrentWeek');
                info = await withTimeout(getMyLeague(user.id), 'getMyLeague after join');
            }
            if (requestId !== leagueRequestIdRef.current) return;
            setLeagueInfo(info);
        } catch (error) {
            if (requestId !== leagueRequestIdRef.current) return;
            console.error('[leaderboard] failed to fetch league', error);
            setLeagueError(String(i18n.t('leaderboard.emptyData')));
        } finally {
            if (requestId === leagueRequestIdRef.current) {
                setLeagueLoading(false);
            }
        }
    };

    const fetchLeaderboard = async (targetView: 'global' | 'friends') => {
        const requestId = ++boardRequestIdRef.current;

        setBoardLoading(true);
        setBoardError(null);
        try {
            if (targetView === 'global') {
                // Fetch top 100 users by XP
                const { data, error } = await withTimeout<LeaderboardResponse>(
                    supabase
                    .from('leaderboard')
                    .select('*')
                    .order('total_xp', { ascending: false })
                    .limit(100),
                    'global leaderboard fetch'
                );

                if (error) throw error;
                if (requestId !== boardRequestIdRef.current) return;
                setLeaderboard(data || []);
            } else {
                if (!user?.id) {
                    if (requestId !== boardRequestIdRef.current) return;
                    setLeaderboard([]);
                    return;
                }
                // Fetch friends' rankings
                const { data: friends, error: friendsError } = await withTimeout<FriendshipResponse>(
                    supabase
                    .from('friendships')
                    .select('friend_id')
                    .eq('user_id', user.id),
                    'friend ids fetch'
                );

                if (friendsError) throw friendsError;

                const friendIds = friends?.map((friend) => friend.friend_id) || [];

                if (friendIds.length === 0) {
                    if (requestId !== boardRequestIdRef.current) return;
                    setLeaderboard([]);
                } else {
                    const { data, error } = await withTimeout<LeaderboardResponse>(
                        supabase
                        .from('leaderboard')
                        .select('*')
                        .in('user_id', friendIds)
                        .order('total_xp', { ascending: false }),
                        'friends leaderboard fetch'
                    );

                    if (error) throw error;
                    if (requestId !== boardRequestIdRef.current) return;
                    setLeaderboard(data || []);
                }
            }
        } catch (error) {
            if (requestId !== boardRequestIdRef.current) return;
            console.error('[leaderboard] failed to fetch leaderboard', error);
            setBoardError(String(i18n.t('leaderboard.emptyData')));
        } finally {
            if (requestId === boardRequestIdRef.current) {
                setBoardLoading(false);
            }
        }
    };

    const handleRetry = () => {
        if (view === 'league') {
            void fetchLeague();
            return;
        }
        void fetchLeaderboard(view);
    };

    const currentLoading = view === 'league' ? leagueLoading : boardLoading;
    const currentError = view === 'league' ? leagueError : boardError;

    const renderLeaderboardRow = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const rank = index + 1;
        const isCurrentUser = item.user_id === user?.id;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        const isFriend = friendIds.has(item.user_id);
        const hasPendingRequest = pendingRequestIds.has(item.user_id);

        return (
            <View
                style={[styles.row, isCurrentUser && styles.currentUserRow]}
                testID={`leaderboard-row-${index}`}
            >
                <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>{medal || `#${rank}`}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text
                        style={[styles.username, isCurrentUser && styles.currentUsername]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.username}
                        {isCurrentUser && ` ${i18n.t('leaderboard.youSuffix')}`}
                    </Text>
                    <View style={styles.stats}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <StreakIcon size={14} />
                            <Text style={styles.statText}>
                                {i18n.t('profile.stats.streakValue', { count: item.current_streak })}
                            </Text>
                        </View>
                        <Text style={styles.statText}>⭐ {item.total_xp} XP</Text>
                    </View>
                </View>
                {!isCurrentUser && view === 'global' && (
                    <Pressable
                        testID={`leaderboard-add-friend-${item.user_id}`}
                        style={[
                            styles.addFriendButton,
                            (isFriend || hasPendingRequest) && styles.addFriendButtonDisabled,
                        ]}
                        onPress={() => sendFriendRequest(item.user_id)}
                        disabled={isFriend || hasPendingRequest}
                        accessibilityRole="button"
                        accessibilityLabel={`${String(
                            i18n.t(
                                isFriend
                                    ? 'friends.tabs.friends'
                                    : hasPendingRequest
                                      ? 'friendSearch.cta.sent'
                                      : 'friendSearch.cta.add'
                            )
                        )}: ${item.username}`}
                        accessibilityState={{ disabled: isFriend || hasPendingRequest }}
                    >
                        <Ionicons
                            name={isFriend ? "checkmark-circle" : hasPendingRequest ? "time" : "person-add"}
                            size={20}
                            color={isFriend ? theme.colors.success : hasPendingRequest ? theme.colors.sub : theme.colors.primary}
                        />
                    </Pressable>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <TrophyIcon size={32} />
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.colors.text }}>
                        {i18n.t('tabs.ranking')}
                    </Text>
                </View>
                <View style={styles.segmentedControl}>
                    <Pressable
                        style={[styles.segment, view === 'league' && styles.activeSegment]}
                        onPress={() => setView('league')}
                    >
                        <Text style={[styles.segmentText, view === 'league' && styles.activeSegmentText]}>
                            {i18n.t('leaderboard.tabs.league')}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.segment, view === 'global' && styles.activeSegment]}
                        onPress={() => setView('global')}
                    >
                        <Text style={[styles.segmentText, view === 'global' && styles.activeSegmentText]}>
                            {i18n.t('leaderboard.tabs.global')}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.segment, view === 'friends' && styles.activeSegment]}
                        onPress={() => setView('friends')}
                    >
                        <Text style={[styles.segmentText, view === 'friends' && styles.activeSegmentText]}>
                            {i18n.t('leaderboard.tabs.friends')}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {currentLoading ? (
                <View style={styles.loadingContainer} testID="leaderboard-loading">
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : currentError ? (
                <View style={styles.emptyContainer} testID="leaderboard-error">
                    <Text style={styles.errorTitle}>{i18n.t('common.error')}</Text>
                    <Text style={styles.emptyText}>{currentError}</Text>
                    <Pressable style={styles.retryButton} onPress={handleRetry} testID="leaderboard-retry">
                        <Text style={styles.retryButtonText}>{i18n.t('common.retry')}</Text>
                    </Pressable>
                </View>
            ) : view === 'league' ? (
                // League view
                leagueInfo ? (
                    <View style={{ flex: 1 }}>
                        {/* League Header */}
                        <View style={styles.leagueHeader}>
                            <Text style={styles.tierIcon}>{leagueInfo.tier_icon}</Text>
                            <Text style={[styles.tierName, { color: leagueInfo.tier_color }]}>
                                {tierNames[leagueInfo.tier] || leagueInfo.tier_name} {i18n.t('leaderboard.leagueSuffix')}
                            </Text>
                            <Text style={styles.weekId}>{leagueInfo.week_id}</Text>
                        </View>

                        {/* Zone Legend */}
                        <View style={styles.zoneLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                                <Text style={styles.legendText}>{i18n.t('leaderboard.promotionZone')}</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                                <Text style={styles.legendText}>{i18n.t('leaderboard.demotionZone')}</Text>
                            </View>
                        </View>

                        {/* Members List */}
                        <FlatList
                            data={leagueInfo.members}
                            testID="leaderboard-league-list"
                            renderItem={({ item, index }) => {
                                const isPromotion = item.rank <= leagueInfo.promotion_zone;
                                const isDemotion = item.rank >= leagueInfo.demotion_zone;
                                const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '';

                                return (
                                    <View style={[
                                        styles.row,
                                        item.is_self && styles.currentUserRow,
                                        isPromotion && styles.promotionRow,
                                        isDemotion && styles.demotionRow,
                                    ]}
                                        testID={`leaderboard-league-row-${item.rank ?? index + 1}`}
                                    >
                                        <View style={styles.rankContainer}>
                                            <Text style={styles.rankText}>{medal || `#${item.rank}`}</Text>
                                        </View>
                                        <View style={styles.userInfo}>
                                            <Text
                                                style={[styles.username, item.is_self && styles.currentUsername]}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {item.username}
                                                {item.is_self && ` ${i18n.t('leaderboard.youSuffix')}`}
                                            </Text>
                                            <Text style={styles.statText}>⭐ {item.weekly_xp} XP</Text>
                                        </View>
                                        {isPromotion && <Ionicons name="arrow-up" size={20} color="#4CAF50" />}
                                        {isDemotion && <Ionicons name="arrow-down" size={20} color="#F44336" />}
                                    </View>
                                );
                            }}
                            keyExtractor={(item) => item.user_id}
                            contentContainerStyle={[styles.list, { paddingBottom: listBottomInset }]}
                        />
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{i18n.t('leaderboard.joiningLeague')}</Text>
                    </View>
                )
            ) : leaderboard.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        {view === 'friends'
                            ? i18n.t('leaderboard.emptyFriends')
                            : i18n.t('leaderboard.emptyData')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={leaderboard}
                    renderItem={renderLeaderboardRow}
                    keyExtractor={(item) => item.id}
                    testID={`leaderboard-list-${view}`}
                    contentContainerStyle={[styles.list, { paddingBottom: listBottomInset }]}
                />
            )}
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
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: "transparent",
        borderRadius: 8,
        padding: 4,
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
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.sub,
    },
    activeSegmentText: {
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.sub,
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 8,
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
    list: {
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.line,
    },
    currentUserRow: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    username: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
        flexShrink: 1,
    },
    currentUsername: {
        color: theme.colors.primary,
    },
    stats: {
        flexDirection: 'row',
        gap: 16,
    },
    statText: {
        fontSize: 14,
        color: theme.colors.sub,
    },
    addFriendButton: {
        padding: 8,
        minWidth: 44,
        minHeight: 44,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addFriendButtonDisabled: {
        opacity: 0.5,
    },
    // League styles
    leagueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
        backgroundColor: theme.colors.surface,
    },
    tierIcon: {
        fontSize: 32,
    },
    tierName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    weekId: {
        fontSize: 14,
        color: theme.colors.sub,
        marginLeft: 8,
    },
    zoneLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        padding: 12,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: theme.colors.sub,
    },
    promotionRow: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    demotionRow: {
        borderLeftWidth: 4,
        borderLeftColor: '#F44336',
    },
});
