/**
 * 初回 executed 達成時のお祝いモーダル
 * 
 * 目的：初回の「行動実行」がPsycleの核心価値であることを体感させる
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface FirstExecutedCelebrationProps {
    visible: boolean;
    onDismiss: () => void;
    xpEarned?: number;
}

export function FirstExecutedCelebration({
    visible,
    onDismiss,
    xpEarned = 25,
}: FirstExecutedCelebrationProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Celebration Icon */}
                    <View style={styles.iconContainer}>
                        <Text style={styles.emoji}>🎉</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>すごい！</Text>
                    <Text style={styles.subtitle}>初めての行動を実行しました</Text>

                    {/* Message */}
                    <Text style={styles.message}>
                        Psycleは「知る」だけでなく「やる」アプリ。{'\n'}
                        毎日1つの行動で、心が強くなります。
                    </Text>

                    {/* XP Earned */}
                    <View style={styles.xpContainer}>
                        <Ionicons name="star" size={24} color="#FFD700" />
                        <Text style={styles.xpText}>+{xpEarned} XP</Text>
                    </View>

                    {/* CTA */}
                    <Pressable style={styles.button} onPress={onDismiss}>
                        <Text style={styles.buttonText}>続ける</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },
    iconContainer: {
        marginBottom: 16,
    },
    emoji: {
        fontSize: 64,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: theme.colors.primary,
        fontWeight: '600',
        marginBottom: 16,
    },
    message: {
        fontSize: 14,
        color: theme.colors.sub,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    xpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 24,
        gap: 8,
    },
    xpText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});
