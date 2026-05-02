import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import i18n from '../../lib/i18n';
import { useLeaderboardScreen, type LeaderboardView } from '../../lib/leaderboard/useLeaderboardScreen';
import { LeaderboardContent, LeaderboardHeader } from '../../components/leaderboard/LeaderboardSections';
import { LeagueCluster } from '../../components/leaderboard/LeagueCluster';
import { COURSE_THEME_COLORS } from '../../lib/courseWorldModel';
import { useProgressionState } from '../../lib/state';
import { Analytics } from '../../lib/analytics';
import type { LeagueMember } from '../../lib/league';

function getEngagementAppEnv(): "dev" | "prod" {
    return typeof __DEV__ !== "undefined" && __DEV__ ? "dev" : "prod";
}

export default function LeaderboardScreen() {
    const [view, setView] = useState<LeaderboardView>('league');
    const lastLeagueEntryShownKeyRef = useRef<string | null>(null);
    const bottomTabBarHeight = useBottomTabBarHeight();
    const listBottomInset = bottomTabBarHeight + theme.spacing.lg;
    const { selectedGenre } = useProgressionState();
    const themeColor = COURSE_THEME_COLORS[selectedGenre] ?? COURSE_THEME_COLORS.mental;
    const { width: windowWidth } = useWindowDimensions();
    const clusterSize = Math.min(windowWidth - 40, 300);
    const {
        leaderboard,
        leagueInfo,
        friendIds,
        pendingRequestIds,
        isGuestUser,
        currentUserId,
        currentLoading,
        currentError,
        refreshCurrentView,
        sendFriendRequest,
    } = useLeaderboardScreen(view);
    const tierNames: Record<number, string> = {
        0: String(i18n.t('leaderboard.tiers.bronze')),
        1: String(i18n.t('leaderboard.tiers.silver')),
        2: String(i18n.t('leaderboard.tiers.gold')),
        3: String(i18n.t('leaderboard.tiers.platinum')),
        4: String(i18n.t('leaderboard.tiers.diamond')),
        5: String(i18n.t('leaderboard.tiers.master')),
    };

    useEffect(() => {
        if (view !== 'league' || !leagueInfo) return;
        const self = leagueInfo.members.find((member) => member.is_self);
        if (!self) return;
        const analyticsKey = [
            leagueInfo.league_id,
            leagueInfo.week_id,
            leagueInfo.tier,
            self.weekly_xp,
            self.rank,
        ].join(':');
        if (lastLeagueEntryShownKeyRef.current === analyticsKey) return;
        lastLeagueEntryShownKeyRef.current = analyticsKey;

        Analytics.track("league_entry_shown", {
            source: "leaderboard_tab",
            surface: "leaderboard",
            weekId: leagueInfo.week_id,
            leagueId: leagueInfo.league_id,
            tier: leagueInfo.tier,
            weeklyXp: self.weekly_xp,
            weeklyXpZeroState: self.weekly_xp === 0 ? "zero" : "non_zero",
            memberCount: leagueInfo.members.length,
            rank: self.rank,
            appEnv: getEngagementAppEnv(),
        });
    }, [leagueInfo, view]);

    const handleMemberPress = (member: LeagueMember) => {
        if (member.is_self) return;
        Alert.alert(
            member.username,
            `今週のXP: ${member.weekly_xp.toLocaleString()}\n順位: ${member.rank}位`,
            [{ text: '閉じる', style: 'cancel' }]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LeaderboardHeader view={view} onChange={setView} themeColor={themeColor} />
            {view === 'league' && leagueInfo && leagueInfo.members.length > 0 && (
                <View style={styles.clusterWrap}>
                    <LeagueCluster
                        leagueInfo={leagueInfo}
                        themeColor={themeColor}
                        size={clusterSize}
                        onMemberPress={handleMemberPress}
                    />
                </View>
            )}
            <LeaderboardContent
                view={view}
                leaderboard={leaderboard}
                leagueInfo={leagueInfo}
                listBottomInset={listBottomInset}
                tierNames={tierNames}
                currentUserId={currentUserId}
                friendIds={friendIds}
                pendingRequestIds={pendingRequestIds}
                isGuestUser={isGuestUser}
                onRetry={refreshCurrentView}
                onSendFriendRequest={(userId) => {
                    void sendFriendRequest(userId);
                }}
                loading={currentLoading}
                error={currentError}
                themeColor={themeColor}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    clusterWrap: {
        alignItems: 'center',
        paddingVertical: 10,
    },
});
