import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { theme } from '../lib/theme';

interface SearchResult {
    user_id: string;
    username: string;
    total_xp: number;
    current_streak: number;
}

interface FriendSearchProps {
    onRequestSent?: () => void;
}

export function FriendSearch({ onRequestSent }: FriendSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const { user } = useAuth();

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leaderboard')
                .select('user_id, username, total_xp, current_streak')
                .ilike('username', `%${searchQuery}%`)
                .neq('user_id', user?.id || '')
                .limit(10);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
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
                    // Unique constraint violation - request already exists
                    alert('Friend request already sent');
                } else {
                    throw error;
                }
            } else {
                setSentRequests(prev => new Set(prev).add(toUserId));
                onRequestSent?.();
                alert('Friend request sent!');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert('Failed to send friend request');
        }
    };

    const renderSearchResult = ({ item }: { item: SearchResult }) => {
        const requestSent = sentRequests.has(item.user_id);

        return (
            <View style={styles.resultCard}>
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <View style={styles.stats}>
                        <Text style={styles.statText}>⭐ {item.total_xp} XP</Text>
                        <Text style={styles.statText}>🔥 {item.current_streak} day streak</Text>
                    </View>
                </View>
                <Pressable
                    style={[styles.addButton, requestSent && styles.addButtonDisabled]}
                    onPress={() => sendFriendRequest(item.user_id)}
                    disabled={requestSent}
                >
                    <Ionicons
                        name={requestSent ? "checkmark-circle" : "person-add"}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.addButtonText}>
                        {requestSent ? 'Sent' : 'Add'}
                    </Text>
                </Pressable>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={theme.colors.sub} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by username..."
                    placeholderTextColor={theme.colors.sub}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.sub} />
                    </Pressable>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : searchResults.length === 0 && searchQuery.length > 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search" size={48} color={theme.colors.sub} />
                    <Text style={styles.emptyText}>No users found</Text>
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item.user_id}
                    contentContainerStyle={styles.resultsList}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
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
        marginTop: 12,
    },
    resultsList: {
        padding: 4,
    },
    resultCard: {
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
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    addButtonDisabled: {
        backgroundColor: theme.colors.success,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
