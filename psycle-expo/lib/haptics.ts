import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function canUseHaptics(): boolean {
    return Platform.OS !== 'web';
}

async function safelyRun(effect: () => Promise<void>): Promise<void> {
    if (!canUseHaptics()) return;
    try {
        await effect();
    } catch (error) {
        console.warn('Haptics not supported', error);
    }
}

export const hapticFeedback = {
    light: async () => {
        await safelyRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    },
    medium: async () => {
        await safelyRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    },
    heavy: async () => {
        await safelyRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    },
    success: async () => {
        await safelyRun(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    },
    error: async () => {
        await safelyRun(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
    },
    selection: async () => {
        await safelyRun(() => Haptics.selectionAsync());
    },
    impact: async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
        await safelyRun(() => Haptics.impactAsync(style));
    },
};
