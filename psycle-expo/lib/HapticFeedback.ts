import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Centralized Haptic Feedback Manager
 * Handles platform checks (Web vs Native) automatically.
 */
export const HapticFeedback = {
    /**
     * Triggered when a user completes a task successfully.
     * Strong, positive vibration.
     */
    success: async () => {
        if (Platform.OS === 'web') return;
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.warn('Haptics not supported', error);
        }
    },

    /**
     * Triggered when a user makes a mistake.
     * Distinct, "buzz" vibration.
     */
    error: async () => {
        if (Platform.OS === 'web') return;
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (error) {
            console.warn('Haptics not supported', error);
        }
    },

    /**
     * Triggered on light interactions (button press, selection).
     * Subtle "click".
     */
    selection: async () => {
        if (Platform.OS === 'web') return;
        try {
            await Haptics.selectionAsync();
        } catch (error) {
            console.warn('Haptics not supported', error);
        }
    },

    /**
     * Triggered for impactful events (combo, level up).
     * Heavier than selection.
     */
    impact: async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
        if (Platform.OS === 'web') return;
        try {
            await Haptics.impactAsync(style);
        } catch (error) {
            console.warn('Haptics not supported', error);
        }
    },
};
