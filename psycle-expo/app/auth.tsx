import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../components/ToastProvider';
import i18n from '../lib/i18n';

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

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{i18n.t('auth.title')}</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder={i18n.t('auth.emailPlaceholder')}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    testID="auth-email-input"
                />
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder={i18n.t('auth.passwordPlaceholder')}
                    autoCapitalize="none"
                    testID="auth-password-input"
                />
            </View>

            <View style={styles.buttonContainer}>
                <View style={styles.primaryButton}>
                    <Button
                        title={loading ? i18n.t('common.loading') : i18n.t('auth.signIn')}
                        disabled={loading}
                        onPress={signInWithEmail}
                        testID="auth-signin-button"
                    />
                </View>
                <Button
                    title={i18n.t('auth.signUp')}
                    disabled={loading}
                    onPress={signUpWithEmail}
                    color="#2e78b7"
                    testID="auth-signup-button"
                />
            </View>

            {e2eAnalyticsMode && (
                <View style={styles.guestButtonContainer}>
                    <Button
                        title={i18n.t('auth.guestLogin')}
                        onPress={signInAsGuest}
                        color="#888"
                        disabled={loading}
                        testID="auth-guest-login"
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: 'white',
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 10,
        gap: 12,
    },
    primaryButton: {
        marginBottom: 10,
    },
    guestButtonContainer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 20,
    },
});
