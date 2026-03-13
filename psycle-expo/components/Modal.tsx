import React from "react";
import { View, Text, Pressable, Modal as RNModal, StyleSheet } from "react-native";
import i18n from "../lib/i18n";
import { theme } from "../lib/theme";
import { Button } from "./ui";

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
            <Button
              label={String(i18n.t("common.cancel"))}
              variant="secondary"
              onPress={onCancel}
              style={styles.button}
            />
            <Button
              label={primaryLabel}
              onPress={onPrimary}
              testID="modal-primary-button"
              style={[styles.button, styles.buttonPrimary]}
            />
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
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.label,
    color: theme.colors.sub,
    marginBottom: theme.spacing.md,
  },
  buttons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.accent,
  },
});
