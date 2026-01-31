import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { useAppState } from "../lib/state";
import { router } from "expo-router";
import { getEnergy, ENERGY_MAX } from "../src/energy";
import { genres } from "../lib/data";
import { StreakIcon, GemIcon, EnergyIcon, MentalIcon, MoneyIcon, WorkIcon, HealthIcon, SocialIcon, StudyIcon } from "./CustomIcons";
import { Modal, TouchableWithoutFeedback } from "react-native";
import { getStreakData, StreakData } from "../lib/streaks";
import { getFocusData, FocusData } from "../lib/focus";

const getGenreIcon = (id: string, size: number = 28) => {
  switch (id) {
    case 'mental': return <MentalIcon size={size} />;
    case 'money': return <MoneyIcon size={size} />;
    case 'work': return <WorkIcon size={size} />;
    case 'health': return <HealthIcon size={size} />;
    case 'social': return <SocialIcon size={size} />;
    case 'study': return <StudyIcon size={size} />;
    default: return <MentalIcon size={size} />;
  }
};

export function GlobalHeader() {
  const { gems, selectedGenre, setSelectedGenre } = useAppState();
  const [energy, setEnergy] = useState(ENERGY_MAX);
  const [menuVisible, setMenuVisible] = useState(false);

  // ゲーミフィケーション: Action Streak + Focus
  const [actionStreak, setActionStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [focus, setFocus] = useState(25);

  useEffect(() => {
    setEnergy(getEnergy());
    const interval = setInterval(() => setEnergy(getEnergy()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ゲーミフィケーション: ストリークとFocusを読み込み
  useEffect(() => {
    const loadGamification = async () => {
      const streakData = await getStreakData();
      setActionStreak(streakData.actionStreak);
      setTotalXP(streakData.totalXP);

      const focusData = await getFocusData();
      setFocus(focusData.current);
    };
    loadGamification();

    // 1分ごとに更新
    const interval = setInterval(loadGamification, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentGenre = genres.find(g => g.id === selectedGenre) || genres[0];

  return (
    <>
      <View style={styles.container}>
        {/* 1. Course Selector */}
        <Pressable style={styles.item} onPress={() => setMenuVisible(true)}>
          {getGenreIcon(selectedGenre, 36)}
        </Pressable>

        {/* 2. Action Streak (ゲーミフィケーション主役) */}
        <Pressable style={styles.item} onPress={() => router.push("/(tabs)/course")}>
          <StreakIcon size={24} />
          <Text style={[styles.value, { color: "#f97316" }]}>{actionStreak}</Text>
        </Pressable>

        {/* 3. Gems */}
        <Pressable style={styles.item} onPress={() => router.push("/(tabs)/shop")}>
          <GemIcon size={22} />
          <Text style={[styles.value, { color: "#3debf6" }]}>{gems}</Text>
        </Pressable>

        {/* 4. Focus（ゲーミフィケーション：ソフト制限） */}
        <Pressable style={styles.item} onPress={() => router.push("/(tabs)/shop")}>
          <EnergyIcon
            size={22}
            color={focus > 0 ? undefined : "#ccc"}
          />
          <Text style={[styles.value, { color: focus > 0 ? theme.colors.text : theme.colors.sub }]}>
            {focus}
          </Text>
        </Pressable>
      </View>

      {/* Course Selection Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                <Text style={styles.menuTitle}>コースを選択</Text>
                <View style={styles.menuGrid}>
                  {genres.map((g) => (
                    <Pressable
                      key={g.id}
                      style={[
                        styles.menuItem,
                        selectedGenre === g.id && styles.menuItemActive
                      ]}
                      onPress={() => {
                        setSelectedGenre(g.id);
                        setMenuVisible(false);
                      }}
                    >
                      <View style={{ marginBottom: 4 }}>
                        {getGenreIcon(g.id, 40)}
                      </View>
                      <Text style={[
                        styles.menuLabel,
                        selectedGenre === g.id && styles.menuLabelActive
                      ]}>{g.label}</Text>
                      {selectedGenre === g.id && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Distribute 4 items evenly
    paddingHorizontal: 24, // Increased padding
    paddingVertical: 12,
    backgroundColor: "rgba(11, 18, 32, 0.85)", // Semi-transparent for global background
    zIndex: 100,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 44, // Minimum touch area
    justifyContent: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: theme.colors.text,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start', // Top alignment
    paddingTop: 60, // Place below header
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
    textAlign: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  menuItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: theme.colors.bg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  menuItemActive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
  },
  menuEmoji: {
    fontSize: 32,
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
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
