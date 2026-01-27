import React from "react";
import { View, Text, Pressable, Modal as RNModal, StyleSheet } from "react-native";
import { theme } from "../lib/theme";

interface ModalProps {
  visible: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  onCancel: () => void;
}

export function Modal({ visible, title, description, primaryLabel, onPrimary, onCancel }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.buttons}>
            <Pressable style={[styles.button, styles.buttonSecondary]} onPress={onCancel}>
              <Text style={styles.buttonSecondaryText}>キャンセル</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onPrimary} testID="modal-primary-button">
              <Text style={styles.buttonPrimaryText}>{primaryLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: "80%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 14,
    color: theme.colors.sub,
    marginBottom: theme.spacing.md,
  },
  buttons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: theme.colors.accent,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#001",
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
});
