import React, { useMemo } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { TrailBackground } from "./trail/TrailBackground";
import { TrailNodeView, LevelIndicator } from "./trail/TrailNodeView";
import { NodeSparkle } from "./trail/trailEffects";
import {
  buildTrailPaths,
  getCurrentNodeIndex,
  getTrailNodePositions,
  isMilestoneIndex,
  NODE_SPACING,
  PATH_COLOR_DONE,
} from "./trail/trailMath";
import type { TrailProps } from "./trail/types";
import { theme } from "../lib/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

export function Trail({ trail, hideLabels, onStart, onLockedPress, themeColor }: TrailProps) {
  const activePathColor = themeColor || PATH_COLOR_DONE;
  const bottomTabBarHeight = useBottomTabBarHeight();
  const trailBottomInset = bottomTabBarHeight + theme.spacing.lg;

  const currentIndex = useMemo(() => getCurrentNodeIndex(trail), [trail]);
  const nodePositions = useMemo(() => getTrailNodePositions(trail.length, SCREEN_WIDTH), [trail.length]);
  const { pathDone, pathFuture } = useMemo(
    () => buildTrailPaths(nodePositions, currentIndex),
    [currentIndex, nodePositions]
  );
  const totalHeight = trail.length * NODE_SPACING + 200;

  const currentNodeFireflies = useMemo(() => {
    if (currentIndex < 0 || !nodePositions[currentIndex]) return [];
    const currentPosition = nodePositions[currentIndex];
    const count = 4;
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2;
      const radius = 60 + Math.random() * 80;
      return {
        id: 200 + index,
        delay: Math.random() * 2000,
        size: 4 + Math.random() * 4,
        startX: currentPosition.x + Math.cos(angle) * radius,
        startY: currentPosition.y + Math.sin(angle) * radius,
        moveX: 15 + Math.random() * 25,
        moveY: 20 + Math.random() * 30,
        duration: 1500 + Math.random() * 2500,
      };
    });
  }, [currentIndex, nodePositions]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { minHeight: totalHeight, paddingBottom: trailBottomInset }]}
    >
      <TrailBackground
        totalHeight={totalHeight}
        screenWidth={SCREEN_WIDTH}
        pathDone={pathDone}
        pathFuture={pathFuture}
        activePathColor={activePathColor}
        currentNodeFireflies={currentNodeFireflies}
      />

      {trail.map((node, index) => {
        const { x, y } = nodePositions[index];
        const isMilestone = isMilestoneIndex(index);

        return (
          <View key={node.id}>
            {!hideLabels ? (
              <LevelIndicator
                level={index + 1}
                x={x}
                y={y}
                isLeft={x < SCREEN_WIDTH / 2}
                isMilestone={isMilestone}
                color={themeColor}
              />
            ) : null}
            <TrailNodeView
              node={node}
              x={x}
              y={y}
              isMilestone={isMilestone}
              onPress={() => (node.status === "locked" ? onLockedPress?.(node.id) : onStart?.(node.id))}
              themeColor={themeColor}
              nodeIndex={index}
            />
          </View>
        );
      })}

      {trail.map((node, index) => {
        if (node.status !== "done") return null;
        const position = nodePositions[index];
        return (
          <NodeSparkle
            key={`sparkle-${node.id}`}
            x={position.x + (Math.random() - 0.5) * 40}
            y={position.y + (Math.random() - 0.5) * 40}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
});
