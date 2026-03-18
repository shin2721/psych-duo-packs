import React, { useRef, useEffect, useMemo } from "react";
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

// ==================== DARK SPACE PALETTE ====================
const D = {
  bg: "#0a0a2e",
  surface: "rgba(255,255,255,0.06)",
  card: "rgba(255,255,255,0.08)",
  glass: "rgba(12,12,48,0.88)",
  text: "#f0f0f0",
  sub: "rgba(255,255,255,0.55)",
  mute: "rgba(255,255,255,0.25)",
  line: "rgba(255,255,255,0.08)",

  glow: "#a8ff60",
  glowDim: "rgba(168,255,96,0.25)",
  success: "#22c55e",
  successDim: "rgba(34,197,94,0.15)",
  gold: "#ffd700",
  accent: "#818cf8",
  accentSoft: "rgba(129,140,248,0.15)",
  lockedBg: "rgba(255,255,255,0.04)",
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

const SCREEN_WIDTH = Dimensions.get("window").width;
const STAR_COLORS = ["#ccdcff", "#dde4ff", "#fff8f0", "#ffeedd", "#ffe4cc"];
const FIREFLY_COLORS = ["#a8ff60", "#ffdd60", "#ff9b60", "#60ffb0", "#ffaa40"];

const NODE_EMOJIS: Record<string, string> = {
  leaf: "\u{1F343}", flower: "\u{1F338}", sparkles: "\u2728", star: "\u2B50",
  "heart-circle": "\u{1F495}", pulse: "\u{1F493}", school: "\u{1F393}", flask: "\u{1F9EA}",
  "shield-checkmark": "\u{1F6E1}\uFE0F", trophy: "\u{1F3C6}", planet: "\u{1F300}", gift: "\u{1F381}",
  scale: "\u2696\uFE0F",
};
function getEmoji(icon: string): string { return NODE_EMOJIS[icon] || "\u{1F4D8}"; }

// ==================== BACKGROUND STAR ====================
function BackgroundStar({ x, y, size }: { x: number; y: number; size: number }) {
  const opacity = useRef(new Animated.Value(0.3 + Math.random() * 0.4)).current;

  useEffect(() => {
    const twinkle = () => {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.08, duration: 2000 + Math.random() * 2000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5 + Math.random() * 0.3, duration: 2000 + Math.random() * 2000, useNativeDriver: true }),
      ]).start(() => twinkle());
    };
    const t = setTimeout(twinkle, Math.random() * 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute", left: x, top: y, width: size, height: size,
        borderRadius: size / 2, backgroundColor: "#fff", opacity,
        ...(size > 2 ? {
          shadowColor: "#fff", shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8, shadowRadius: size * 2,
        } : {}),
      }}
    />
  );
}

// ==================== SHOOTING STAR ====================
function ShootingStar({ contentHeight }: { contentHeight: number }) {
  const translateX = useRef(new Animated.Value(-100)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shoot = () => {
      const startY = Math.random() * contentHeight * 0.5;
      translateY.setValue(startY);
      translateX.setValue(-50);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(translateX, { toValue: SCREEN_WIDTH + 100, duration: 800, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: startY + 200, duration: 800, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => { setTimeout(shoot, 5000 + Math.random() * 10000); });
    };
    const t = setTimeout(shoot, 2000 + Math.random() * 5000);
    return () => clearTimeout(t);
  }, [contentHeight]);

  return (
    <Animated.View style={{
      position: "absolute", width: 40, height: 2, backgroundColor: "#fff",
      borderRadius: 1, shadowColor: "#fff", shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1, shadowRadius: 6, opacity,
      transform: [{ translateX }, { translateY }, { rotate: "35deg" }],
    }} />
  );
}

// ==================== FLOATING PARTICLE ====================
function FloatingParticle({
  delay, size, startX, startY, moveX, moveY, duration, color = D.glow,
}: {
  delay: number; size: number; startX: number; startY: number;
  moveX: number; moveY: number; duration: number; color?: string;
}) {
  const tY = useRef(new Animated.Value(0)).current;
  const tX = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(tY, { toValue: -moveY, duration, useNativeDriver: true }),
        Animated.timing(tY, { toValue: moveY, duration, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(tX, { toValue: moveX, duration: duration * 0.9, useNativeDriver: true }),
        Animated.timing(tX, { toValue: -moveX, duration: duration * 0.9, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(op, { toValue: 0.9, duration: duration * 0.5, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.2, duration: duration * 0.5, useNativeDriver: true }),
      ])).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{
      position: "absolute", left: startX, top: startY, width: size, height: size,
      borderRadius: size / 2, backgroundColor: color, shadowColor: color,
      shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: size * 4,
      opacity: op, transform: [{ translateY: tY }, { translateX: tX }],
    }} />
  );
}

