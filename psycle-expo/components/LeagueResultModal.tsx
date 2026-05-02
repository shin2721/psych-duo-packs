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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { LEAGUE_TIERS } from '../lib/league';
import { Analytics } from '../lib/analytics';
import { LeagueResult, claimReward } from '../lib/leagueReward';
import i18n from '../lib/i18n';
import { Button } from './ui';

function getEngagementAppEnv(): "dev" | "prod" {
    return typeof __DEV__ !== "undefined" && __DEV__ ? "dev" : "prod";
}

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
            const sourceEventId = `league_reward_claimed:${result.reward.id}`;
            Analytics.track("league_reward_claimed", {
                rewardId: result.reward.id,
                gems: claimed.gemsAdded,
                badgesCount: claimed.badgesAwarded.length,
                weekId: result.reward.week_id,
                source: "league_result_modal",
            });
            if (claimed.gemsAdded > 0) {
                Analytics.track("engagement_reward_granted", {
                    rewardType: "gems",
                    rewardAmount: claimed.gemsAdded,
                    sourceEventName: "league_reward_claimed",
                    sourceEventId,
                    idempotencyKey: `${sourceEventId}:gems`,
                    surface: "league_result",
                    appEnv: getEngagementAppEnv(),
                });
            }
            if (claimed.badgesAwarded.length > 0) {
                Analytics.track("engagement_reward_granted", {
                    rewardType: "badge",
                    rewardAmount: claimed.badgesAwarded.length,
                    sourceEventName: "league_reward_claimed",
                    sourceEventId,
                    idempotencyKey: `${sourceEventId}:badges`,
                    surface: "league_result",
                    appEnv: getEngagementAppEnv(),
                });
            }
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
                        {result.promoted
                            ? i18n.t('leagueResultModal.titlePromoted')
                            : result.demoted
                                ? i18n.t('leagueResultModal.titleDemoted')
                                : i18n.t('leagueResultModal.titleWeeklyEnd')}
                    </Text>

                    {/* Rank */}
                    <Text style={styles.rank}>
                        {i18n.t('leagueResultModal.rankFinish', { rank: result.finalRank })}
                    </Text>

                    {/* Tier Change */}
                    {(result.promoted || result.demoted) && (
                        <View style={styles.tierChange}>
                            <Text style={[styles.tierName, { color: tierInfo.color }]}>
                                {i18n.t('leagueResultModal.tierChangeToLeague', {
                                    icon: tierInfo.icon,
                                    tier: tierInfo.name,
                                })}
                            </Text>
                        </View>
                    )}

                    {/* Rewards */}
                    <View style={styles.rewardsContainer}>
                        <Text style={styles.rewardsTitle}>{i18n.t('leagueResultModal.rewardsTitle')}</Text>
                        <View style={styles.rewardRow}>
                            <Ionicons name="diamond" size={24} color="#00BCD4" />
                            <Text style={styles.rewardText}>
                                {i18n.t('leagueResultModal.rewardGems', { count: result.reward.gems })}
                            </Text>
                        </View>
                        {result.reward.badges.length > 0 && (
                            <View style={styles.rewardRow}>
                                <Ionicons name="medal" size={24} color="#FFD700" />
                                <Text style={styles.rewardText}>
                                    {i18n.t('leagueResultModal.rewardBadges', {
                                        count: result.reward.badges.length,
                                    })}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Claim Button */}
                    <Button
                        label={String(claiming ? i18n.t('leagueResultModal.claiming') : i18n.t('leagueResultModal.claim'))}
                        onPress={handleClaim}
                        loading={claiming}
                        disabled={claiming}
                        size="lg"
                        style={styles.button}
                    />
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
        ...theme.typography.h1,
        color: theme.colors.text,
        marginBottom: 8,
    },
    rank: {
        ...theme.typography.body,
        color: theme.colors.sub,
        marginBottom: 16,
    },
    tierChange: {
        marginBottom: 20,
    },
    tierName: {
        ...theme.typography.h3,
    },
    rewardsContainer: {
        width: '100%',
        backgroundColor: 'rgba(0, 188, 212, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    rewardsTitle: {
        ...theme.typography.label,
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
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text,
    },
    button: {
        width: '100%',
    },
});
