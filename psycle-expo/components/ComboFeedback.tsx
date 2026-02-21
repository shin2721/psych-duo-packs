import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../lib/theme';
import i18n from '../lib/i18n';
import { getComboMilestone } from '../lib/comboMilestone';

interface Props {
    combo: number;
    visible: boolean;
}

export function ComboFeedback({ combo, visible }: Props) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && combo > 1) {
            // Reset values
            scaleAnim.setValue(0.5);
            opacityAnim.setValue(0);

            // Pop in animation
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    tension: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Fade out
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [combo, visible]);

    // Combo break animation (when combo resets to 0 from a high number)
    // Note: This logic would need previous combo state to trigger correctly, 
    // for now we focus on the positive feedback.

    if (!visible || combo < 2) return null;

    const milestone = getComboMilestone(combo);
    const milestoneText = (() => {
        if (milestone === 10) return String(i18n.t('lesson.combo.milestone10'));
        if (milestone === 5) return String(i18n.t('lesson.combo.milestone5'));
        if (milestone === 3) return String(i18n.t('lesson.combo.milestone3'));
        return null;
    })();

    // Dynamic color based on combo count
    const getComboColor = (count: number) => {
        if (count >= 10) return '#f59e0b'; // Gold
        if (count >= 5) return '#22d3ee';  // Cyan
        return '#22c55e';                  // Green
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <Text style={[styles.text, { color: getComboColor(combo) }]}>
                {milestoneText ? `${milestoneText}  COMBO x${combo}!` : `COMBO x${combo}!`}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60, // Adjust based on header height
        alignSelf: 'center',
        zIndex: 100,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    text: {
        fontSize: 24,
        fontWeight: '900',
        fontStyle: 'italic',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});
