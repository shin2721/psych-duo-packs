import React, { useRef } from 'react';
import { TouchableWithoutFeedback, Animated, ViewStyle, StyleProp, GestureResponderEvent } from 'react-native';
import { hapticFeedback } from '../lib/haptics';

interface Props {
    onPress: (event: GestureResponderEvent) => void;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    scaleTo?: number;
    disabled?: boolean;
}

export function AnimatedButton({ onPress, children, style, scaleTo = 0.96, disabled = false }: Props) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (disabled) return;
        hapticFeedback.light();
        Animated.spring(scale, {
            toValue: scaleTo,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    const handlePress = (e: GestureResponderEvent) => {
        if (disabled) return;
        onPress(e);
    };

    return (
        <TouchableWithoutFeedback
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={disabled}
        >
            <Animated.View style={[style, { transform: [{ scale }] }]}>
                {children}
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}
