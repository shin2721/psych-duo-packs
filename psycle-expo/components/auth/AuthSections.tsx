import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import i18n from "../../lib/i18n";
import { theme } from "../../lib/theme";

export function AuthCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.header}>{title}</Text>
      {children}
    </View>
  );
}

export function AuthCredentialsSection({
  email,
  password,
  showPassword,
  loading,
  passwordInputRef,
  onChangeEmail,
  onChangePassword,
  onTogglePasswordVisibility,
  onSubmitEditing,
}: {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  passwordInputRef: React.RefObject<TextInput | null>;
  onChangeEmail: (text: string) => void;
  onChangePassword: (text: string) => void;
  onTogglePasswordVisibility: () => void;
  onSubmitEditing: () => void;
}) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        onChangeText={onChangeEmail}
        value={email}
        placeholder={i18n.t("auth.emailPlaceholder")}
        placeholderTextColor={theme.colors.sub}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordInputRef.current?.focus()}
        testID="auth-email-input"
      />
      <View style={styles.passwordField}>
        <TextInput
          ref={passwordInputRef}
          style={[styles.input, styles.passwordInput]}
          onChangeText={onChangePassword}
          value={password}
          secureTextEntry={!showPassword}
          placeholder={i18n.t("auth.passwordPlaceholder")}
          placeholderTextColor={theme.colors.sub}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (!loading) onSubmitEditing();
          }}
          testID="auth-password-input"
        />
        <Pressable
          style={styles.passwordToggle}
          onPress={onTogglePasswordVisibility}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={String(i18n.t(showPassword ? "auth.hidePassword" : "auth.showPassword"))}
          testID="auth-password-visibility-toggle"
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={theme.colors.sub}
          />
        </Pressable>
      </View>
    </View>
  );
}

export function AuthResetButton({
  loading,
  onPress,
}: {
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.linkButton}
      onPress={onPress}
      disabled={loading}
      testID="auth-forgot-password"
      accessibilityRole="button"
      accessibilityLabel={String(i18n.t("auth.forgotPassword"))}
    >
      <Text style={styles.linkButtonText}>{i18n.t("auth.forgotPassword")}</Text>
    </Pressable>
  );
}

export function AuthPrimaryActions({
  loading,
  onSignIn,
  onSignUp,
}: {
  loading: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <View style={styles.buttonContainer}>
      <Pressable
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={onSignIn}
        testID="auth-signin-button"
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>
          {loading ? i18n.t("common.loading") : i18n.t("auth.signIn")}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.secondaryButton, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={onSignUp}
        testID="auth-signup-button"
        accessibilityRole="button"
      >
        <Text style={styles.secondaryButtonText}>{i18n.t("auth.signUp")}</Text>
      </Pressable>
    </View>
  );
}

export function AuthGuestSection({
  visible,
  loading,
  onGuestLogin,
}: {
  visible: boolean;
  loading: boolean;
  onGuestLogin: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.guestButtonContainer}>
      <Pressable
        style={[styles.guestButton, loading && styles.buttonDisabled]}
        onPress={onGuestLogin}
        disabled={loading}
        testID="auth-guest-login"
        accessibilityRole="button"
      >
        <Text style={styles.guestButtonText}>{i18n.t("auth.guestLogin")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: theme.spacing.xl,
    textAlign: "center",
    color: theme.colors.text,
  },
  inputContainer: {
    marginBottom: theme.spacing.sm,
  },
  passwordField: {
    position: "relative",
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
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: theme.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  linkButton: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.lg,
  },
  linkButtonText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    gap: theme.spacing.sm,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "transparent",
    paddingHorizontal: theme.spacing.lg,
  },
  secondaryButtonText: {
    color: theme.colors.primaryLight,
    fontSize: 16,
    fontWeight: "700",
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
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "600",
  },
});
