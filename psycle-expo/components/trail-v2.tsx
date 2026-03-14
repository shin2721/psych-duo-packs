import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// ==================== WARM PALETTE ====================
const W = {
  bg: "#faf8f4",
  surface: "#fff",
  card: "#fff",
  text: "#1a1a1a",
  sub: "#8a8578",
  mute: "#c5bfb3",
  line: "#ebe7df",

  clay: "#c4704b",
  claySoft: "#f0d5c8",
  sage: "#6b8f71",
  sageSoft: "#dce8dd",
  sand: "#d4a96a",
  sandSoft: "#f5e6cd",
  plum: "#7c5e8a",
  plumSoft: "#e3d5ea",
  sky: "#5d8aa8",
  skySoft: "#d0e2ed",

  done: "#6b8f71",
  doneBg: "#dce8dd",
  current: "#c4704b",
  currentBg: "#fdf0ea",
  lockedBg: "#f3f1ec",
};

// ==================== TYPES ====================
type NodeStatus = "done" | "current" | "locked" | "future";
type NodeType = "lesson" | "game" | "review_blackhole" | "reward" | "milestone";

interface TrailNode {
  id: string;
  status: NodeStatus;
  icon: string;
  type?: NodeType;
  gameId?: string;
  lessonFile?: string;
  isLocked?: boolean;
  label?: string;
  sub?: string;
  xp?: number;
}

interface Props {
  trail: TrailNode[];
  genre?: { id: string; label: string; emoji?: string };
  completedCount?: number;
  totalCount?: number;
  totalXp?: number;
  streakDays?: number;
  chapterTitle?: string;
  chapterDesc?: string;
  onStart?: (nodeId: string) => void;
  onLockedPress?: (nodeId: string) => void;
}

// ==================== PULSE ANIMATION ====================
function PulseOrb({ children, size }: { children: React.ReactNode; size: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], width: size, height: size }}>
      {children}
    </Animated.View>
  );
}

// ==================== NODE ICONS ====================
const NODE_EMOJIS: Record<string, string> = {
  leaf: "🍃",
  flower: "🌸",
  sparkles: "✨",
  star: "⭐",
  "heart-circle": "💕",
  pulse: "💓",
  school: "🎓",
  flask: "🧪",
  "shield-checkmark": "🛡️",
  trophy: "🏆",
  planet: "🌀",
  gift: "🎁",
  scale: "⚖️",
};

function getEmoji(icon: string): string {
  return NODE_EMOJIS[icon] || "📘";
}

