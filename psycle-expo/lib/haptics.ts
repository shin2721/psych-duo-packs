import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const hapticFeedback = {
    light: async () => {
        if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    },
    medium: async () => {
        if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    },
    heavy: async () => {
        if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    },
    success: async () => {
        if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    },
    error: async () => {
        if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    },
};
