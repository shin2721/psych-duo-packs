import React from "react";
import { View, StyleSheet } from "react-native";
import { SupportStatePanel } from "../SupportStatePanel";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";
import { ReviewScreenHeader } from "./ReviewSections";

export function MistakesHubStateView({
  testID,
  icon,
  title,
  body,
  ctaLabel,
  onPress,
}: {
  testID: string;
  icon: React.ComponentProps<typeof SupportStatePanel>["icon"];
  title: string;
  body: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  return (
    <View testID={testID} style={styles.statePanelWrap}>
      <SupportStatePanel icon={icon} title={title} body={body} ctaLabel={ctaLabel} onPress={onPress} />
    </View>
  );
}

export function MistakesHubSessionHeader({
  progress,
  onClose,
}: {
  progress: number;
  onClose: () => void;
}) {
  return (
    <ReviewScreenHeader
      title={String(i18n.t("mistakesHubButton.titleAvailable"))}
      icon="close"
      onPress={onClose}
      progress={progress}
      testID="mistakes-hub-close"
      accessibilityLabel={`${i18n.t("common.close")}: ${i18n.t("mistakesHubButton.titleAvailable")}`}
    />
  );
}

const styles = StyleSheet.create({
  statePanelWrap: {
    flex: 1,
  },
});
