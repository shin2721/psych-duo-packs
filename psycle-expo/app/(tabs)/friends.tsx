import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import i18n from '../../lib/i18n';
import { useFriendsScreen, type FriendsView } from '../../lib/friends/useFriendsScreen';
import { FriendsContentView, FriendsTabBar } from '../../components/friends/FriendsSections';

export default function FriendsScreen() {
    const [view, setView] = useState<FriendsView>('friends');
    const bottomTabBarHeight = useBottomTabBarHeight();
    const listBottomInset = bottomTabBarHeight + theme.spacing.lg;
    const {
        friends,
        requests,
        friendChallenge,
        friendChallengeClaimed,
        friendChallengeProgress,
        friendsLoading,
        friendsError,
        requestsLoading,
        requestsError,
        acceptRequest,
        rejectRequest,
        confirmRemoveFriend,
        claimFriendChallengeReward,
        refreshFriends,
        refreshRequests,
    } = useFriendsScreen(view);

    const removeFriend = (friendId: string) => {
        Alert.alert(
            String(i18n.t('friends.alerts.removeTitle')),
            String(i18n.t('friends.alerts.removeMessage')),
            [
                { text: String(i18n.t('common.cancel')), style: 'cancel' },
                {
                    text: String(i18n.t('friends.alerts.removeConfirm')),
                    style: 'destructive',
                    onPress: () => {
                        void confirmRemoveFriend(friendId);
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} testID="friends-screen">
            <View style={styles.header}>
                <Text style={styles.title}>{String(i18n.t('friends.title'))}</Text>
            </View>

            <FriendsTabBar requestCount={requests.length} view={view} onChange={setView} />

            <View style={styles.content}>
                <FriendsContentView
                    view={view}
                    listBottomInset={listBottomInset}
                    friends={friends}
                    requests={requests}
                    friendChallenge={friendChallenge}
                    friendChallengeClaimed={friendChallengeClaimed}
                    friendChallengeProgress={friendChallengeProgress}
                    friendsLoading={friendsLoading}
                    friendsError={friendsError}
                    requestsLoading={requestsLoading}
                    requestsError={requestsError}
                    onAcceptRequest={acceptRequest}
                    onRejectRequest={rejectRequest}
                    onClaimFriendChallengeReward={() => {
                        void claimFriendChallengeReward();
                    }}
                    onRefreshFriends={() => {
                        void refreshFriends();
                    }}
                    onRefreshRequests={() => {
                        void refreshRequests();
                    }}
                    onRemoveFriend={removeFriend}
                    onRequestSent={() => setView('requests')}
                />
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
});
