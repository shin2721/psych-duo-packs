import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { Badge } from "../lib/badges";
import i18n from "../lib/i18n";
import { useToast } from "./ToastProvider";

interface BadgeIconProps {
    badge: Badge;
    isUnlocked: boolean;
    onPress?: () => void;
}

export function BadgeIcon({ badge, isUnlocked, onPress }: BadgeIconProps) {
    const { showToast } = useToast();
    const accessibilityLabel = isUnlocked
        ? badge.name
        : `${badge.name} ${String(i18n.t("badges.accessibility.lockedSuffix"))}`;
    const lockedAccessibilityHint = String(i18n.t("badges.accessibility.lockedHint"));
    const lockedMessage = String(i18n.t("badges.accessibility.lockedMessage"));
    const accessibilityHint = isUnlocked ? undefined : lockedAccessibilityHint;
    const isInteractive = !isUnlocked || Boolean(onPress);

    const handlePress = React.useCallback(() => {
        if (isUnlocked) {
            onPress?.();
            return;
        }

        showToast(lockedMessage);
    }, [isUnlocked, lockedMessage, onPress, showToast]);

    const content = (
        <>
            <View style={[styles.iconContainer, !isUnlocked && styles.lockedIcon]}>
                <Ionicons
                    name={badge.icon as any}
                    size={32}
                    color={isUnlocked ? theme.colors.primary : theme.colors.sub}
                />
            </View>
            <Text style={[styles.name, !isUnlocked && styles.lockedText]} numberOfLines={2}>
                {badge.name}
            </Text>
        </>
    );

    if (!isInteractive) {
        return (
            <View
                style={styles.container}
                accessible
                accessibilityRole="image"
                accessibilityLabel={accessibilityLabel}
            >
                {content}
            </View>
        );
    }

    return (
        <Pressable
            style={[styles.container, !isUnlocked && styles.locked]}
            onPress={isInteractive ? handlePress : undefined}
            accessible
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
        >
            {content}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        width: 80,
    },
    locked: {
        opacity: 0.4,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: theme.spacing.xs,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    lockedIcon: {
        borderColor: theme.colors.line,
    },
    name: {
        fontSize: 11,
        color: theme.colors.text,
        textAlign: "center",
    },
    lockedText: {
        color: theme.colors.sub,
    },
});
