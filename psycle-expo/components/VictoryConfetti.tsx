import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

// Random helper
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Vibrant colors for confetti
const COLORS = [
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#eab308', // Yellow
    '#22c55e', // Green
    '#8b5cf6', // Violet
    '#f43f5e', // Rose
    '#06b6d4', // Cyan
];

interface ParticleProps {
    delay: number;
}

function Particle({ delay }: ParticleProps) {
    // Animation values
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // Random properties
    const [color] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
    const [size] = useState(() => randomRange(6, 12));

    useEffect(() => {
        // Determine explosion physics
        const angle = randomRange(0, Math.PI * 2);
        const velocity = randomRange(100, 300); // Explosion power

        const endX = Math.cos(angle) * velocity;
        const endY = Math.sin(angle) * velocity;

        // Add some gravity effect to Y
        const gravityY = endY + randomRange(100, 400);

        const explosion = Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: endX,
                    duration: 1200,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(translateY, {
                    toValue: gravityY, // Fall down
                    duration: 1200,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.sequence([
                    // Pop in
                    Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
                    // Slow fade out
                    Animated.timing(scale, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 1100, useNativeDriver: true }),
                ])
            ])
        ]);

        explosion.start();
    }, []);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
                top: height * 0.3, // Explode from somewhat top-center
                left: width * 0.5,
            }}
        />
    );
}

export function VictoryConfetti() {
    const [particles] = useState(() => Array.from({ length: 50 }).map((_, i) => i));

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((i) => (
                <Particle key={i} delay={i * 10} /> // Stagger start slightly
            ))}
        </View>
    );
}
