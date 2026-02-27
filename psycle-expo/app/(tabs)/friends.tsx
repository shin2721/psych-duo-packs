import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useAppState } from '../../lib/state';
import { theme } from '../../lib/theme';
import { FriendSearch } from '../../components/FriendSearch';
import {
    buildWeeklyFriendChallenge,
    evaluateFriendChallengeProgress,
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
const FRIEND_CHALLENGE_REWARD_GEMS = 15;

function getFriendChallengeClaimKey(userId: string, weekId: string): string {
    return `friend_challenge_claimed_${userId}_${weekId}`;
}

export default function FriendsScreen() {
    const [view, setView] = useState<ViewType>('friends');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [friendChallenge, setFriendChallenge] = useState<WeeklyFriendChallenge | null>(null);
    const [friendChallengeClaimed, setFriendChallengeClaimed] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { addGems } = useAppState();

    useEffect(() => {
        if (view === 'friends') {
            fetchFriends();
            fetchFriendChallenge();
        } else if (view === 'requests') {
            fetchRequests();
        }
    }, [view]);

    const fetchFriendChallenge = async () => {
        if (!user) {
            setFriendChallenge(null);
            setFriendChallengeClaimed(false);
            return;
        }

        try {
            const challenge = await buildWeeklyFriendChallenge(user.id);
            setFriendChallenge(challenge);
            if (!challenge) {
                setFriendChallengeClaimed(false);
                return;
            }

            const claimKey = getFriendChallengeClaimKey(user.id, challenge.weekId);
            const claimed = await AsyncStorage.getItem(claimKey);
            setFriendChallengeClaimed(claimed === '1');

            Analytics.track('friend_challenge_shown', {
                weekId: challenge.weekId,
                source: 'friends_tab',
            });
        } catch (error) {
            console.error('Error fetching friend challenge:', error);
            setFriendChallenge(null);
            setFriendChallengeClaimed(false);
        }
    };

    const fetchFriends = async () => {
        if (!user) return;

        setLoading(true);
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
                username: profile?.username || 'Unknown',
                total_xp: profile?.total_xp || 0,
                current_streak: profile?.current_streak || 0,
                };
            });

            setFriends(formattedFriends);
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        if (!user) return;

        setLoading(true);
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
                username: profile?.username || 'Unknown',
                total_xp: profile?.total_xp || 0,
                };
            });

            setRequests(formattedRequests);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
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

            Alert.alert('Success', 'Friend request accepted!');
            fetchRequests();
        } catch (error) {
            console.error('Error accepting request:', error);
            Alert.alert('Error', 'Failed to accept friend request');
        }
    };

    const rejectRequest = async (requestId: string) => {
        try {
            await supabase
                .from('friend_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

            fetchRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            Alert.alert('Error', 'Failed to reject friend request');
        }
    };

    const removeFriend = async (friendId: string) => {
        if (!user) return;

        Alert.alert(
            'Remove Friend',
            'Are you sure you want to remove this friend?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase
                                .from('friendships')
                                .delete()
                                .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

                            fetchFriends();
                        } catch (error) {
                            console.error('Error removing friend:', error);
                            Alert.alert('Error', 'Failed to remove friend');
                        }
                    },
                },
            ]
        );
    };

    const claimFriendChallengeReward = async () => {
        if (!user || !friendChallenge || friendChallengeClaimed) return;

        const progress = evaluateFriendChallengeProgress({
            myWeeklyXp: friendChallenge.myWeeklyXp,
            opponentWeeklyXp: friendChallenge.opponentWeeklyXp,
        });

        if (!progress.completed) {
            Alert.alert(
                String(i18n.t('common.error')),
                String(i18n.t('friends.challenge.notCompleted'))
            );
            return;
        }

        const claimKey = getFriendChallengeClaimKey(user.id, friendChallenge.weekId);
        try {
            await AsyncStorage.setItem(claimKey, '1');
            addGems(FRIEND_CHALLENGE_REWARD_GEMS);
            setFriendChallengeClaimed(true);
            Analytics.track('friend_challenge_completed', {
                weekId: friendChallenge.weekId,
                opponentId: friendChallenge.opponentId,
                rewardGems: FRIEND_CHALLENGE_REWARD_GEMS,
                source: 'friends_tab',
            });
            Alert.alert(
                String(i18n.t('common.ok')),
                String(i18n.t('friends.challenge.rewardClaimed', { gems: FRIEND_CHALLENGE_REWARD_GEMS }))
            );
        } catch (error) {
            console.error('Error claiming friend challenge reward:', error);
            Alert.alert(String(i18n.t('common.error')), String(i18n.t('friends.challenge.rewardFailed')));
        }
    };

    const friendChallengeProgress = friendChallenge
        ? evaluateFriendChallengeProgress({
            myWeeklyXp: friendChallenge.myWeeklyXp,
            opponentWeeklyXp: friendChallenge.opponentWeeklyXp,
        })
        : null;

    const renderFriend = ({ item }: { item: Friend }) => (
        <View style={styles.card}>
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <View style={styles.stats}>
                    <Text style={styles.statText}>⭐ {item.total_xp} XP</Text>
                    <Text style={styles.statText}>🔥 {item.current_streak} day streak</Text>
                </View>
            </View>
            <Pressable
                style={styles.removeButton}
                onPress={() => removeFriend(item.friend_id)}
            >
                <Ionicons name="person-remove" size={20} color={theme.colors.error} />
            </Pressable>
        </View>
    );

    const renderRequest = ({ item }: { item: FriendRequest }) => (
        <View style={styles.card}>
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.statText}>⭐ {item.total_xp} XP</Text>
            </View>
            <View style={styles.requestActions}>
                <Pressable
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => acceptRequest(item.id, item.from_user_id)}
                >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                </Pressable>
                <Pressable
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => rejectRequest(item.id)}
                >
                    <Ionicons name="close" size={20} color="#fff" />
                </Pressable>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Friends</Text>
            </View>

            <View style={styles.segmentedControl}>
                <Pressable
                    style={[styles.segment, view === 'friends' && styles.activeSegment]}
                    onPress={() => setView('friends')}
                >
                    <Text style={[styles.segmentText, view === 'friends' && styles.activeSegmentText]}>
                        Friends
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.segment, view === 'requests' && styles.activeSegment]}
                    onPress={() => setView('requests')}
                >
                    <Text style={[styles.segmentText, view === 'requests' && styles.activeSegmentText]}>
                        Requests {requests.length > 0 && `(${requests.length})`}
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.segment, view === 'search' && styles.activeSegment]}
                    onPress={() => setView('search')}
                >
                    <Text style={[styles.segmentText, view === 'search' && styles.activeSegmentText]}>
                        Search
                    </Text>
                </Pressable>
            </View>

            <View style={styles.content}>
                {view === 'friends' && (
                    <>
                        {friendChallenge && friendChallengeProgress && (
                            <View style={styles.challengeCard}>
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
                                    onPress={claimFriendChallengeReward}
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
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people" size={64} color={theme.colors.sub} />
                                <Text style={styles.emptyText}>No friends yet</Text>
                                <Text style={styles.emptySubtext}>Search for users to add friends</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={friends}
                                renderItem={renderFriend}
                                keyExtractor={(item) => item.friend_id}
                                contentContainerStyle={styles.list}
                            />
                        )}
                    </>
                )}

                {view === 'requests' && (
                    requests.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="mail" size={64} color={theme.colors.sub} />
                            <Text style={styles.emptyText}>No pending requests</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={requests}
                            renderItem={renderRequest}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.list}
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
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.sub,
        marginTop: 8,
    },
});
