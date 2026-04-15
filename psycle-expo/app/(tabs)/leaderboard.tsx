import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import i18n from '../../lib/i18n';
import { useLeaderboardScreen, type LeaderboardView } from '../../lib/leaderboard/useLeaderboardScreen';
import { LeaderboardContent, LeaderboardHeader } from '../../components/leaderboard/LeaderboardSections';
import { COURSE_THEME_COLORS } from '../../lib/courseWorldModel';
import { useProgressionState } from '../../lib/state';

export default function LeaderboardScreen() {
    const [view, setView] = useState<LeaderboardView>('league');
    const bottomTabBarHeight = useBottomTabBarHeight();
    const listBottomInset = bottomTabBarHeight + theme.spacing.lg;
    const { selectedGenre } = useProgressionState();
    const themeColor = COURSE_THEME_COLORS[selectedGenre] ?? COURSE_THEME_COLORS.mental;
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LeaderboardHeader view={view} onChange={setView} themeColor={themeColor} />
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
});
