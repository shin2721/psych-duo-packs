/**
 * リーグ結果モーダル
 * 
 * 週明けにリーグ結果を表示し、報酬をclaimする
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { LEAGUE_TIERS } from '../lib/league';
import { LeagueResult, claimReward } from '../lib/leagueReward';

interface LeagueResultModalProps {
    visible: boolean;
    result: LeagueResult;
    onClaim: (gems: number, badges: string[], newBalance?: number) => void;
    onDismiss: () => void;
}

export function LeagueResultModal({
    visible,
    result,
    onClaim,
    onDismiss,
}: LeagueResultModalProps) {
    const [claiming, setClaiming] = useState(false);

    if (!result.hasReward || !result.reward) return null;

    const tierInfo = Object.values(LEAGUE_TIERS).find(t => t.id === result.newTier) || LEAGUE_TIERS.BRONZE;

    const handleClaim = async () => {
        if (!result.reward) return;
        setClaiming(true);

        const claimed = await claimReward(result.reward.id);
        if (claimed) {
            onClaim(claimed.gemsAdded, claimed.badgesAwarded, claimed.newBalance);
        }

        setClaiming(false);
        onDismiss();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Result Icon */}
                    <View style={styles.iconContainer}>
                        {result.promoted ? (
                            <Text style={styles.emoji}>🎉</Text>
                        ) : result.demoted ? (
                            <Text style={styles.emoji}>😢</Text>
                        ) : (
                            <Text style={styles.emoji}>👍</Text>
                        )}
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>
                        {result.promoted ? '昇格！' : result.demoted ? '降格...' : '週終了！'}
                    </Text>

                    {/* Rank */}
                    <Text style={styles.rank}>
                        #{result.finalRank}位でフィニッシュ
                    </Text>

                    {/* Tier Change */}
                    {(result.promoted || result.demoted) && (
                        <View style={styles.tierChange}>
                            <Text style={[styles.tierName, { color: tierInfo.color }]}>
                                {tierInfo.icon} {tierInfo.name}リーグへ
                            </Text>
                        </View>
                    )}

                    {/* Rewards */}
                    <View style={styles.rewardsContainer}>
                        <Text style={styles.rewardsTitle}>報酬</Text>
                        <View style={styles.rewardRow}>
                            <Ionicons name="diamond" size={24} color="#00BCD4" />
                            <Text style={styles.rewardText}>+{result.reward.gems} Gems</Text>
                        </View>
                        {result.reward.badges.length > 0 && (
                            <View style={styles.rewardRow}>
                                <Ionicons name="medal" size={24} color="#FFD700" />
                                <Text style={styles.rewardText}>
                                    +{result.reward.badges.length} バッジ
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Claim Button */}
                    <Pressable
                        style={[styles.button, claiming && styles.buttonDisabled]}
                        onPress={handleClaim}
                        disabled={claiming}
                    >
                        <Text style={styles.buttonText}>
                            {claiming ? '受け取り中...' : '受け取る'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },
    iconContainer: {
        marginBottom: 16,
    },
    emoji: {
        fontSize: 64,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    rank: {
        fontSize: 18,
        color: theme.colors.sub,
        marginBottom: 16,
    },
    tierChange: {
        marginBottom: 20,
    },
    tierName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    rewardsContainer: {
        width: '100%',
        backgroundColor: 'rgba(0, 188, 212, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    rewardsTitle: {
        fontSize: 14,
        color: theme.colors.sub,
        marginBottom: 12,
        textAlign: 'center',
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 8,
    },
    rewardText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});
