import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import i18n from "../../../lib/i18n";
import {
  BLOSSOMS,
  CANOPY_ORBS,
  FLOOR_SHOOTS,
  POOLS,
  STRANDS,
} from "./courseHeroFinalSceneData";

type CourseHeroFinalSceneNode = {
  icon: string;
  id: string;
  isLocked?: boolean;
  label: string;
  levelNumber: number;
  status: "done" | "current" | "locked";
};

function buildAccessibilityLabel(node: CourseHeroFinalSceneNode) {
  if (node.status === "done") {
    return String(
      i18n.t("course.accessibility.nodeCompleted", { number: node.levelNumber })
    );
  }

  if (node.isLocked || node.status === "locked") {
    return String(
      i18n.t("course.accessibility.nodeLocked", { number: node.levelNumber })
    );
  }

  return String(
    i18n.t("course.accessibility.nodeCurrent", { number: node.levelNumber })
  );
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return `rgba(143, 232, 255, ${alpha})`;
  }

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CourseHeroFinalScene({
  ctaAccessibilityLabel,
  ctaLabel,
  heroWidth,
  node,
  onNodePress,
  onPrimaryPress,
  testID,
  themeColor,
  title,
}: {
  ctaAccessibilityLabel: string;
  ctaLabel: string;
  heroWidth: number;
  node: CourseHeroFinalSceneNode;
  onNodePress: () => void;
  onPrimaryPress: () => void;
  testID: string;
  themeColor: string;
  title: string;
}) {
  const sceneHeight = Math.max(heroWidth * 1.84, 646);
  const accent = hexToRgba(themeColor, 0.18);
  const accentEdge = hexToRgba(themeColor, 0.32);
  const sceneTestId = `${testID.replace(/-node-.+$/, "")}-cta`;

  return (
    <View style={[styles.gardenScene, { minHeight: sceneHeight }]}>
      <View style={styles.deepVioletBloom} />
      <View style={styles.aquaBloom} />

      {CANOPY_ORBS.map((orb, index) => (
        <View
          key={`orb-${index}`}
          style={[
            styles.canopyOrb,
            {
              backgroundColor: orb.color,
              height: orb.size,
              left: heroWidth * orb.x,
              opacity: orb.opacity,
              top: sceneHeight * orb.y,
              width: orb.size,
            },
          ]}
        />
      ))}

      {STRANDS.map((strand, index) => (
        <View
          key={`strand-${index}`}
          style={[
            styles.strand,
            {
              backgroundColor: strand.color,
              height: sceneHeight * (strand.end - strand.top),
              left: heroWidth * strand.x,
              opacity: strand.opacity,
              top: sceneHeight * strand.top,
              width: strand.width,
            },
          ]}
        />
      ))}

      <View
        style={[
          styles.reflectionPath,
          { height: sceneHeight * 0.34, top: sceneHeight * 0.56 },
        ]}
      />
      <View
        style={[
          styles.reflectionBeam,
          { height: sceneHeight * 0.34, top: sceneHeight * 0.56 },
        ]}
      />

      {POOLS.map((pool, index) => (
        <View
          key={`pool-${index}`}
          style={[
            styles.pool,
            {
              height: sceneHeight * pool.height,
              left: heroWidth * pool.x,
              top: sceneHeight * pool.y,
              width: heroWidth * pool.width,
            },
          ]}
        />
      ))}

      {FLOOR_SHOOTS.map((shoot, index) => (
        <View
          key={`shoot-${index}`}
          style={[
            styles.floorShoot,
            {
              backgroundColor: shoot.color,
              height: shoot.h,
              left: heroWidth * shoot.x,
              top: sceneHeight * shoot.y,
            },
          ]}
        />
      ))}

      {BLOSSOMS.map((blossom, index) => (
        <View
          key={`blossom-${index}`}
          style={[
            styles.blossom,
            {
              height: blossom.size,
              left: heroWidth * blossom.x,
              opacity: blossom.opacity,
              top: sceneHeight * blossom.y,
              width: blossom.size * 1.9,
            },
          ]}
        />
      ))}

      <View style={styles.wordmarkBlock}>
        <Text style={styles.wordmark}>PSYCLE</Text>
        <Text numberOfLines={3} style={styles.title}>
          {title}
        </Text>
        <View
          style={[styles.currentTag, { borderColor: accentEdge, shadowColor: themeColor }]}
        >
          <Text style={styles.currentTagText}>{`lesson ${node.levelNumber} / current`}</Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel={buildAccessibilityLabel(node)}
        accessibilityRole="button"
        accessibilityState={{ selected: true }}
        hitSlop={12}
        onPress={onNodePress}
        style={[styles.currentPillar, { shadowColor: themeColor }]}
        testID={testID}
      >
        <View style={[styles.pillarGlow, { backgroundColor: accent }]} />
        <View style={[styles.pillarLight, { borderColor: accentEdge }]}>
          <Ionicons
            color="#111720"
            name={node.icon as keyof typeof Ionicons.glyphMap}
            size={30}
          />
        </View>
        <Text style={styles.currentLabel}>{node.label}</Text>
      </Pressable>

      <Pressable
        accessibilityHint={ctaAccessibilityLabel}
        accessibilityLabel={ctaLabel}
        accessibilityRole="button"
        hitSlop={10}
        onPress={onPrimaryPress}
        style={[styles.entryButton, { borderColor: accentEdge }]}
        testID={sceneTestId}
      >
        <Text style={styles.entryText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  aquaBloom: {
    backgroundColor: "rgba(64, 221, 255, 0.1)",
    borderRadius: 999,
    height: 220,
    position: "absolute",
    right: -60,
    top: 102,
    width: 220,
  },
  blossom: {
    backgroundColor: "rgba(239, 247, 255, 0.78)",
    borderColor: "rgba(239, 247, 255, 0.34)",
    borderRadius: 999,
    borderWidth: 1,
    position: "absolute",
  },
  canopyOrb: {
    borderRadius: 999,
    position: "absolute",
  },
  currentLabel: {
    color: "#edf4fb",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 38,
    marginTop: 16,
  },
  currentPillar: {
    alignItems: "center",
    position: "absolute",
    right: 78,
    top: "34%",
    width: 96,
  },
  currentTag: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(12, 18, 26, 0.68)",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 22,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  currentTagText: {
    color: "#e9f2ff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
    lineHeight: 40,
  },
  deepVioletBloom: {
    backgroundColor: "rgba(121, 73, 255, 0.08)",
    borderRadius: 999,
    height: 260,
    left: -70,
    position: "absolute",
    top: 86,
    width: 260,
  },
  entryButton: {
    alignItems: "center",
    backgroundColor: "rgba(15, 20, 29, 0.84)",
    borderRadius: 999,
    borderWidth: 1,
    bottom: 24,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 22,
    position: "absolute",
    right: 14,
  },
  entryText: {
    color: "#eef3fb",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.08,
    lineHeight: 18,
  },
  floorShoot: {
    borderRadius: 999,
    position: "absolute",
    width: 2.2,
  },
  gardenScene: {
    backgroundColor: "#05070d",
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  pillarGlow: {
    borderRadius: 999,
    height: 170,
    left: -34,
    position: "absolute",
    top: 38,
    width: 170,
  },
  pillarLight: {
    alignItems: "center",
    backgroundColor: "rgba(198, 242, 255, 0.3)",
    borderRadius: 48,
    borderWidth: 1,
    height: 148,
    justifyContent: "center",
    overflow: "hidden",
    width: 44,
  },
  pool: {
    backgroundColor: "rgba(3, 6, 11, 0.78)",
    borderColor: "rgba(142, 223, 255, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    position: "absolute",
  },
  reflectionBeam: {
    backgroundColor: "rgba(222, 247, 255, 0.08)",
    left: "46%",
    position: "absolute",
    transform: [{ skewY: "-6deg" }],
    width: 32,
  },
  reflectionPath: {
    backgroundColor: "rgba(126, 232, 255, 0.06)",
    left: "41%",
    position: "absolute",
    transform: [{ skewY: "8deg" }],
    width: 88,
  },
  strand: {
    borderRadius: 999,
    position: "absolute",
  },
  title: {
    color: "#f2f6fb",
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: 30,
    marginTop: 18,
    width: "96%",
  },
  wordmark: {
    color: "#99a8b7",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2.8,
  },
  wordmarkBlock: {
    left: 22,
    position: "absolute",
    top: "26%",
    width: "56%",
  },
});