// ==================== PULSE ORB WRAPPER ====================
function PulseOrb({ children, size }: { children: React.ReactNode; size: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ scale }], width: size, height: size }}>{children}</Animated.View>;
}

// ==================== NODE SPARKLE (for completed nodes) ====================
function NodeSparkle() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const sparkle = () => {
      opacity.setValue(0);
      scale.setValue(0.5);
      Animated.sequence([
        Animated.delay(Math.random() * 6000),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ]).start(() => { setTimeout(sparkle, 4000 + Math.random() * 8000); });
    };
    const t = setTimeout(sparkle, Math.random() * 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{
      position: "absolute", right: -4, top: -4,
      width: 12, height: 12, opacity, transform: [{ scale }],
    }}>
      <View style={{ position: "absolute", left: 4, top: 0, width: 4, height: 12, backgroundColor: D.gold, borderRadius: 2 }} />
      <View style={{ position: "absolute", left: 0, top: 4, width: 12, height: 4, backgroundColor: D.gold, borderRadius: 2 }} />
    </Animated.View>
  );
}

// ==================== DARK HEADER ====================
function DarkHeader({ genre, title, desc, streakDays }: {
  genre?: { id: string; label: string; emoji?: string };
  title?: string; desc?: string; streakDays?: number;
}) {
  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.eyebrow}>
        <View style={headerStyles.eyebrowDot} />
        <Text style={headerStyles.eyebrowText}>{genre?.label || "Chapter 1"}</Text>
      </View>
      <Text style={headerStyles.h1}>{title || genre?.label || "\u5B66\u7FD2\u306E\u65C5"}</Text>
      {desc ? <Text style={headerStyles.desc}>{desc}</Text> : null}
      {(streakDays ?? 0) > 0 && (
        <View style={headerStyles.streakBadge}>
          <Text style={headerStyles.streakText}>{"\u{1F525}"} {streakDays}\u65E5</Text>
        </View>
      )}
    </View>
  );
}

// ==================== DARK STATS STRIP ====================
function DarkStats({ completed, total, xp }: { completed: number; total: number; xp: number }) {
  return (
    <View style={statsStyles.strip}>
      <View style={statsStyles.item}>
        <Text style={statsStyles.val}>{completed}<Text style={statsStyles.valSmall}>/{total}</Text></Text>
        <Text style={statsStyles.label}>\u5B8C\u4E86</Text>
      </View>
      <View style={statsStyles.divider} />
      <View style={statsStyles.item}>
        <Text style={statsStyles.val}>{xp}</Text>
        <Text style={statsStyles.label}>\u7372\u5F97 XP</Text>
      </View>
      <View style={statsStyles.divider} />
      <View style={statsStyles.item}>
        <Text style={statsStyles.val}>{"\u2B50"}</Text>
        <Text style={statsStyles.label}>\u6B21\u306E\u5831\u916C</Text>
      </View>
    </View>
  );
}

