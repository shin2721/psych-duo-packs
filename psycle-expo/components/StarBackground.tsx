import React, { useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated, Easing } from "react-native";
import { theme } from "../lib/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

// ==================== BACKGROUND STAR COMPONENT ====================
const BackgroundStar = React.memo(function BackgroundStar({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
    // Start with random opacity
    const opacity = useRef(new Animated.Value(0.2 + Math.random() * 0.5)).current;

    useEffect(() => {
        const twinkle = () => {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.1,
                    duration: 2000 + Math.random() * 2000,
                    useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 0.5 + Math.random() * 0.4,
                    duration: 2000 + Math.random() * 2000,
                    useNativeDriver: true
                }),
            ]).start(() => twinkle());
        };

        // Initial delay so they don't all start at once
        const timeout = setTimeout(twinkle, delay);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute",
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: "#fff",
                opacity,
            }}
        />
    );
});

// ==================== SHOOTING STAR COMPONENT ====================
function ShootingStar() {
    const translateX = useRef(new Animated.Value(-100)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const shootStar = () => {
            // Random start position
            const startY = Math.random() * SCREEN_HEIGHT * 0.4; // Top 40%
            translateY.setValue(startY);
            translateX.setValue(-50);

            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: SCREEN_WIDTH + 100, duration: 1000, useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: startY + 200, duration: 1000, useNativeDriver: true }),
                ]),
                Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start(() => {
                // Wait random interval before next shooting star
                setTimeout(shootStar, 8000 + Math.random() * 15000);
            });
        };

        const timeout = setTimeout(shootStar, 3000 + Math.random() * 5000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute",
                width: 60,
                height: 2,
                backgroundColor: "#fff",
                borderRadius: 1,
                shadowColor: "#fff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 8,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate: "25deg" }],
            }}
        />
    );
}

// ==================== WARP STAR COMPONENT (FEVER EFFECT) ====================
const WarpStar = React.memo(function WarpStar({ combo, isWarpingIn }: { combo: number; isWarpingIn: boolean }) {
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scaleX = useRef(new Animated.Value(0.1)).current;
    const rotateVal = useRef(new Animated.Value(0)).current; // Holds the rotation angle

    useEffect(() => {
        let isMounted = true;

        const warp = () => {
            if (!isMounted) return;

            // Start from center
            // Random angle in radians
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.8;

            // Set rotation immediately for this particle
            rotateVal.setValue(angle);

            // Warp speed calculation
            const speed = isWarpingIn
                ? 400 + Math.random() * 200 // Consistent fast speed
                : Math.max(400, 2000 - Math.min(combo, 10) * 160);

            // Reset properties
            translateX.setValue(0);
            opacity.setValue(0);
            scaleX.setValue(0.1);

            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: isWarpingIn ? 50 : 100, useNativeDriver: true }),
                Animated.parallel([
                    Animated.timing(translateX, {
                        toValue: distance, // Move along the rotated X-axis
                        duration: speed,
                        easing: Easing.in(Easing.exp), // Exponential acceleration
                        useNativeDriver: true
                    }),
                    Animated.timing(scaleX, {
                        toValue: isWarpingIn ? 20 : 2 + (combo * 0.2), // Much longer trails for warp
                        duration: speed,
                        useNativeDriver: true
                    })
                ]),
                Animated.timing(opacity, { toValue: 0, duration: isWarpingIn ? 50 : 100, useNativeDriver: true })
            ]).start(() => {
                if (isMounted) {
                    const delay = isWarpingIn
                        ? Math.random() * 20 // More dense stream
                        : Math.max(50, 500 - combo * 40);
                    setTimeout(warp, Math.random() * delay);
                }
            });
        };

        // Initial launch
        setTimeout(warp, Math.random() * (isWarpingIn ? 200 : 1000));

        return () => { isMounted = false; };
    }, [combo, isWarpingIn]);

    // Interpolate rotation value to 'deg' string
    const rotate = rotateVal.interpolate({
        inputRange: [0, Math.PI * 2],
        outputRange: ['0rad', `${Math.PI * 2}rad`]
    });

    return (
        <Animated.View
            style={{
                position: "absolute",
                left: SCREEN_WIDTH / 2,
                top: SCREEN_HEIGHT / 2,
                width: 10, // Base length
                height: 2, // Thinner lines
                borderRadius: 1,
                backgroundColor: isWarpingIn ? "#fff" : (combo > 5 ? "#a5f3fc" : "#fff"),
                opacity,
                transform: [
                    { rotate }, // Rotate first (sets the direction)
                    { translateX }, // Move outward
                    { scaleX } // Stretch along the movement
                ],
                shadowColor: "#fff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isWarpingIn ? 0.8 : 0.5,
                shadowRadius: isWarpingIn ? 4 : 2,
            }}
        />
    );
});

