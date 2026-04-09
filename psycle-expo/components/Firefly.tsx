import React, { useEffect } from 'react';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
    cancelAnimation,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
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
    style?: StyleProp<ViewStyle>;
}

export const Firefly = ({ state = 'idle', scale = 1, style }: FireflyProps) => {
    // Shared Values
    const bodyTranslateY = useSharedValue(0);
    const bodyScale = useSharedValue(1);
    const wingRotation = useSharedValue(0);
    const headRotation = useSharedValue(0);
    const headTranslateY = useSharedValue(0);
    const armRotation = useSharedValue(0);

    useEffect(() => {
        [bodyTranslateY, bodyScale, wingRotation, headRotation, armRotation].forEach(cancelAnimation);

        if (state === 'happy') {
            bodyTranslateY.value = withSequence(
                withTiming(-20, { duration: 200 }),
                withRepeat(
                    withSequence(
                        withTiming(-30, { duration: 300, easing: Easing.out(Easing.quad) }),
                        withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
                    ),
                    2,
                    true
                )
            );
            bodyScale.value = withRepeat(
                withSequence(
                    withTiming(1.12, { duration: 250, easing: Easing.out(Easing.quad) }),
                    withTiming(1, { duration: 250, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
            wingRotation.value = withRepeat(
                withSequence(
                    withTiming(45, { duration: 60, easing: Easing.linear }),
                    withTiming(-30, { duration: 60, easing: Easing.linear })
                ),
                -1,
                true
            );
            headRotation.value = withRepeat(
                withSequence(
                    withTiming(10, { duration: 250, easing: Easing.inOut(Easing.quad) }),
                    withTiming(-10, { duration: 250, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
            armRotation.value = withRepeat(
                withSequence(
                    withTiming(18, { duration: 250, easing: Easing.inOut(Easing.quad) }),
                    withTiming(-18, { duration: 250, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
            return;
        }

        if (state === 'thinking') {
            bodyTranslateY.value = withRepeat(
                withSequence(
                    withTiming(-2, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
                    withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
            bodyScale.value = withRepeat(
                withSequence(
                    withTiming(1.01, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
                    withTiming(0.99, { duration: 1800, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
            wingRotation.value = withRepeat(
                withSequence(
                    withTiming(8, { duration: 180, easing: Easing.linear }),
                    withTiming(-4, { duration: 180, easing: Easing.linear })
                ),
                -1,
                true
            );
            headRotation.value = withRepeat(
                withSequence(
                    withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
                    withTiming(6, { duration: 2200, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
            armRotation.value = withRepeat(
                withSequence(
                    withTiming(4, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
                    withTiming(-2, { duration: 2200, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            );
            return;
        }

        bodyTranslateY.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );
        bodyScale.value = withRepeat(
            withSequence(
                withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );
        wingRotation.value = withRepeat(
            withSequence(
                withTiming(15, { duration: 100, easing: Easing.linear }),
                withTiming(-10, { duration: 100, easing: Easing.linear })
            ),
            -1,
            true
        );
        headRotation.value = withRepeat(
            withSequence(
                withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
                withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );
        armRotation.value = withRepeat(
            withSequence(
                withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
                withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );
    }, [state]);

    // Animated Styles
    const rBodyStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: bodyTranslateY.value },
                { scale: bodyScale.value },
            ],
        } satisfies ViewStyle;
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
        } satisfies ImageStyle;
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
        } satisfies ImageStyle;
    });

    const rHeadStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: 80 }, // Pivot at neck (approx bottom of head)
                { rotate: `${headRotation.value}deg` },
                { translateY: -80 },
            ],
        } satisfies ImageStyle;
    });

    const rLeftArmStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: -10 },
                { rotate: `${armRotation.value}deg` },
                { translateY: 10 },
            ],
        } satisfies ImageStyle;
    });

    const rRightArmStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: -10 },
                { rotate: `${-armRotation.value}deg` },
                { translateY: 10 },
            ],
        } satisfies ImageStyle;
    });


    return (
        <View style={[styles.container, style, { transform: [{ scale }] }]}>
            <Animated.View style={[styles.mainWrapper, rBodyStyle]}>
                {/* Wings (Behind Body) */}
                <Animated.Image source={IMG_WING_LEFT} style={[styles.wingLeft, rLeftWingStyle]} resizeMode="contain" />
                <Animated.Image source={IMG_WING_RIGHT} style={[styles.wingRight, rRightWingStyle]} resizeMode="contain" />

                {/* Body */}
                <Animated.Image source={IMG_BODY} style={styles.body} resizeMode="contain" />

                {/* Arms */}
                <Animated.Image source={IMG_ARM_LEFT} style={[styles.armLeft, rLeftArmStyle]} resizeMode="contain" />
                <Animated.Image source={IMG_ARM_RIGHT} style={[styles.armRight, rRightArmStyle]} resizeMode="contain" />

                {/* Head (In Front) */}
                <Animated.Image source={IMG_HEAD} style={[styles.head, rHeadStyle]} resizeMode="contain" />
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
