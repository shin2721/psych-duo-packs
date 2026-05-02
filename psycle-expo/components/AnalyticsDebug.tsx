/**
 * Analytics Debug Component
 * 
 * Self-Test UI for Analytics v1.3 E2E verification.
 * DEV only by default. Can be enabled in Release for E2E with
 * EXPO_PUBLIC_E2E_ANALYTICS_DEBUG=1 at build time.
 */

import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../lib/theme';
import { useToast } from './ToastProvider';
import { Analytics } from '../lib/analytics';
import {
    getDebugState,
    getDebugReport,
    resetDebugState,
    setSecondLaunchMode,
    type DebugState,
} from '../lib/analytics-debug';
import {
    AnalyticsCountersSection,
    AnalyticsDebugActions,
    AnalyticsDebugHeader,
    AnalyticsEngagementHealthSection,
    AnalyticsEngagementAuditSection,
    AnalyticsRecentEventsSection,
    AnalyticsStatusSection,
} from './analyticsDebugSections';

const isAnalyticsDebugEnabled = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === '1';

// Release builds without E2E flag: render nothing
if (!isAnalyticsDebugEnabled) {
    module.exports = { default: () => null };
}

export default function AnalyticsDebug() {
    const router = useRouter();
    const { showToast } = useToast();
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
                            showToast('Restart the app to begin a fresh E2E test.', 'success');
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
        showToast('Debug report copied to clipboard.', 'success');
    };

    const handleSecondLaunchModeToggle = (value: boolean) => {
        setSecondLaunchMode(value);
        setState(getDebugState());
    };

    return (
        <SafeAreaView style={styles.container}>
            <AnalyticsDebugHeader onClose={() => router.back()} />

            <ScrollView style={styles.content}>
                <AnalyticsStatusSection
                    onToggleSecondLaunchMode={handleSecondLaunchModeToggle}
                    state={state}
                />
                <AnalyticsCountersSection state={state} />
                <AnalyticsEngagementHealthSection state={state} />
                <AnalyticsEngagementAuditSection state={state} />
                <AnalyticsRecentEventsSection state={state} />
            </ScrollView>

            <AnalyticsDebugActions
                isResetting={isResetting}
                onCopyReport={handleCopyReport}
                onReset={() => {
                    void handleReset();
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    content: {
        flex: 1,
    },
});
