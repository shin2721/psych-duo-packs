import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import i18n from '../lib/i18n';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert(error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) Alert.alert(error.message);
        else Alert.alert(i18n.t('auth.verifyEmail'));
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{i18n.t('auth.title')}</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    testID="auth-email"
                    style={styles.input}
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder={i18n.t('auth.emailPlaceholder')}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    testID="auth-password"
                    style={styles.input}
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder={i18n.t('auth.passwordPlaceholder')}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.buttonContainer}>
                <View style={styles.primaryButton}>
                    <Button testID="auth-sign-in" title={loading ? i18n.t('common.loading') : i18n.t('auth.signIn')} disabled={loading} onPress={signInWithEmail} />
                </View>
                <Button testID="auth-sign-up" title={i18n.t('auth.signUp')} disabled={loading} onPress={signUpWithEmail} color="#2e78b7" />
            </View>
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
});
