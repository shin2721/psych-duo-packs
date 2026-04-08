import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import {
    AuthCard,
    AuthCredentialsSection,
    AuthGuestSection,
    AuthPrimaryActions,
    AuthResetButton,
} from '../components/auth/AuthSections';
import { useToast } from '../components/ToastProvider';
import i18n from '../lib/i18n';
import { theme } from '../lib/theme';

const MIN_SIGN_UP_PASSWORD_LENGTH = 6;

function mapAuthErrorMessage(message: string): string {
    const normalized = message.trim().toLowerCase();

    if (normalized.includes('invalid login credentials') || normalized.includes('invalid credentials')) {
        return String(i18n.t('auth.errors.invalidCredentials'));
    }

    if (normalized.includes('user already registered')) {
        return String(i18n.t('auth.errors.userAlreadyRegistered'));
    }

    if (
        normalized.includes('email not confirmed') ||
        normalized.includes('email not verified') ||
        normalized.includes('confirm your email')
    ) {
        return String(i18n.t('auth.errors.emailNotConfirmed'));
    }

    if (
        normalized.includes('invalid email') ||
        normalized.includes('unable to validate email') ||
        normalized.includes('email address')
    ) {
        return String(i18n.t('auth.errors.invalidEmail'));
    }

    if (
        normalized.includes('rate limit') ||
        normalized.includes('too many requests') ||
        normalized.includes('security purposes') ||
        normalized.includes('over_email_send_rate_limit')
    ) {
        return String(i18n.t('auth.errors.rateLimited'));
    }

    return message;
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const passwordInputRef = React.useRef<TextInput>(null);
    const { signInAsGuest } = useAuth();
    const { showToast } = useToast();
    const canUseGuestLogin = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === '1';

    function getValidationError(mode: 'signIn' | 'signUp' | 'reset'): string | null {
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            return String(i18n.t('auth.errors.requiredEmail'));
        }

        if (!isValidEmail(trimmedEmail)) {
            return String(i18n.t('auth.errors.invalidEmail'));
        }

        if (mode === 'reset') return null;

        if (!password.trim()) {
            return String(i18n.t('auth.errors.requiredPassword'));
        }

        if (mode === 'signUp' && password.length < MIN_SIGN_UP_PASSWORD_LENGTH) {
            return String(
                i18n.t('auth.errors.passwordTooShort', { count: MIN_SIGN_UP_PASSWORD_LENGTH })
            );
        }

        return null;
    }

    async function signInWithEmail() {
        const validationError = getValidationError('signIn');
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (error) showToast(mapAuthErrorMessage(error.message), 'error');
        setLoading(false);
    }

    async function signUpWithEmail() {
        const validationError = getValidationError('signUp');
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
        });

        if (error) showToast(mapAuthErrorMessage(error.message), 'error');
        else showToast(String(i18n.t('auth.verifyEmail')), 'success');
        setLoading(false);
    }

    async function sendPasswordReset() {
        const validationError = getValidationError('reset');
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        const trimmedEmail = email.trim();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
        if (error) {
            showToast(
                error.message ? mapAuthErrorMessage(error.message) : String(i18n.t('auth.resetPasswordFailed')),
                'error'
            );
        } else {
            showToast(String(i18n.t('auth.resetPasswordSent')), 'success');
        }
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <AuthCard title={String(i18n.t('auth.title'))}>
                <AuthCredentialsSection
                    email={email}
                    password={password}
                    showPassword={showPassword}
                    loading={loading}
                    passwordInputRef={passwordInputRef}
                    onChangeEmail={setEmail}
                    onChangePassword={setPassword}
                    onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
                    onSubmitEditing={() => {
                        void signInWithEmail();
                    }}
                />
                <AuthResetButton loading={loading} onPress={() => { void sendPasswordReset(); }} />
                <AuthPrimaryActions
                    loading={loading}
                    onSignIn={() => { void signInWithEmail(); }}
                    onSignUp={() => { void signUpWithEmail(); }}
                />
                <AuthGuestSection
                    visible={canUseGuestLogin}
                    loading={loading}
                    onGuestLogin={() => { void signInAsGuest(); }}
                />
            </AuthCard>
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
});
