import React from "react";
import { Pressable, Text, View } from "react-native";
import i18n from "../../lib/i18n";
import type { FriendsView } from "../../lib/friends/useFriendsScreen";
import { styles } from "./FriendsStyles";

export { FriendChallengeCard, FriendRequestRow, FriendRow, FriendsEmptyState, FriendsLoadErrorState } from "./FriendsRows";
export { FriendsContentView } from "./FriendsContent";

export function FriendsTabBar({
  requestCount,
  view,
  onChange,
}: {
  requestCount: number;
  view: FriendsView;
  onChange: (view: FriendsView) => void;
}) {
  return (
    <View style={styles.segmentedControl}>
      {(["friends", "requests", "search"] as const).map((item) => {
        const label =
          item === "requests" && requestCount > 0
            ? String(i18n.t("friends.tabs.requestsWithCount", { count: requestCount }))
            : String(i18n.t(`friends.tabs.${item}`));

        return (
          <Pressable
            key={item}
            style={[styles.segment, view === item && styles.activeSegment]}
            onPress={() => onChange(item)}
            testID={`friends-tab-${item}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: view === item }}
          >
            <Text style={[styles.segmentText, view === item && styles.activeSegmentText]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
