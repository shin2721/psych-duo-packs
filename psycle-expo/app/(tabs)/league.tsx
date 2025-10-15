import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../lib/theme";
import { league, promotionCut, relegationCut } from "../../lib/data";
import { useAppState } from "../../lib/state";
import { Chest } from "../../components/Chest";
import { GlobalHeader } from "../../components/GlobalHeader";

const COLORS = ["#fbbf24", "#60a5fa", "#a78bfa", "#f472b6", "#34d399"];

export default function LeagueScreen() {
  const { xp } = useAppState();
  const players = [...league, { id: "me", name: "You", xp, me: true }].sort((a, b) => b.xp - a.xp);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlobalHeader />
      <LinearGradient colors={["#1e293b", theme.colors.surface]} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.badge}>
            <Ionicons name="diamond" size={20} color={theme.colors.accent} />
            <Text style={styles.badgeText}>アメジストリーグ</Text>
          </View>
          <Text style={styles.daysLeft}>残り 3日</Text>
        </View>
        <View style={styles.trophyRow}>
          <Ionicons name="trophy" size={28} color="#fbbf24" />
          <Ionicons name="trophy" size={24} color="#9ca3af" />
          <Ionicons name="trophy" size={20} color="#c07a4c" />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        {players.map((p, i) => {
          const isPromote = i < promotionCut;
          const isRelegate = i >= relegationCut;
          const showPromoteHeader = i === 0;
          const showMaintainHeader = i === promotionCut;
          const showRelegateHeader = i === relegationCut;

          return (
            <React.Fragment key={p.id}>
              {showPromoteHeader && <Text style={styles.zoneHeader}>昇格ゾーン</Text>}
              {showMaintainHeader && <Text style={styles.zoneHeader}>維持ゾーン</Text>}
              {showRelegateHeader && <Text style={styles.zoneHeader}>降格ゾーン</Text>}
              <Pressable style={[styles.row, p.me && styles.rowMe]}>
                <Text style={styles.rank}>{i + 1}</Text>
                <View style={[styles.avatar, { backgroundColor: COLORS[i % COLORS.length] }]}>
                  <Text style={styles.avatarText}>{p.name[0]}</Text>
                </View>
                <Text style={[styles.playerName, p.me && styles.playerNameMe]}>{p.name}</Text>
                <Text style={styles.playerXp}>{p.xp} XP</Text>
              </Pressable>
            </React.Fragment>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>今週の報酬</Text>
          <Chest state="closed" size="sm" label="?" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md },
  badge: { flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, backgroundColor: theme.colors.card, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderRadius: theme.radius.xl },
  badgeText: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  daysLeft: { fontSize: 12, color: theme.colors.sub },
  trophyRow: { flexDirection: "row", gap: theme.spacing.sm, justifyContent: "center" },
  scroll: { padding: theme.spacing.md, paddingTop: theme.spacing.sm },
  zoneHeader: { fontSize: 11, fontWeight: "700", color: theme.colors.sub, textTransform: "uppercase", marginTop: theme.spacing.md, marginBottom: theme.spacing.xs },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.sm, marginBottom: theme.spacing.xs },
  rowMe: { backgroundColor: theme.colors.card, borderWidth: 2, borderColor: theme.colors.accent },
  rank: { width: 28, fontSize: 14, fontWeight: "800", color: theme.colors.sub, textAlign: "center" },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginHorizontal: theme.spacing.sm },
  avatarText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  playerName: { flex: 1, fontSize: 14, fontWeight: "600", color: theme.colors.text },
  playerNameMe: { fontWeight: "800" },
  playerXp: { fontSize: 12, fontWeight: "700", color: theme.colors.sub },
  footer: { marginTop: theme.spacing.lg, alignItems: "center", gap: theme.spacing.sm },
  footerLabel: { fontSize: 14, fontWeight: "600", color: theme.colors.sub },
});
