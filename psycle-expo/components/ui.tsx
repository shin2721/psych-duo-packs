import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../lib/theme";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={[theme.colors.cardEdgeHighlight, "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardEdgeHighlight}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

export function ProgressBar({ value, max, style, color }: { value: number; max: number; style?: StyleProp<ViewStyle>; color?: string }) {
  const percent = Math.min((value / max) * 100, 100);
  const baseColor = color ?? theme.colors.accent;
  const gradientEnd = `${baseColor}BB`;
  return (
    <View style={[styles.progressTrack, style]}>
      <LinearGradient
        colors={[baseColor, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressFill, { width: `${percent}%` }]}
      />
      {/* Glow effect */}
      {percent > 5 && (
        <View
          style={{
            position: "absolute",
            right: `${100 - percent}%`,
            top: -2,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: baseColor,
            shadowColor: baseColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 6,
          }}
        />
      )}
    </View>
  );
}

export function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "text";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  labelStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading || !onPress;
  const variantStyles = buttonVariantStyles[variant];
  const sizeStyles = buttonSizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        sizeStyles.container,
        variantStyles.container,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
        style,
      ]}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator size="small" color={variantStyles.spinnerColor} />
        ) : (
          leftIcon
        )}
        <Text style={[styles.buttonText, sizeStyles.label, variantStyles.label, labelStyle]}>
          {label}
        </Text>
        {!loading && rightIcon}
      </View>
    </Pressable>
  );
}

const spinnerColorMap = {
  primary: "#fff",
  secondary: theme.colors.text,
  text: theme.colors.primaryLight,
} as const;

const buttonVariantStyles = {
  primary: {
    container: {
      backgroundColor: theme.colors.primary,
    },
    label: {
      color: "#fff",
    },
    spinnerColor: spinnerColorMap.primary,
  },
  secondary: {
    container: {
      backgroundColor: theme.colors.surface,
    },
    label: {
      color: theme.colors.text,
    },
    spinnerColor: spinnerColorMap.secondary,
  },
  text: {
    container: {
      backgroundColor: "transparent",
    },
    label: {
      color: theme.colors.primaryLight,
    },
    spinnerColor: spinnerColorMap.text,
  },
} as const;

const buttonSizeStyles = {
  sm: {
    container: {
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    label: theme.typography.buttonSm,
  },
  md: {
    container: {
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    label: theme.typography.buttonMd,
  },
  lg: {
    container: {
      minHeight: 52,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    label: theme.typography.buttonLg,
  },
} as const;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.cardBorder,
    overflow: "hidden",
  },
  cardEdgeHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 18,
  },
  progressTrack: {
    height: 10,
    backgroundColor: theme.colors.line,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 5,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
  },
  pillActive: {
    backgroundColor: theme.colors.accent,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.sub,
  },
  pillTextActive: {
    color: "#fff",
  },
  sectionHeader: {
    ...theme.typography.body,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  button: {
    minWidth: 44,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  buttonText: {
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.88,
  },
});
