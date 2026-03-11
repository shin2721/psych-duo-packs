import React, { useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from './ToastProvider';
import { theme } from '../lib/theme';
import i18n from '../lib/i18n';

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
    const [searchError, setSearchError] = useState<string | null>(null);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const { user } = useAuth();
    const { showToast } = useToast();
    const bottomTabBarHeight = useBottomTabBarHeight();
    const resultsBottomInset = bottomTabBarHeight + theme.spacing.lg;
    const searchRequestIdRef = useRef(0);

    const handleSearch = async () => {
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery) return;
        const requestId = ++searchRequestIdRef.current;

        Keyboard.dismiss();
        setLoading(true);
        setSearchError(null);
        try {
            const { data, error } = await supabase
                .from('leaderboard')
                .select('user_id, username, total_xp, current_streak')
                .ilike('username', `%${trimmedQuery}%`)
                .neq('user_id', user?.id || '')
                .limit(10);

            if (error) throw error;
            if (requestId !== searchRequestIdRef.current) return;
            setSearchResults(data || []);
        } catch (error) {
            if (requestId !== searchRequestIdRef.current) return;
            console.error('Search error:', error);
            setSearchError(String(i18n.t('common.unexpectedError')));
        } finally {
            if (requestId === searchRequestIdRef.current) {
                setLoading(false);
            }
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
                    showToast(String(i18n.t('friendSearch.alerts.alreadySent')));
                } else {
                    throw error;
                }
            } else {
                setSentRequests(prev => new Set(prev).add(toUserId));
                Keyboard.dismiss();
                showToast(String(i18n.t('friendSearch.alerts.sent')), 'success');
                onRequestSent?.();
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            showToast(String(i18n.t('friendSearch.alerts.failed')), 'error');
        }
    };

    const renderSearchResult = ({ item }: { item: SearchResult }) => {
        const requestSent = sentRequests.has(item.user_id);

        return (
            <View style={styles.resultCard}>
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
                    style={[styles.addButton, requestSent && styles.addButtonDisabled]}
                    onPress={() => sendFriendRequest(item.user_id)}
                    disabled={requestSent}
                    accessibilityRole="button"
                    accessibilityLabel={`${requestSent
                        ? String(i18n.t('friendSearch.cta.sent'))
                        : String(i18n.t('friendSearch.cta.add'))}: ${item.username}`}
                    accessibilityState={{ disabled: requestSent }}
                >
                    <Ionicons
                        name={requestSent ? "checkmark-circle" : "person-add"}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.addButtonText}>
                        {requestSent
                            ? String(i18n.t('friendSearch.cta.sent'))
                            : String(i18n.t('friendSearch.cta.add'))}
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
                    placeholder={String(i18n.t('friendSearch.placeholder'))}
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
            ) : searchError ? (
                <View style={styles.emptyContainer} testID="friend-search-error">
                    <Text style={styles.errorTitle}>{String(i18n.t('common.error'))}</Text>
                    <Text style={styles.emptyText}>{searchError}</Text>
                    <Pressable style={styles.retryButton} onPress={handleSearch} testID="friend-search-retry">
                        <Text style={styles.retryButtonText}>{String(i18n.t('common.retry'))}</Text>
                    </Pressable>
                </View>
            ) : searchResults.length === 0 && searchQuery.length > 0 ? (
                <View style={styles.emptyContainer} testID="friend-search-empty">
                    <Ionicons name="search" size={48} color={theme.colors.sub} />
                    <Text style={styles.emptyText}>{String(i18n.t('friendSearch.empty'))}</Text>
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item.user_id}
                    contentContainerStyle={[styles.resultsList, { paddingBottom: resultsBottomInset }]}
                    keyboardShouldPersistTaps="handled"
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
        textAlign: 'center',
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
