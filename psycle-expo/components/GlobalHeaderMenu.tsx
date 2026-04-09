import React from "react";
import { Modal, TouchableWithoutFeedback, View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { genres } from "../lib/data";
import i18n from "../lib/i18n";
import { getGenreIcon, getGenreLabel } from "./globalHeaderHelpers";

export function GlobalHeaderMenu({
  menuVisible,
  onClose,
  onSelectGenre,
  selectedGenre,
}: {
  menuVisible: boolean;
  onClose: () => void;
  onSelectGenre: (genreId: string) => void;
  selectedGenre: string;
}) {
  return (
    <Modal
      visible={menuVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              <Text style={styles.menuTitle}>{i18n.t("globalHeader.selectCourse")}</Text>
              <View style={styles.menuGrid}>
                {genres.map((genre) => (
                  <Pressable
                    key={genre.id}
                    style={[
                      styles.menuItem,
                      selectedGenre === genre.id && styles.menuItemActive,
                    ]}
                    onPress={() => onSelectGenre(genre.id)}
                    accessibilityRole="button"
                    accessibilityLabel={getGenreLabel(genre.id, genre.label)}
                    accessibilityState={
                      selectedGenre === genre.id ? { selected: true } : undefined
                    }
                  >
                    <View style={styles.iconWrap}>{getGenreIcon(genre.id, 40)}</View>
                    <Text
                      style={[
                        styles.menuLabel,
                        selectedGenre === genre.id && styles.menuLabelActive,
                      ]}
                    >
                      {getGenreLabel(genre.id, genre.label)}
                    </Text>
                    {selectedGenre === genre.id ? (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  menuContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.sub,
    marginBottom: 12,
    textAlign: "center",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  menuItem: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: theme.colors.bg,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    gap: 4,
  },
  menuItemActive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
  },
  iconWrap: {
    marginBottom: 4,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.sub,
  },
  menuLabelActive: {
    color: theme.colors.accent,
  },
  checkBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
