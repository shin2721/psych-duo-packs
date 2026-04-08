import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { theme } from "../../lib/theme";
import { useProgressionState } from "../../lib/state";
import { useProfileScreen } from "../../lib/profile/useProfileScreen";
import {
    ProfileBadgesSection,
    ProfileCardSection,
    ProfileHeader,
    ProfileQuickActionsSection,
    ProfileStatsGrid,
} from "../../components/profile/ProfileSections";
import i18n from "../../lib/i18n";

export default function ProfileScreen() {
    const router = useRouter();
    const { xp, streak, completedLessons, unlockedBadges } = useProgressionState();
    const { leagueLabel, leagueLoading, profileUsername, avatarIcon, userEmail } = useProfileScreen();
    const bottomTabBarHeight = useBottomTabBarHeight();
    const scrollBottomInset = bottomTabBarHeight + theme.spacing.lg;

    const username = profileUsername || userEmail?.split("@")[0] || String(i18n.t("profile.userFallback"));

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: scrollBottomInset }}>
                <ProfileHeader onOpenSettings={() => router.push("/settings")} />
                <ProfileCardSection
                    avatarIcon={avatarIcon}
                    username={username}
                    userEmail={userEmail}
                    onEditProfile={() => router.push("/settings/edit-profile")}
                />
                <ProfileStatsGrid
                    xp={xp}
                    streak={streak}
                    completedLessonCount={completedLessons.size}
                    leagueLabel={leagueLabel}
                    leagueLoading={leagueLoading}
                />
                <ProfileBadgesSection unlockedBadgeIds={unlockedBadges} />
                <ProfileQuickActionsSection />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
});