// ==================== CENTER GLOW COMPONENT ====================
function CenterGlow({ isWarpingIn }: { isWarpingIn: boolean }) {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isWarpingIn) {
            // Pulse and expand
            scale.setValue(0.5);
            opacity.setValue(0);

            Animated.sequence([
                Animated.parallel([
                    Animated.timing(opacity, { toValue: 0.8, duration: 200, useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 2.0, duration: 1500, easing: Easing.out(Easing.exp), useNativeDriver: true })
                ]),
                Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })
            ]).start();
        }
    }, [isWarpingIn]);

    return (
        <Animated.View
            style={{
                position: "absolute",
                left: SCREEN_WIDTH / 2 - 100,
                top: SCREEN_HEIGHT / 2 - 100,
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: "#fff", // Bright center light
                opacity,
                transform: [{ scale }],
                shadowColor: "#fff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 50, // Large glow
            }}
        />
    );
}

// ==================== MAIN COMPONENT ====================
export function StarBackground({ combo = 0, warpIn = false }: { combo?: number; warpIn?: boolean }) {
    const [isWarpingIn, setIsWarpingIn] = React.useState(warpIn);
    const flashOpacity = useRef(new Animated.Value(0)).current;

    // Spiral rotation for the whole container
    const containerRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (warpIn) {
            setIsWarpingIn(true);

            // Spiral effect
            containerRotate.setValue(0);
            Animated.timing(containerRotate, {
                toValue: 1,
                duration: 2000,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true
            }).start();

            // Warp in effect lasts 2.0 seconds total
            // Flash at the end (1.8s)

            // 1. Start Flash near the end
            setTimeout(() => {
                Animated.sequence([
                    Animated.timing(flashOpacity, { toValue: 1, duration: 50, useNativeDriver: true }), // Sharp flash
                    Animated.timing(flashOpacity, { toValue: 0, duration: 800, useNativeDriver: true }) // Slow fade
                ]).start();
            }, 1800);

            // 2. End warp state
            const timer = setTimeout(() => setIsWarpingIn(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [warpIn]);

    // Interpolate rotation
    const spin = containerRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'] // Rotate 45 degrees during warp
    });

    // Generate random stats
    const stars = useMemo(() => {
        const count = 50;
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * SCREEN_WIDTH,
            y: Math.random() * SCREEN_HEIGHT,
            size: i < 15 ? 2.5 + Math.random() * 1.5 : 1 + Math.random() * 1.2,
            delay: Math.random() * 3000,
        }));
    }, []);

    // Generate Warp Stars array
    // INCREASED COUNT for density
    const warpStars = useMemo(() => Array.from({ length: 80 }, (_, i) => i), []);

    const activeWarpStars = isWarpingIn
        ? 80 // Max stars during warp
        : (combo < 2 ? 0 : Math.min(30, (combo - 1) * 3));

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Base Dark Background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bg }]} />

            {/* Aurora / Glow effect */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: 'rgba(6, 182, 212, 0.15)',
                        opacity: isWarpingIn ? 0.5 : Math.min(1, Math.max(0, (combo - 5) / 5))
                    }
                ]}
            />

            {/* Rotating Container for Spiral Effect */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }, { scale: isWarpingIn ? 1.1 : 1 }] }]}>
                {/* Static/Twinkling Stars */}
                {stars.map((s) => (
                    <BackgroundStar
                        key={`bg-star-${s.id}`}
                        x={s.x}
                        y={s.y}
                        size={s.size}
                        delay={s.delay}
                    />
                ))}

                {/* Warp Stars */}
                {warpStars.slice(0, activeWarpStars).map((i) => (
                    <WarpStar key={`warp-${i}`} combo={combo} isWarpingIn={isWarpingIn} />
                ))}
            </Animated.View>

            {/* Center Light Source */}
            <CenterGlow isWarpingIn={isWarpingIn} />

            {/* Occasional Shooting Star */}
            <ShootingStar />

            {/* Flash Overlay for Warp End */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: '#fff',
                        opacity: flashOpacity
                    }
                ]}
            />
        </View>
    );
}