// ==================== SINGLE NODE ====================
function TrailNodeRow({
  node,
  index,
  isCurrent,
  isDone,
  isLocked,
  onPress,
}: {
  node: TrailNode;
  index: number;
  isCurrent: boolean;
  isDone: boolean;
  isLocked: boolean;
  onPress: () => void;
}) {
  const isMilestone = (index + 1) % 5 === 0;
  const isGame = node.type === "game";
  const isReviewBlackhole = node.type === "review_blackhole";

  // Determine orb style
  const getOrbStyle = () => {
    if (isDone) {
      return {
        backgroundColor: W.doneBg,
        borderWidth: 2,
        borderColor: W.done,
        borderStyle: "solid" as const,
        width: 44,
        height: 44,
      };
    }
    if (isCurrent) {
      return {
        backgroundColor: W.current,
        borderWidth: 0,
        borderColor: "transparent",
        borderStyle: "solid" as const,
        width: 52,
        height: 52,
      };
    }
    // Locked variants
    if (isMilestone) {
      return {
        backgroundColor: W.plumSoft,
        borderWidth: 1.5,
        borderColor: W.plum,
        borderStyle: "dashed" as const,
        width: 52,
        height: 52,
      };
    }
    if (isGame || isReviewBlackhole) {
      return {
        backgroundColor: W.skySoft,
        borderWidth: 1.5,
        borderColor: W.sky,
        borderStyle: "dashed" as const,
        width: 44,
        height: 44,
      };
    }
    // Default locked
    return {
      backgroundColor: W.lockedBg,
      borderWidth: 1.5,
      borderColor: W.mute,
      borderStyle: "dashed" as const,
      width: 44,
      height: 44,
    };
  };

  const orbStyle = getOrbStyle();
  const emoji = getEmoji(node.icon);
  const nodeLabel = node.label || `レッスン ${index + 1}`;
  const nodeSub = node.sub || (isReviewBlackhole ? "復習チャレンジ" : isGame ? "ミニゲーム" : "");

  // ── HERO CARD for current node ──
  if (isCurrent && !isLocked) {
    return (
      <View style={heroStyles.wrapper}>
        <View style={heroStyles.inner}>
          {/* Organic accent blobs */}
          <View style={heroStyles.blobTopRight} />
          <View style={heroStyles.blobBottomLeft} />

          <View style={heroStyles.top}>
            <PulseOrb size={52}>
              <View style={[styles.orb, {
                backgroundColor: W.current,
                width: 52,
                height: 52,
                borderRadius: 26,
              }]}>
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
              </View>
            </PulseOrb>
            <View style={heroStyles.text}>
              <Text style={heroStyles.label}>{nodeLabel}</Text>
              <Text style={heroStyles.sub}>{nodeSub || "次のレッスンに挑戦しよう"}</Text>
              <View style={heroStyles.tags}>
                <View style={[heroStyles.tag, { backgroundColor: "rgba(196,112,75,0.1)" }]}>
                  <Text style={[heroStyles.tagText, { color: W.clay }]}>+{node.xp || 24} XP</Text>
                </View>
                <View style={[heroStyles.tag, { backgroundColor: "rgba(0,0,0,0.04)" }]}>
                  <Text style={[heroStyles.tagText, { color: W.sub }]}>約5分</Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable style={heroStyles.cta} onPress={onPress}>
            <Text style={heroStyles.ctaText}>レッスンを始める →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Standard row ──
  return (
    <Pressable
      style={styles.nodeRow}
      onPress={isCurrent || isLocked ? onPress : undefined}
      disabled={!isCurrent && !isLocked}
    >
      <View style={[styles.orb, {
        backgroundColor: orbStyle.backgroundColor,
        borderWidth: orbStyle.borderWidth,
        borderColor: orbStyle.borderColor,
        borderStyle: orbStyle.borderStyle,
        width: orbStyle.width,
        height: orbStyle.height,
        borderRadius: orbStyle.width / 2,
      }]}>
        <Text style={{
          fontSize: isCurrent ? 22 : 18,
          opacity: isLocked && !isCurrent ? 0.35 : isDone ? 0.7 : 1,
        }}>
          {emoji}
        </Text>
        {/* Done checkmark badge */}
        {isDone && (
          <View style={styles.doneTick}>
            <Text style={styles.doneTickText}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.nodeContent}>
        <Text style={[
          styles.nodeLabel,
          isDone && { color: "rgba(26,26,26,0.55)" },
          isLocked && !isCurrent && { color: W.mute },
        ]}>
          {nodeLabel}
        </Text>
        {nodeSub ? (
          <Text style={[
            styles.nodeSub,
            isDone && { color: "rgba(138,133,120,0.5)" },
            isLocked && !isCurrent && { color: "rgba(0,0,0,0.15)" },
          ]}>
            {nodeSub}
          </Text>
        ) : null}
        {isDone && (
          <View style={styles.nodeTags}>
            <View style={[styles.tag, { backgroundColor: W.sageSoft }]}>
              <Text style={[styles.tagText, { color: W.sage }]}>+{node.xp || 8} XP</Text>
            </View>
            <Text style={[styles.tagText, { color: W.sage, fontWeight: "600" }]}>完了</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ==================== MAIN TRAIL V2 COMPONENT ====================
export function TrailV2({
  trail,
  genre,
  completedCount = 0,
  totalCount = 0,
  totalXp = 0,
  streakDays = 0,
  chapterTitle,
  chapterDesc,
  onStart,
  onLockedPress,
}: Props) {
  const bottomTabBarHeight = useBottomTabBarHeight();

  // Find current node index for spine coloring
  const currentIndex = trail.findIndex(n => n.status === "current");
  const visibleTrail = trail.slice(0, Math.min(trail.length, 20)); // Show max 20 nodes

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.bg }}
      contentContainerStyle={{ paddingBottom: bottomTabBarHeight + 40 }}
    >
      {/* ── Chapter Title ── */}
      <View style={headerStyles.chapterTitle}>
        <View style={headerStyles.eyebrow}>
          <View style={headerStyles.eyebrowDot} />
          <Text style={headerStyles.eyebrowText}>
            {genre?.label || "Chapter 1"}
          </Text>
        </View>
        <Text style={headerStyles.h1}>
          {chapterTitle || genre?.label || "学習の旅"}
        </Text>
        {chapterDesc ? (
          <Text style={headerStyles.desc}>{chapterDesc}</Text>
        ) : null}

        {/* Streak badge */}
        {streakDays > 0 && (
          <View style={headerStyles.streakBadge}>
            <Text style={headerStyles.streakText}>🔥 {streakDays}日</Text>
          </View>
        )}
      </View>

      {/* ── Stats Strip ── */}
      <View style={statsStyles.strip}>
        <View style={statsStyles.item}>
          <Text style={statsStyles.val}>
            {completedCount}
            <Text style={statsStyles.valSmall}>/{totalCount || trail.length}</Text>
          </Text>
          <Text style={statsStyles.label}>完了</Text>
        </View>
        <View style={statsStyles.divider} />
        <View style={statsStyles.item}>
          <Text style={statsStyles.val}>{totalXp}</Text>
          <Text style={statsStyles.label}>獲得 XP</Text>
        </View>
        <View style={statsStyles.divider} />
        <View style={statsStyles.item}>
          <Text style={statsStyles.val}>⭐</Text>
          <Text style={statsStyles.label}>次の報酬</Text>
        </View>
      </View>

      {/* ── Trail ── */}
      <View style={trailStyles.container}>
        {/* Spine line */}
        <View style={trailStyles.spine}>
          {/* Done segment */}
          {currentIndex > 0 && (
            <View style={[trailStyles.spineSeg, trailStyles.spineDone, {
              top: 12,
              height: Math.max(0, currentIndex) * 74,
            }]} />
          )}
          {/* Future segment (dashed via repeating views) */}
          <View style={[trailStyles.spineSeg, trailStyles.spineFuture, {
            top: currentIndex > 0 ? 12 + currentIndex * 74 : 12,
            height: Math.max(0, (visibleTrail.length - Math.max(currentIndex, 0))) * 74 + 40,
          }]} />
        </View>

        {/* Nodes */}
        {visibleTrail.map((node, index) => {
          const isDone = node.status === "done";
          const isCurrent = node.status === "current" && !node.isLocked;
          const isLocked = node.status === "locked" || node.status === "future" || !!node.isLocked;

          // Insert divider before first locked node after current
          const prevNode = index > 0 ? visibleTrail[index - 1] : null;
          const showDivider = isLocked && prevNode && (prevNode.status === "current" || prevNode.status === "done");

          return (
            <React.Fragment key={node.id}>
              {showDivider && index === (currentIndex + 1) && (
                <View style={trailStyles.divider}>
                  <View style={trailStyles.dividerLine} />
                  <Text style={trailStyles.dividerText}>つづき</Text>
                  <View style={trailStyles.dividerLine} />
                </View>
              )}
              <TrailNodeRow
                node={node}
                index={index}
                isCurrent={isCurrent}
                isDone={isDone}
                isLocked={isLocked && !isCurrent}
                onPress={() => {
                  if (node.isLocked) {
                    onLockedPress?.(node.id);
                  } else {
                    onStart?.(node.id);
                  }
                }}
              />
            </React.Fragment>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  nodeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  orb: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  doneTick: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    backgroundColor: W.done,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: W.bg,
  },
  doneTickText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "900",
  },
  nodeContent: {
    flex: 1,
    paddingTop: 2,
  },
  nodeLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: W.text,
    lineHeight: 20,
  },
  nodeSub: {
    fontSize: 12.5,
    color: W.sub,
    lineHeight: 18,
    marginTop: 2,
  },
  nodeTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

const heroStyles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginVertical: 8,
  },
  inner: {
    backgroundColor: W.currentBg,
    borderWidth: 1.5,
    borderColor: "rgba(196,112,75,0.2)",
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
  },
  blobTopRight: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    backgroundColor: "rgba(196,112,75,0.06)",
    borderRadius: 50,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    backgroundColor: "rgba(196,112,75,0.04)",
    borderRadius: 40,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: 20,
    fontWeight: "800",
    color: W.text,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 13.5,
    color: W.sub,
    marginTop: 4,
    lineHeight: 20,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  cta: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: W.clay,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: W.clay,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});

const headerStyles = StyleSheet.create({
  chapterTitle: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    backgroundColor: W.clay,
    borderRadius: 3,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: W.clay,
  },
  h1: {
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 39,
    letterSpacing: -1,
    color: W.text,
  },
  desc: {
    fontSize: 15,
    lineHeight: 23,
    color: W.sub,
    marginTop: 8,
    maxWidth: 300,
  },
  streakBadge: {
    position: "absolute",
    top: 16,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: W.sandSoft,
    borderWidth: 1,
    borderColor: "rgba(212,169,106,0.2)",
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
    color: W.sand,
  },
});

const statsStyles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: W.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: W.line,
    overflow: "hidden",
  },
  item: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  val: {
    fontSize: 22,
    fontWeight: "800",
    color: W.text,
  },
  valSmall: {
    fontSize: 14,
    color: W.mute,
    fontWeight: "500",
  },
  label: {
    fontSize: 11,
    color: W.mute,
    fontWeight: "500",
    marginTop: 1,
  },
  divider: {
    width: 1,
    marginVertical: "25%",
    backgroundColor: W.line,
  },
});

const trailStyles = StyleSheet.create({
  container: {
    paddingTop: 28,
    paddingBottom: 40,
    position: "relative",
  },
  spine: {
    position: "absolute",
    left: 45,
    top: 0,
    bottom: 0,
    width: 2,
  },
  spineSeg: {
    position: "absolute",
    left: 0,
    width: 2,
    borderRadius: 1,
  },
  spineDone: {
    backgroundColor: W.done,
    opacity: 0.35,
  },
  spineFuture: {
    backgroundColor: W.mute,
    opacity: 0.2,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: W.line,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: W.mute,
  },
});
