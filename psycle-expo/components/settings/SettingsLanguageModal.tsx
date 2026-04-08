import React from "react";
import { Modal, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import i18n from "../../lib/i18n";

interface LocaleOption {
  code: string;
  label: string;
}

export function SettingsLanguageModal(props: {
  locale: string;
  localeOptions: LocaleOption[];
  onClose: () => void;
  onSelectLanguage: (locale: string) => void | Promise<void>;
  visible: boolean;
}) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={props.onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{i18n.t("settings.languagePickerTitle")}</Text>
          {props.localeOptions.map((item) => (
            <Pressable
              key={item.code}
              style={styles.languageOption}
              onPress={() => {
                void props.onSelectLanguage(item.code);
              }}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: props.locale === item.code }}
            >
              <Text style={styles.languageLabel}>{item.label}</Text>
              {props.locale === item.code && (
                <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
              )}
            </Pressable>
          ))}
          <Pressable
            style={styles.modalCloseButton}
            onPress={props.onClose}
            accessibilityRole="button"
            accessibilityLabel={String(i18n.t("common.close"))}
          >
            <Text style={styles.modalCloseText}>{i18n.t("common.close")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  languageLabel: {
    fontSize: 15,
    color: theme.colors.text,
  },
  modalCloseButton: {
    marginTop: theme.spacing.md,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
  },
});
