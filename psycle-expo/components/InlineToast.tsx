import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

interface InlineToastProps {
  message: string;
}

export function InlineToast({ message }: InlineToastProps) {
  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View style={styles.toast}>
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
  message: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
