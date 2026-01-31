/**
 * Analytics Debug Component
 * 
 * Self-Test UI for Analytics v1.3 E2E verification.
 * DEV only - completely hidden in Release builds.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../lib/theme';
import { Analytics } from '../lib/analytics';
import {
    getDebugState,
    getDebugReport,
    resetDebugState,
    setSecondLaunchMode,
    type DebugState,
} from '../lib/analytics-debug';

// Release builds: render nothing
if (!__DEV__) {
    module.exports = { default: () => null };
}

export default function AnalyticsDebug() {
    const router = useRouter();
    const [state, setState] = useState<DebugState>(getDebugState());
    const [isResetting, setIsResetting] = useState(false);

    // Poll for updates every 1 second
    useEffect(() => {
        const interval = setInterval(() => {
            setState(getDebugState());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleReset = async () => {
        Alert.alert(
            'Reset Analytics Debug',
            'Clear all debug data and reset Analytics state for E2E re-test?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        setIsResetting(true);
                        try {
                            // Reset debug state
                            resetDebugState();
                            // Reset Analytics state
                            await Analytics.resetAnalyticsStateForDebug(false);
                            setState(getDebugState());
                            Alert.alert('Reset Complete', 'Restart the app to begin a fresh E2E test.');
                        } finally {
                            setIsResetting(false);
                        }
                    },
                },
            ]
        );
    };

    const handleCopyReport = async () => {
        const report = getDebugReport();
        await Clipboard.setStringAsync(report);
        Alert.alert('Copied', 'Debug report copied to clipboard.');
    };

    const handleSecondLaunchModeToggle = (value: boolean) => {
        setSecondLaunchMode(value);
        setState(getDebugState());
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Analytics Debug</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Status Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>STATUS</Text>

                    <View style={styles.statusCard}>
                        <View style={styles.statusRow}>
                            <Text style={styles.label}>Result:</Text>
                            <View style={[
                                styles.badge,
                                state.passed ? styles.passBadge : styles.failBadge
                            ]} testID="analytics-status">
                                <Text style={styles.badgeText}>
                                    {state.passed ? '✅ PASS' : '❌ FAIL'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.statusRow}>
                            <Text style={styles.label}>anonId:</Text>
                            <Text style={styles.value} numberOfLines={1} testID="analytics-anonid">
                                {state.anonId}
                            </Text>
                        </View>

                        <View style={styles.statusRow}>
                            <Text style={styles.label}>Second Launch Mode:</Text>
                            <Switch
                                value={state.secondLaunchMode}
                                onValueChange={handleSecondLaunchModeToggle}
                                trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
                                thumbColor="#fff"
                            />
                        </View>

                        {state.failures.length > 0 && (
                            <View style={styles.failuresContainer} testID="analytics-failures">
                                <Text style={styles.failuresTitle}>Failures:</Text>
                                {state.failures.map((f, i) => (
                                    <Text key={i} style={styles.failureText}>• {f}</Text>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Counters Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>EVENT COUNTERS</Text>

                    <View style={styles.countersGrid}>
                        {Object.entries(state.counters).map(([name, count]) => (
                            <View key={name} style={styles.counterItem}>
                                <Text style={styles.counterValue} testID={`count-${name}`}>{count}</Text>
                                <Text style={styles.counterName}>{name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recent Events Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>RECENT EVENTS (Last 10)</Text>

                    <View style={styles.eventsContainer}>
                        {state.events.slice(0, 10).map((event, i) => (
                            <View key={i} style={styles.eventRow}>
                                <View style={[
                                    styles.statusDot,
                                    event.status === 'sent' && styles.sentDot,
                                    event.status === 'queued' && styles.queuedDot,
                                    event.status === 'failed' && styles.failedDot,
                                    event.status === 'system' && styles.systemDot,
                                ]} />
                                <View style={styles.eventInfo}>
                                    <Text style={styles.eventName}>{event.name}</Text>
                                    <Text style={styles.eventMeta}>
                                        {event.status} • {event.timestamp.split('T')[1]?.slice(0, 8)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {state.events.length === 0 && (
                            <Text style={styles.emptyText}>No events recorded yet</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <Pressable
                    style={[styles.actionButton, styles.resetButton]}
                    onPress={handleReset}
                    disabled={isResetting}
                    testID="analytics-reset"
                >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>
                        {isResetting ? 'Resetting...' : 'Reset'}
                    </Text>
                </Pressable>

                <Pressable style={[styles.actionButton, styles.copyButton]} onPress={handleCopyReport} testID="analytics-copy-report">
                    <Ionicons name="copy" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Copy Report</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.sub,
        marginBottom: theme.spacing.sm,
        letterSpacing: 1,
    },
    statusCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.md,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    label: {
        fontSize: 14,
        color: theme.colors.sub,
    },
    value: {
        fontSize: 14,
        color: theme.colors.text,
        flex: 1,
        textAlign: 'right',
        marginLeft: theme.spacing.sm,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    passBadge: {
        backgroundColor: '#22c55e',
    },
    failBadge: {
        backgroundColor: '#ef4444',
    },
    badgeText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    failuresContainer: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.sm,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
    failuresTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ef4444',
        marginBottom: 4,
    },
    failureText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 2,
    },
    countersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.sm,
    },
    counterItem: {
        width: '33.33%',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    counterValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    counterName: {
        fontSize: 10,
        color: theme.colors.sub,
        marginTop: 2,
        textAlign: 'center',
    },
    eventsContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.sm,
    },
    eventRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: theme.spacing.sm,
        backgroundColor: theme.colors.sub,
    },
    sentDot: {
        backgroundColor: '#22c55e',
    },
    queuedDot: {
        backgroundColor: '#f59e0b',
    },
    failedDot: {
        backgroundColor: '#ef4444',
    },
    systemDot: {
        backgroundColor: '#3b82f6',
    },
    eventInfo: {
        flex: 1,
    },
    eventName: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '500',
    },
    eventMeta: {
        fontSize: 12,
        color: theme.colors.sub,
        marginTop: 2,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.sub,
        textAlign: 'center',
        paddingVertical: theme.spacing.lg,
    },
    actions: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.line,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    resetButton: {
        backgroundColor: '#ef4444',
    },
    copyButton: {
        backgroundColor: theme.colors.primary,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
