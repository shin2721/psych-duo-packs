import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleProp, TextStyle, StyleSheet } from 'react-native';

// Highlights text wrapped in 「」 or ** ** with a subtle gold glow animation
function HighlightWord({ text, style }: { text: string, style?: StyleProp<TextStyle> }) {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 2000, useNativeDriver: false }),
                Animated.timing(animatedValue, { toValue: 0, duration: 2000, useNativeDriver: false }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const color = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['#fbbf24', '#fff', '#fbbf24'] // Amber-400 to White to Amber
    });

    const textShadowRadius = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 10]
    });

    return (
        <Animated.Text style={[style, {
            color,
            fontWeight: 'bold',
            textShadowColor: 'rgba(251, 191, 36, 0.6)', // Amber glow
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius
        }]}>
            {text}
        </Animated.Text>
    );
}

export function InsightText({ text, style }: { text: string, style?: StyleProp<TextStyle> }) {
    if (!text) return null;

    // Splits by brackets 「」 or markdown bold ** **
    // Regex logic: Capture the delimiter and content together or just split by location
    // (「[^」]+」) captures the full bracket group
    // (\*\*[^*]+\*\*) captures the full bold group
    const regex = /(「[^」]+」|\*\*[^*]+\*\*)/g;

    const parts = text.split(regex);

    return (
        <Text style={style}>
            {parts.map((part, i) => {
                // Check if this part matches our highlight pattern
                if (part.match(regex)) {
                    // Clean up markers for display
                    const cleanText = part.replace(/^[「\*]+|[」\*]+$/g, '');
                    // Determine bracket type for decoration if needed (e.g. keep brackets?)
                    // Let's keep brackets if they are 「」 because Japanese text expects them,
                    // but maybe highlight the inside.
                    // Actually, highlighting the whole thing including brackets looks better for 「」.
                    // For ** **, we strip them.

                    const isBrackets = part.startsWith('「');
                    const displayText = isBrackets ? part : cleanText;

                    return <HighlightWord key={i} text={displayText} style={style} />;
                }
                return <Text key={`text-${i}`} style={style}>{part}</Text>;
            })}
        </Text>
    );
}
