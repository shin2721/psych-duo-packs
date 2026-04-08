import { StyleSheet } from "react-native";
import { theme } from "../../lib/theme";

export const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.sub,
  },
  activeSegmentText: {
    color: "#fff",
  },
  list: {
    paddingBottom: 20,
  },
  challengeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 14,
    marginBottom: 12,
  },
  challengeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  challengeSubtitle: {
    fontSize: 13,
    color: theme.colors.sub,
    marginBottom: 4,
  },
  challengeProgress: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 6,
  },
  challengeStatus: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  challengeStatusReady: {
    color: theme.colors.success,
  },
  challengeStatusPending: {
    color: theme.colors.sub,
  },
  challengeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  challengeButtonDisabled: {
    opacity: 0.45,
  },
  challengeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 4,
    flexShrink: 1,
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: theme.colors.sub,
  },
  removeButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: theme.colors.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.sub,
    marginTop: 8,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
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
});
