import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { Analytics } from "../../lib/analytics";
import i18n from "../../lib/i18n";

export default function WelcomeScreen() {
    const router = useRouter();
    
    // onboarding_start イベント（オンボーディング入口で1回のみ発火）
    const hasTrackedStartRef = useRef(false);
    useEffect(() => {
        if (!hasTrackedStartRef.current) {
            hasTrackedStartRef.current = true;
            Analytics.track('onboarding_start');
        }
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={["#1a1b2e", "#2d1b3d"]}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    {/* Logo/Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="bulb" size={80} color={theme.colors.primary} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Psycle</Text>
                    <Text style={styles.subtitle} testID="onboarding-subtitle">{i18n.t("onboarding.subtitle")}</Text>

                    {/* Value Propositions */}
                    <View style={styles.features}>
                        <FeatureItem
                            icon="school"
                            text={i18n.t("onboarding.features.evidenceBased")}
                        />
                        <FeatureItem
                            icon="game-controller"
                            text={i18n.t("onboarding.features.gameBased")}
                        />
                        <FeatureItem
                            icon="trending-up"
                            text={i18n.t("onboarding.features.personalized")}
                        />
                    </View>

                    {/* CTA Button */}
                    <Pressable
                        style={styles.button}
                        onPress={() => router.push("/onboarding/interests")}
                        testID="onboarding-start"
                    >
                        <Text style={styles.buttonText}>{i18n.t("onboarding.start")}</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </Pressable>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

function FeatureItem({ icon, text }: { icon: any; text: string }) {
    return (
        <View style={styles.featureItem}>
            <Ionicons name={icon} size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1b2e",
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.xl,
    },
    iconContainer: {
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: 48,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: 18,
        color: theme.colors.sub,
        marginBottom: theme.spacing.xl * 2,
        textAlign: "center",
    },
    features: {
        width: "100%",
        marginBottom: theme.spacing.xl * 2,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
    },
    featureText: {
        fontSize: 16,
        color: "#fff",
        marginLeft: theme.spacing.md,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl * 2,
        borderRadius: theme.radius.lg,
        gap: theme.spacing.sm,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
});
