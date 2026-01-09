import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";

export default function EditProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [username, setUsername] = useState(user?.email?.split("@")[0] || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ username })
                .eq("id", user.id);

            if (error) throw error;

            Alert.alert("成功", "プロフィールを更新しました。");
            router.back();
        } catch (error: any) {
            Alert.alert("エラー", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>プロフィール編集</Text>
                <Pressable onPress={handleSave} disabled={isSaving}>
                    <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
                        保存
                    </Text>
                </Pressable>
            </View>

            {/* Avatar Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>アバター</Text>
                <View style={styles.avatarGrid}>
                    {["person", "happy", "star", "heart", "flash", "leaf"].map((icon) => (
                        <Pressable key={icon} style={styles.avatarOption}>
                            <Ionicons name={icon as any} size={32} color={theme.colors.primary} />
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Username Input */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ユーザー名</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="ユーザー名を入力"
                    placeholderTextColor={theme.colors.sub}
                />
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.text,
    },
    saveButton: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.primary,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    section: {
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.sub,
        marginBottom: theme.spacing.md,
        textTransform: "uppercase",
    },
    avatarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.md,
    },
    avatarOption: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    input: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        fontSize: 16,
        color: theme.colors.text,
    },
});
