import React, { useState, useEffect } from 'react';
import { View, Image, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import i18n from '../lib/i18n';

interface QuestionImageProps {
    uri: string;
    caption?: string;
}

export function QuestionImage({ uri, caption }: QuestionImageProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    if (__DEV__) console.log('[QuestionImage] Rendering with URI:', uri);

    return (
        <View style={styles.imageContainer}>
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            )}
            <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
            />
            {error && (
                <Text style={styles.errorText}>{i18n.t('questionMedia.imageLoadFailed')}</Text>
            )}
            {caption && !error && (
                <Text style={styles.caption}>{caption}</Text>
            )}
        </View>
    );
}

interface QuestionAudioProps {
    uri: string;
}

export function QuestionAudio({ uri }: QuestionAudioProps) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        return () => {
            // Cleanup: unload sound when component unmounts
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const playSound = async () => {
        try {
            setIsLoading(true);
            setError(false);

            // If sound is already loaded, just play/pause
            if (sound) {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    if (isPlaying) {
                        await sound.pauseAsync();
                        setIsPlaying(false);
                    } else {
                        await sound.playAsync();
                        setIsPlaying(true);
                    }
                    setIsLoading(false);
                    return;
                }
            }

            // Load and play new sound
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true },
                (status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                    }
                }
            );

            setSound(newSound);
            setIsPlaying(true);
            setIsLoading(false);
        } catch (err) {
            console.error('Error playing audio:', err);
            setError(true);
            setIsLoading(false);
            setIsPlaying(false);
        }
    };

    return (
        <Pressable
            onPress={playSound}
            style={[styles.audioButton, isPlaying && styles.audioButtonPlaying]}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <>
                    <Text style={styles.audioIcon}>
                        {isPlaying ? '⏸️' : '🔊'}
                    </Text>
                    <Text style={styles.audioText}>
                        {error
                            ? i18n.t('questionMedia.audioLoadFailed')
                            : isPlaying
                                ? i18n.t('questionMedia.playing')
                                : i18n.t('questionMedia.playAudio')}
                    </Text>
                </>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        width: '100%',
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    image: {
        width: '100%',
        height: 200,
        backgroundColor: 'transparent',
    },
    caption: {
        padding: 12,
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        backgroundColor: '#fff',
    },
    errorText: {
        padding: 12,
        fontSize: 14,
        color: '#ef4444',
        textAlign: 'center',
    },
    audioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366f1',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    audioButtonPlaying: {
        backgroundColor: '#4f46e5',
    },
    audioIcon: {
        fontSize: 20,
    },
    audioText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
