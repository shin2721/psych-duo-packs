import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { Badge } from "../lib/badges";

interface BadgeIconProps {
    badge: Badge;
    isUnlocked: boolean;
    onPress?: () => void;
}

export function BadgeIcon({ badge, isUnlocked, onPress }: BadgeIconProps) {
    return (
        <Pressable
            style={[styles.container, !isUnlocked && styles.locked]}
            onPress={onPress}
            disabled={!isUnlocked}
        >
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
