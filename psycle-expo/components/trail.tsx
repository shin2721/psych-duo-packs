import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Animated, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "../lib/theme";

type NodeStatus = "done" | "current" | "locked" | "future";
type NodeType = "lesson" | "game";

interface TrailNode {
  id: string;
  status: NodeStatus;
  icon: string;
  type?: NodeType;
  gameId?: string;
  lessonId?: string;
  isLocked?: boolean; // For paywall
}

interface Props {
  trail: TrailNode[];
  hideLabels?: boolean;
  onStart?: (nodeId: string) => void;
  onLockedPress?: (nodeId: string) => void; // Callback for locked lessons
}

export function Trail({ trail, hideLabels, onStart, onLockedPress }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.spine} />
      {trail.map((node, index) => {
        const isLeft = index % 2 === 0;
        return (
          <View key={node.id} style={[styles.nodeWrapper, isLeft ? styles.nodeLeft : styles.nodeRight]}>
            <View style={[styles.arm, isLeft ? styles.armLeft : styles.armRight]} />
            <Node node={node} onPress={() => {
              // Handle locked lessons
              if (node.isLocked) {
                onLockedPress?.(node.id);
                return;
              }

              if (node.status === "current") {
                if (node.type === "game" && node.gameId) {
                  router.push(`/games/${node.gameId}`);
                } else if (node.type === "lesson" && node.lessonId) {
                  router.push(`/lessons/${node.lessonId}`);
                } else {
                  onStart?.(node.id);
                }
              }
            }} />
          </View>
        );
      })}
    </ScrollView>
  );
}

function Node({ node, onPress }: { node: TrailNode; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (node.status === "current") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [node.status]);

  const getNodeStyle = () => {
    switch (node.status) {
      case "done":
        return { backgroundColor: theme.colors.success, opacity: 1 };
      case "current":
        return { backgroundColor: theme.colors.accent, opacity: 1, borderWidth: 3, borderColor: theme.colors.accent };
      case "locked":
        return { backgroundColor: theme.colors.surface, opacity: 0.35 };
      case "future":
        return { backgroundColor: theme.colors.surface, opacity: 0.6 };
    }
  };

  const getIcon = () => {
    if (node.isLocked) return <Ionicons name="lock-closed" size={24} color={theme.colors.sub} />;
    if (node.status === "done") return <Ionicons name="checkmark" size={28} color="#fff" />;
    if (node.status === "locked") return <Text style={styles.lockedText}>?</Text>;
    return <Ionicons name={node.icon as any} size={28} color={node.status === "current" ? "#001" : theme.colors.sub} />;
  };

  return (
    <Animated.View style={{ transform: [{ scale: node.status === "current" ? scaleAnim : 1 }] }}>
      <Pressable
        style={[styles.node, getNodeStyle()]}
        onPress={node.isLocked || node.status === "current" ? onPress : undefined}
        disabled={!node.isLocked && node.status !== "current"}
      >
        {getIcon()}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    position: "relative",
  },
  spine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.line,
    transform: [{ translateX: -2 }],
  },
  nodeWrapper: {
    marginBottom: theme.spacing.xl,
    position: "relative",
  },
  nodeLeft: {
    alignItems: "flex-start",
    paddingLeft: "25%",
  },
  nodeRight: {
    alignItems: "flex-end",
    paddingRight: "25%",
  },
  arm: {
    position: "absolute",
    top: 32,
    height: 4,
    backgroundColor: theme.colors.line,
  },
  armLeft: {
    left: 0,
    right: "75%",
  },
  armRight: {
    right: 0,
    left: "75%",
  },
  node: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
  },
  lockedText: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.sub,
  },
});