// ==================== DARK HERO CARD (current lesson) ====================
function DarkHeroCard({ node, index, onPress }: {
  node: TrailNode; index: number; onPress: () => void;
}) {
  const emoji = getEmoji(node.icon);
  const nodeLabel = node.label || `\u30EC\u30C3\u30B9\u30F3 ${index + 1}`;
  const nodeSub = node.sub || (
    node.type === "review_blackhole" ? "\u5FA9\u7FD2\u30C1\u30E3\u30EC\u30F3\u30B8" :
    node.type === "game" ? "\u30DF\u30CB\u30B2\u30FC\u30E0" :
    "\u6B21\u306E\u30EC\u30C3\u30B9\u30F3\u306B\u6311\u6226\u3057\u3088\u3046"
  );

  return (
    <View style={heroStyles.wrapper}>
      <View style={heroStyles.inner}>
        {/* Atmospheric glow blobs */}
        <View style={heroStyles.blobTopRight} />
        <View style={heroStyles.blobBottomLeft} />

        <View style={heroStyles.top}>
          <PulseOrb size={56}>
            <View style={heroStyles.orb}>
              <Text style={{ fontSize: 24 }}>{emoji}</Text>
            </View>
          </PulseOrb>
          <View style={heroStyles.textWrap}>
            <Text style={heroStyles.label}>{nodeLabel}</Text>
            <Text style={heroStyles.sub}>{nodeSub}</Text>
            <View style={heroStyles.tags}>
              <View style={[heroStyles.tag, { backgroundColor: D.glowDim }]}>
                <Text style={[heroStyles.tagText, { color: D.glow }]}>+{node.xp || 24} XP</Text>
              </View>
              <View style={[heroStyles.tag, { backgroundColor: D.surface }]}>
                <Text style={[heroStyles.tagText, { color: D.sub }]}>{"\u7D045\u5206"}</Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable style={heroStyles.cta} onPress={onPress}>
          <Text style={heroStyles.ctaText}>{"\u30EC\u30C3\u30B9\u30F3\u3092\u59CB\u3081\u308B \u2192"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ==================== DARK NODE ROW ====================
function DarkNodeRow({ node, index, isDone, isLocked, onPress }: {
  node: TrailNode; index: number; isDone: boolean; isLocked: boolean; onPress: () => void;
}) {
  const isMilestone = (index + 1) % 5 === 0;
  const emoji = getEmoji(node.icon);
  const nodeLabel = node.label || `\u30EC\u30C3\u30B9\u30F3 ${index + 1}`;
  const nodeSub = node.sub || (
    node.type === "review_blackhole" ? "\u5FA9\u7FD2\u30C1\u30E3\u30EC\u30F3\u30B8" :
    node.type === "game" ? "\u30DF\u30CB\u30B2\u30FC\u30E0" : ""
  );

  const orbSize = isDone ? 48 : isMilestone ? 52 : 44;
  const orbBg = isDone ? D.successDim : isLocked ? D.lockedBg : D.surface;
  const orbBorder = isDone ? D.success : isLocked ? "rgba(255,255,255,0.1)" : D.line;
  const textOpacity = isDone ? 0.75 : isLocked ? 0.3 : 0.9;

  return (
    <Pressable
      style={nodeRowStyles.row}
      onPress={isLocked ? onPress : undefined}
      disabled={!isLocked}
    >
      <View style={[nodeRowStyles.orb, {
        width: orbSize, height: orbSize, borderRadius: orbSize / 2,
        backgroundColor: orbBg,
        borderWidth: isDone ? 2 : 1.5,
        borderColor: orbBorder,
        borderStyle: isLocked ? "dashed" as const : "solid" as const,
        ...(isDone ? {
          shadowColor: D.success,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
        } : {}),
      }]}>
        <Text style={{ fontSize: isDone ? 18 : isMilestone ? 20 : 16, opacity: textOpacity }}>
          {emoji}
        </Text>
        {isDone && <NodeSparkle />}
        {isDone && (
          <View style={nodeRowStyles.doneTick}>
            <Text style={nodeRowStyles.doneTickText}>{"\u2713"}</Text>
          </View>
        )}
      </View>

      <View style={nodeRowStyles.content}>
        <Text style={[nodeRowStyles.label, { opacity: textOpacity }]}>{nodeLabel}</Text>
        {nodeSub ? (
          <Text style={[nodeRowStyles.sub, { opacity: textOpacity * 0.7 }]}>{nodeSub}</Text>
        ) : null}
        {isDone && (
          <View style={nodeRowStyles.tags}>
            <View style={[nodeRowStyles.tag, { backgroundColor: D.successDim }]}>
              <Text style={[nodeRowStyles.tagText, { color: D.success }]}>+{node.xp || 8} XP</Text>
            </View>
            <Text style={[nodeRowStyles.tagText, { color: D.success, fontWeight: "600" }]}>{"\u5B8C\u4E86"}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ==================== MAIN TRAIL V3 ====================
export function TrailV3({
  trail, genre, completedCount = 0, totalCount = 0, totalXp = 0,
  streakDays = 0, chapterTitle, chapterDesc, onStart, onLockedPress,
}: Props) {
  const bottomTabBarHeight = useBottomTabBarHeight();
  const currentIndex = trail.findIndex(n => n.status === "current");
  const visibleTrail = trail.slice(0, Math.min(trail.length, 20));

  // Estimate height for background effects
  const estHeight = 420 + visibleTrail.length * 82 + 200;

  const stars = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * estHeight,
      size: i < 12 ? 2.5 + Math.random() * 1.5 : 0.8 + Math.random() * 1.2,
    })),
  [estHeight]);

  const particles = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      delay: Math.random() * 4000,
      size: 3 + Math.random() * 4,
      startX: 15 + Math.random() * (SCREEN_WIDTH - 30),
      startY: Math.random() * estHeight,
      moveX: 8 + Math.random() * 25,
      moveY: 12 + Math.random() * 35,
      duration: 2000 + Math.random() * 3000,
      color: FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)],
    })),
  [estHeight]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: D.bg }}
      contentContainerStyle={{ paddingBottom: bottomTabBarHeight + 40, minHeight: estHeight }}
    >
      {/* === BACKGROUND EFFECTS === */}
      <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
        {stars.map(s => <BackgroundStar key={`s-${s.id}`} x={s.x} y={s.y} size={s.size} />)}
        {particles.map(p => <FloatingParticle key={`p-${p.id}`} {...p} />)}
        <ShootingStar contentHeight={estHeight} />
      </View>

      {/* === CONTENT === */}
      <DarkHeader genre={genre} title={chapterTitle} desc={chapterDesc} streakDays={streakDays} />
      <DarkStats completed={completedCount} total={totalCount || trail.length} xp={totalXp} />

      {/* === TRAIL === */}
      <View style={trailStyles.container}>
        {/* Glowing spine */}
        <View style={trailStyles.spine}>
          {/* Done segment with glow */}
          {currentIndex > 0 && (
            <View style={[trailStyles.spineSeg, trailStyles.spineDone, {
              top: 12,
              height: Math.max(0, currentIndex) * 82,
            }]} />
          )}
          {/* Future segment */}
          <View style={[trailStyles.spineSeg, trailStyles.spineFuture, {
            top: currentIndex > 0 ? 12 + currentIndex * 82 : 12,
            height: Math.max(0, (visibleTrail.length - Math.max(currentIndex, 0))) * 82 + 40,
          }]} />
        </View>

        {/* Nodes */}
        {visibleTrail.map((node, index) => {
          const isDone = node.status === "done";
          const isCurrent = node.status === "current" && !node.isLocked;
          const isLocked = node.status === "locked" || node.status === "future" || !!node.isLocked;

          const prevNode = index > 0 ? visibleTrail[index - 1] : null;
          const showDivider = isLocked && prevNode && (prevNode.status === "current" || prevNode.status === "done");

          return (
            <React.Fragment key={node.id}>
              {showDivider && index === (currentIndex + 1) && (
                <View style={trailStyles.divider}>
                  <View style={trailStyles.dividerLine} />
                  <Text style={trailStyles.dividerText}>{"\u3064\u3065\u304D"}</Text>
                  <View style={trailStyles.dividerLine} />
                </View>
              )}
              {isCurrent ? (
                <DarkHeroCard
                  node={node}
                  index={index}
                  onPress={() => onStart?.(node.id)}
                />
              ) : (
                <DarkNodeRow
                  node={node}
                  index={index}
                  isDone={isDone}
                  isLocked={isLocked && !isCurrent}
                  onPress={() => {
                    if (node.isLocked) onLockedPress?.(node.id);
                    else onStart?.(node.id);
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ==================== STYLES ====================
const headerStyles = StyleSheet.create({
  container: {
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
    backgroundColor: D.glow,
    borderRadius: 3,
    shadowColor: D.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: D.glow,
  },
  h1: {
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 39,
    letterSpacing: -1,
    color: D.text,
  },
  desc: {
    fontSize: 15,
    lineHeight: 23,
    color: D.sub,
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
    backgroundColor: "rgba(255,150,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,150,0,0.25)",
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ff9600",
  },
});

const statsStyles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: D.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: D.line,
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
    color: D.text,
  },
  valSmall: {
    fontSize: 14,
    color: D.mute,
    fontWeight: "500",
  },
  label: {
    fontSize: 11,
    color: D.mute,
    fontWeight: "500",
    marginTop: 1,
  },
  divider: {
    width: 1,
    marginVertical: "25%",
    backgroundColor: D.line,
  },
});

const heroStyles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginVertical: 8,
  },
  inner: {
    backgroundColor: D.glass,
    borderWidth: 1.5,
    borderColor: "rgba(168,255,96,0.2)",
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
    // Glow effect
    shadowColor: D.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  blobTopRight: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    backgroundColor: "rgba(168,255,96,0.06)",
    borderRadius: 50,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    backgroundColor: "rgba(129,140,248,0.06)",
    borderRadius: 40,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: D.accentSoft,
    borderWidth: 2,
    borderColor: D.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: D.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 20,
    fontWeight: "800",
    color: D.text,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 13.5,
    color: D.sub,
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
    backgroundColor: D.glow,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: D.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaText: {
    color: "#0a0a2e",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});

const nodeRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 12,
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
    backgroundColor: D.success,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: D.bg,
  },
  doneTickText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "900",
  },
  content: {
    flex: 1,
    paddingTop: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: D.text,
    lineHeight: 20,
  },
  sub: {
    fontSize: 12.5,
    color: D.sub,
    lineHeight: 18,
    marginTop: 2,
  },
  tags: {
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
    backgroundColor: D.success,
    opacity: 0.5,
    shadowColor: D.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  spineFuture: {
    backgroundColor: "rgba(255,255,255,0.1)",
    opacity: 0.3,
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
    backgroundColor: D.line,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: D.mute,
  },
});
