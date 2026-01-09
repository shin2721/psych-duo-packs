import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { theme } from '../../lib/theme';

interface LeaderboardEntry {
    id: string;
    user_id: string;
    username: string;
    total_xp: number;
    current_streak: number;
    updated_at: string;
}

export default function LeaderboardScreen() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [view, setView] = useState<'global' | 'friends'>('global');
    const [loading, setLoading] = useState(true);
    const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
    const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());
    const { user } = useAuth();

    useEffect(() => {
        fetchFriendStatus();
        fetchLeaderboard();
    }, [view]);

    const fetchFriendStatus = async () => {
        if (!user) return;

        try {
            // Fetch friend IDs
            const { data: friends } = await supabase
                .from('friendships')
                .select('friend_id')
                .eq('user_id', user.id);

            setFriendIds(new Set(friends?.map(f => f.friend_id) || []));

            // Fetch pending request IDs
            const { data: requests } = await supabase
                .from('friend_requests')
                .select('to_user_id')
                .eq('from_user_id', user.id)
                .eq('status', 'pending');

            setPendingRequestIds(new Set(requests?.map(r => r.to_user_id) || []));
        } catch (error) {
            console.error('Error fetching friend status:', error);
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
                    Alert.alert('Already Sent', 'Friend request already sent');
                } else {
                    throw error;
                }
            } else {
                setPendingRequestIds(prev => new Set(prev).add(toUserId));
                Alert.alert('Success', 'Friend request sent!');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            Alert.alert('Error', 'Failed to send friend request');
        }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            if (view === 'global') {
                // Fetch top 100 users by XP
                const { data, error } = await supabase
                    .from('leaderboard')
                    .select('*')
                    .order('total_xp', { ascending: false })
                    .limit(100);

                if (error) throw error;
                setLeaderboard(data || []);
            } else {
                // Fetch friends' rankings
                const { data: friends, error: friendsError } = await supabase
                    .from('friendships')
                    .select('friend_id')
                    .eq('user_id', user?.id);

                if (friendsError) throw friendsError;

                const friendIds = friends?.map(f => f.friend_id) || [];

                if (friendIds.length === 0) {
                    setLeaderboard([]);
                } else {
                    const { data, error } = await supabase
                        .from('leaderboard')
                        .select('*')
                        .in('user_id', friendIds)
                        .order('total_xp', { ascending: false });

                    if (error) throw error;
                    setLeaderboard(data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderLeaderboardRow = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const rank = index + 1;
        const isCurrentUser = item.user_id === user?.id;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        const isFriend = friendIds.has(item.user_id);
        const hasPendingRequest = pendingRequestIds.has(item.user_id);

        return (
            <View style={[styles.row, isCurrentUser && styles.currentUserRow]}>
                <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>{medal || `#${rank}`}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.username, isCurrentUser && styles.currentUsername]}>
                        {item.username}
                        {isCurrentUser && ' (You)'}
                    </Text>
                    <View style={styles.stats}>
                        <Text style={styles.statText}>🔥 {item.current_streak} day streak</Text>
                        <Text style={styles.statText}>⭐ {item.total_xp} XP</Text>
                    </View>
                </View>
                {!isCurrentUser && view === 'global' && (
                    <Pressable
                        style={[
                            styles.addFriendButton,
                            (isFriend || hasPendingRequest) && styles.addFriendButtonDisabled,
                        ]}
                        onPress={() => sendFriendRequest(item.user_id)}
                        disabled={isFriend || hasPendingRequest}
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
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Leaderboard</Text>
                <View style={styles.segmentedControl}>
                    <Pressable
                        style={[styles.segment, view === 'global' && styles.activeSegment]}
                        onPress={() => setView('global')}
                    >
                        <Text style={[styles.segmentText, view === 'global' && styles.activeSegmentText]}>
                            Global
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.segment, view === 'friends' && styles.activeSegment]}
                        onPress={() => setView('friends')}
                    >
                        <Text style={[styles.segmentText, view === 'friends' && styles.activeSegmentText]}>
                            Friends
                        </Text>
                    </Pressable>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : leaderboard.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        {view === 'friends'
                            ? 'No friends yet. Add friends to compete!'
                            : 'No data available'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={leaderboard}
                    renderItem={renderLeaderboardRow}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    header: {
        padding: 20,
        paddingTop: 60,
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
        backgroundColor: theme.colors.bg,
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
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
    },
    addFriendButtonDisabled: {
        opacity: 0.5,
    },
});
