import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Pressable } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../components/ToastProvider';
import i18n from '../lib/i18n';
import { theme } from '../lib/theme';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signInAsGuest } = useAuth();
    const { showToast } = useToast();
    const e2eAnalyticsMode = process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === '1';

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) showToast(error.message, 'error');
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) showToast(error.message, 'error');
        else showToast(String(i18n.t('auth.verifyEmail')), 'success');
        setLoading(false);
    }

    async function sendPasswordReset() {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            showToast(String(i18n.t('auth.resetPasswordFailed')), 'error');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
        if (error) {
            showToast(error.message || String(i18n.t('auth.resetPasswordFailed')), 'error');
        } else {
            showToast(String(i18n.t('auth.resetPasswordSent')), 'success');
        }
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.header}>{i18n.t('auth.title')}</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setEmail(text)}
                        value={email}
                        placeholder={i18n.t('auth.emailPlaceholder')}
                        placeholderTextColor={theme.colors.sub}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        testID="auth-email-input"
                    />
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setPassword(text)}
                        value={password}
                        secureTextEntry={true}
                        placeholder={i18n.t('auth.passwordPlaceholder')}
                        placeholderTextColor={theme.colors.sub}
                        autoCapitalize="none"
                        autoCorrect={false}
                        testID="auth-password-input"
                    />
                </View>

                <Pressable
                    style={styles.linkButton}
                    onPress={sendPasswordReset}
                    disabled={loading}
                    testID="auth-forgot-password"
                    accessibilityRole="button"
                    accessibilityLabel={String(i18n.t('auth.forgotPassword'))}
                >
                    <Text style={styles.linkButtonText}>{i18n.t('auth.forgotPassword')}</Text>
                </Pressable>

                <View style={styles.buttonContainer}>
                    <Pressable
                        style={[styles.primaryButton, loading && styles.buttonDisabled]}
                        disabled={loading}
                        onPress={signInWithEmail}
                        testID="auth-signin-button"
                        accessibilityRole="button"
                    >
                        <Text style={styles.primaryButtonText}>
                            {loading ? i18n.t('common.loading') : i18n.t('auth.signIn')}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                        disabled={loading}
                        onPress={signUpWithEmail}
                        testID="auth-signup-button"
                        accessibilityRole="button"
                    >
                        <Text style={styles.secondaryButtonText}>{i18n.t('auth.signUp')}</Text>
                    </Pressable>
                </View>

                {e2eAnalyticsMode && (
                    <View style={styles.guestButtonContainer}>
                        <Pressable
                            style={[styles.guestButton, loading && styles.buttonDisabled]}
                            onPress={signInAsGuest}
                            disabled={loading}
                            testID="auth-guest-login"
                            accessibilityRole="button"
                        >
                            <Text style={styles.guestButtonText}>{i18n.t('auth.guestLogin')}</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.bg,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.line,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
        color: theme.colors.text,
    },
    inputContainer: {
        marginBottom: theme.spacing.sm,
    },
    input: {
        backgroundColor: theme.colors.card,
        color: theme.colors.text,
        height: 52,
        borderColor: theme.colors.line,
        borderWidth: 1,
        marginBottom: theme.spacing.sm,
        paddingHorizontal: 16,
        borderRadius: theme.radius.md,
        fontSize: 16,
    },
    linkButton: {
        alignSelf: 'flex-end',
        marginBottom: theme.spacing.lg,
    },
    linkButtonText: {
        color: theme.colors.accent,
        fontSize: 14,
        fontWeight: '600',
    },
    buttonContainer: {
        gap: theme.spacing.sm,
    },
    primaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.lg,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: 'transparent',
        paddingHorizontal: theme.spacing.lg,
    },
    secondaryButtonText: {
        color: theme.colors.primaryLight,
        fontSize: 16,
        fontWeight: '700',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    guestButtonContainer: {
        marginTop: theme.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: theme.colors.line,
        paddingTop: theme.spacing.lg,
    },
    guestButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.line,
        backgroundColor: theme.colors.card,
        paddingHorizontal: theme.spacing.lg,
    },
    guestButtonText: {
        color: theme.colors.sub,
        fontSize: 15,
        fontWeight: '600',
    },
});
