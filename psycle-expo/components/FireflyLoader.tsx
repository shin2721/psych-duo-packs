import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import { theme } from "../lib/theme";

export function FireflyLoader() {
    const rotation = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Rotation animation
        const rotate = Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // Pulse animation
        const breathe = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.5, duration: 800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );

        rotate.start();
        breathe.start();

        return () => {
            rotate.stop();
            breathe.stop();
        };
    }, []);

    const spin = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View style={styles.container}>
            {/* Central Orbiting System */}
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                {/* Firefly 1 */}
                <Animated.View
                    style={[
                        styles.firefly,
                        { top: -20, opacity: 0.8, transform: [{ scale: pulse }] },
                    ]}
                />
                {/* Firefly 2 */}
                <Animated.View
                    style={[
                        styles.firefly,
                        { bottom: -20, opacity: 0.6, transform: [{ scale: pulse }] },
                    ]}
                />
            </Animated.View>

            {/* Core Glow */}
            <View style={styles.core} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        height: 60,
    },
    firefly: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#eaff00", // Firefly yellow
        shadowColor: "#eaff00",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
    core: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    }
});
