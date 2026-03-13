import React from "react";
import { StyleSheet, Text, View } from "react-native";
import i18n from "../lib/i18n";
import { theme } from "../lib/theme";

export type InlineToastTone = "default" | "success" | "error";

interface InlineToastProps {
  message: string;
  tone?: InlineToastTone;
}

export function InlineToast({ message, tone = "default" }: InlineToastProps) {
  const toneStyle = tone === "success" ? styles.toastSuccess : tone === "error" ? styles.toastError : null;
  const accessibilityLabel = tone === "success"
    ? `${String(i18n.t("common.toastSuccessPrefix"))} ${message}`
    : tone === "error"
      ? `${String(i18n.t("common.toastErrorPrefix"))} ${message}`
      : message;

  return (
    <View
      pointerEvents="none"
      style={styles.wrapper}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.toast, toneStyle]}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    maxWidth: "90%",
    backgroundColor: "rgba(17, 24, 39, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastSuccess: {
    borderColor: "rgba(34, 197, 94, 0.55)",
    backgroundColor: "rgba(6, 78, 59, 0.95)",
  },
  toastError: {
    borderColor: "rgba(239, 68, 68, 0.55)",
    backgroundColor: "rgba(127, 29, 29, 0.95)",
  },
  message: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
