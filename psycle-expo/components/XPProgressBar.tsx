import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../lib/theme';

interface XPProgressBarProps {
    currentXP: number;
    currentLevel: number;
}

// Calculate XP needed for each level (exponential growth)
function getXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function XPProgressBar({ currentXP, currentLevel }: XPProgressBarProps) {
    const xpForCurrentLevel = getXPForLevel(currentLevel);
    const xpForNextLevel = getXPForLevel(currentLevel + 1);
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;

    const progress = Math.min(Math.max(xpInCurrentLevel / xpNeededForNextLevel, 0), 1);

    const animatedWidth = useRef(new Animated.Value(progress * 100)).current;

    useEffect(() => {
        Animated.spring(animatedWidth, {
            toValue: progress * 100,
            useNativeDriver: false,
            friction: 8,
            tension: 40,
        }).start();
    }, [progress]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Lv {currentLevel}</Text>
                </View>
                <Text style={styles.xpText}>
                    {xpInCurrentLevel} / {xpNeededForNextLevel} XP
                </Text>
            </View>

            <View style={styles.progressBarContainer}>
                <Animated.View
                    style={[
                        styles.progressBarFill,
                        {
                            width: animatedWidth.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    levelBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    xpText: {
        fontSize: 14,
        color: theme.colors.sub,
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: theme.colors.line,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
});
