import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signInAsGuest } = useAuth();

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
        else Alert.alert('Check your inbox for email verification!');
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Psycle Login</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder="email@address.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.buttonContainer}>
                <View style={styles.primaryButton}>
                    <Button title={loading ? "Loading..." : "Sign in"} disabled={loading} onPress={signInWithEmail} />
                </View>
                <Button title="Sign up" disabled={loading} onPress={signUpWithEmail} color="#2e78b7" />
            </View>

            <View style={styles.guestButtonContainer}>
                <Button title="Guest Login (Dev)" onPress={signInAsGuest} color="#888" disabled={loading} />
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
    guestButtonContainer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 20,
    },
});
