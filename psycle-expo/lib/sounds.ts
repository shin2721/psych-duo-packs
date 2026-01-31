import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const SOUND_URLS = {
    correct: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hightech_beep.ogg',
    incorrect: 'https://actions.google.com/sounds/v1/cartoon/descending_whistle.ogg',
    fever: 'https://actions.google.com/sounds/v1/science_fiction/scifi_laser.ogg', // Tentative for fever start
    levelUp: 'https://actions.google.com/sounds/v1/cartoon/harp_strum.ogg',
};

type SoundType = keyof typeof SOUND_URLS;

const soundCache: Record<string, Audio.Sound> = {};

export const sounds = {
    play: async (type: SoundType) => {
        if (Platform.OS === 'web') return;

        try {
            // Configure audio mode (important for iOS)
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri: SOUND_URLS[type] },
                { shouldPlay: true, volume: type === 'incorrect' ? 0.3 : 0.5 }
            );

            // Cleanup
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });

        } catch (error) {
            console.log('Error playing sound:', error);
        }
    },

    // Future: Preload sounds if latency is high
    preload: async () => {
        // ...
    }
};
