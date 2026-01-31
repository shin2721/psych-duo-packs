import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../lib/theme';
import * as Haptics from 'expo-haptics';

interface XPGainAnimationProps {
    amount: number;
    onComplete?: () => void;
}

export function XPGainAnimation({ amount, onComplete }: XPGainAnimationProps) {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Trigger haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Animate the XP gain
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -60,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1.2,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onComplete?.();
        });
    }, []);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }, { scale }],
                    opacity,
                },
            ]}
        >
            <Text style={styles.text}>+{amount} XP</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 1000,
    },
    text: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.primary,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
