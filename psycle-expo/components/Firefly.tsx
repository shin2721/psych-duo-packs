import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    withDelay,
} from 'react-native-reanimated';

// Import assets
const IMG_BODY = require('../assets/images/firefly/firefly_body.png');
const IMG_HEAD = require('../assets/images/firefly/firefly_head.png');
const IMG_WING_LEFT = require('../assets/images/firefly/firefly_wing_left.png');
const IMG_WING_RIGHT = require('../assets/images/firefly/firefly_wing_right.png');
const IMG_ARM_LEFT = require('../assets/images/firefly/firefly_arm_left.png');
const IMG_ARM_RIGHT = require('../assets/images/firefly/firefly_arm_right.png');

export type FireflyState = 'idle' | 'happy' | 'thinking';

interface FireflyProps {
    state?: FireflyState;
    scale?: number;
    style?: any;
}

export const Firefly = ({ state = 'idle', scale = 1, style }: FireflyProps) => {
    // Shared Values
    const bodyTranslateY = useSharedValue(0);
    const bodyScale = useSharedValue(1);
    const wingRotation = useSharedValue(0);
    const headRotation = useSharedValue(0);
    const headTranslateY = useSharedValue(0);
    const armRotation = useSharedValue(0);

    // State Reactions
    useEffect(() => {
        if (state === 'happy') {
            // Happy Jump / Flip
            bodyTranslateY.value = withSequence(
                withTiming(-20, { duration: 200 }),
                withRepeat(
                    withSequence(
                        withTiming(-30, { duration: 300, easing: Easing.out(Easing.quad) }),
                        withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
                    ),
                    2, // Jump twice
                    true
                )
            );
            // Spin
            wingRotation.value = withRepeat(withTiming(45, { duration: 50 }), -1, true); // Flap super fast
        } else if (state === 'idle') {
            // Restore Breathing
            bodyTranslateY.value = withRepeat(
                withSequence(
                    withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                    withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
        }
    }, [state]);

    useEffect(() => {
        // Initial Breathing (start immediately if idle)
        if (state === 'idle') {
            bodyTranslateY.value = withRepeat(
                withSequence(
                    withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                    withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
        }
        // ... (other body parts omitted for brevity, keeping existing random drifts)
        // Ideally we reset all animations on state change, but mixing is fine for now.

        bodyScale.value = withRepeat(
            withSequence(
                withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );

        // Wing Flapping (Fast)
        wingRotation.value = withRepeat(
            withSequence(
                withTiming(15, { duration: 100, easing: Easing.linear }),
                withTiming(-10, { duration: 100, easing: Easing.linear })
            ),
            -1,
            true
        );

        // Head Bobbing/Tilting (Slower, slightly offset from body)
        headRotation.value = withRepeat(
            withSequence(
                withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
                withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );

        // Arms waving slightly
        armRotation.value = withRepeat(
            withSequence(
                withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
                withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );
    }, []);

    // Animated Styles
    const rBodyStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: bodyTranslateY.value },
                { scale: bodyScale.value },
            ],
        } as any;
    });

    const rLeftWingStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: 40 }, // Pivot Offset X (approx) - adjust based on visual
                { translateY: 40 }, // Pivot Offset Y
                { rotate: `${wingRotation.value}deg` },
                { translateX: -40 },
                { translateY: -40 },
            ],
        } as any;
    });

    const rRightWingStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: -40 }, // Mirror pivot
                { translateY: 40 },
                { rotate: `${-wingRotation.value}deg` }, // Opposite rotation
                { translateX: 40 },
                { translateY: -40 },
            ],
        } as any;
    });

    const rHeadStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: 80 }, // Pivot at neck (approx bottom of head)
                { rotate: `${headRotation.value}deg` },
                { translateY: -80 },
            ],
        } as any;
    });

    const rLeftArmStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: -10 },
                { rotate: `${armRotation.value}deg` },
                { translateY: 10 },
            ],
        } as any;
    });

    const rRightArmStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: -10 },
                { rotate: `${-armRotation.value}deg` },
                { translateY: 10 },
            ],
        } as any;
    });


    return (
        <View style={[styles.container, style, { transform: [{ scale }] }]}>
            <Animated.View style={[styles.mainWrapper, rBodyStyle] as any}>
                {/* Wings (Behind Body) */}
                <Animated.Image source={IMG_WING_LEFT} style={[styles.wingLeft, rLeftWingStyle] as any} resizeMode="contain" />
                <Animated.Image source={IMG_WING_RIGHT} style={[styles.wingRight, rRightWingStyle] as any} resizeMode="contain" />

                {/* Body */}
                <Animated.Image source={IMG_BODY} style={styles.body} resizeMode="contain" />

                {/* Arms */}
                <Animated.Image source={IMG_ARM_LEFT} style={[styles.armLeft, rLeftArmStyle] as any} resizeMode="contain" />
                <Animated.Image source={IMG_ARM_RIGHT} style={[styles.armRight, rRightArmStyle] as any} resizeMode="contain" />

                {/* Head (In Front) */}
                <Animated.Image source={IMG_HEAD} style={[styles.head, rHeadStyle] as any} resizeMode="contain" />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'rgba(255,0,0,0.1)', // Debug
    },
    mainWrapper: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    body: {
        width: 100,
        height: 100,
        zIndex: 10,
    },
    head: {
        width: 90,
        height: 90,
        position: 'absolute',
        top: -20, // Adjust to overlap neck
        zIndex: 20,
    },
    wingLeft: {
        width: 80,
        height: 80,
        position: 'absolute',
        left: -30,
        top: 20,
        zIndex: 5,
    },
    wingRight: {
        width: 80,
        height: 80,
        position: 'absolute',
        right: -30,
        top: 20,
        zIndex: 5,
    },
    armLeft: {
        width: 30,
        height: 30,
        position: 'absolute',
        left: 10,
        top: 60,
        zIndex: 15,
    },
    armRight: {
        width: 30,
        height: 30,
        position: 'absolute',
        right: 10,
        top: 60,
        zIndex: 15,
    }
});
