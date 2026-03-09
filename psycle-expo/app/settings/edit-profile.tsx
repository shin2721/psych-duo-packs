import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { useToast } from "../../components/ToastProvider";
import { supabase } from "../../lib/supabase";
import { PROFILE_AVATAR_ICONS, isProfileAvatarIcon, type ProfileAvatarIcon } from "../../lib/avatarIcons";
import i18n from "../../lib/i18n";

export default function EditProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [username, setUsername] = useState(user?.email?.split("@")[0] || "");
    const [selectedAvatar, setSelectedAvatar] = useState<ProfileAvatarIcon>("person");
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (!user?.id) return;

        let cancelled = false;

        const loadProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("username, avatar_icon")
                    .eq("id", user.id)
                    .single();

                if (error) throw error;
                if (cancelled || !data) return;

                if (typeof data.username === "string" && data.username.length > 0) {
                    setUsername(data.username);
                }

                if (isProfileAvatarIcon(data.avatar_icon)) {
                    setSelectedAvatar(data.avatar_icon);
                }
            } catch (error) {
                console.error("Failed to load profile settings:", error);
            }
        };

        void loadProfile();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ username: username.trim(), avatar_icon: selectedAvatar })
                .eq("id", user.id);

            if (error) throw error;

            showToast(String(i18n.t("editProfile.successMessage")), "success");
            router.back();
        } catch (error: any) {
            showToast(String(error.message), "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backButton}
                    testID="edit-profile-close"
                    accessibilityRole="button"
                    accessibilityLabel={String(i18n.t("common.close"))}
                >
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>{i18n.t("profile.editButton")}</Text>
                <Pressable
                    onPress={handleSave}
                    disabled={isSaving}
                    testID="edit-profile-save"
                    accessibilityRole="button"
                    accessibilityLabel={String(i18n.t("common.save"))}
                    accessibilityState={{ disabled: isSaving }}
                >
                    <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
                        {i18n.t("common.save")}
                    </Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Avatar Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("editProfile.avatar")}</Text>
                    <View style={styles.sectionCard}>
                        <View style={styles.avatarGrid}>
                            {PROFILE_AVATAR_ICONS.map((icon, index) => {
                                const isSelected = selectedAvatar === icon;
                                return (
                                <Pressable
                                    key={icon}
                                    style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                                    onPress={() => setSelectedAvatar(icon)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${i18n.t("editProfile.avatar")} ${index + 1}`}
                                    accessibilityState={{ selected: isSelected }}
                                >
                                    <Ionicons name={icon as any} size={32} color={theme.colors.primary} />
                                </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Username Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("editProfile.username")}</Text>
                    <View style={styles.sectionCard}>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder={String(i18n.t("editProfile.usernamePlaceholder"))}
                            placeholderTextColor={theme.colors.sub}
                            testID="edit-profile-username"
                            accessibilityLabel={String(i18n.t("editProfile.username"))}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xl,
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
    sectionCard: {
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.line,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
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
        backgroundColor: theme.colors.card,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    avatarOptionSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: "rgba(58, 134, 255, 0.12)",
    },
    input: {
        backgroundColor: theme.colors.card,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.line,
    },
});
