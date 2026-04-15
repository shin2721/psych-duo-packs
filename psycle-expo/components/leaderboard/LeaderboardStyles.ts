import { StyleSheet } from "react-native";
import { theme } from "../../lib/theme";

export const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeSegment: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.sub,
  },
  activeSegmentText: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.sub,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.sub,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  list: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  currentUserRow: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  rankContainer: {
    width: 50,
    alignItems: "center",
  },
  rankText: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 4,
    flexShrink: 1,
  },
  currentUsername: {
    color: theme.colors.primary,
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: theme.colors.sub,
  },
  addFriendButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  addFriendButtonDisabled: {
    opacity: 0.5,
  },
  leagueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
    backgroundColor: "transparent",
  },
  tierIcon: {
    fontSize: 32,
  },
  tierName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  weekId: {
    fontSize: 14,
    color: theme.colors.sub,
    marginLeft: 8,
  },
  zoneLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    padding: 12,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.sub,
  },
  promotionRow: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  demotionRow: {
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
});
