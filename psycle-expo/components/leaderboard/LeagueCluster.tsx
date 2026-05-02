import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import type { LeagueInfo, LeagueMember } from "../../lib/league";

interface LeagueClusterProps {
  leagueInfo: LeagueInfo;
  themeColor: string;
  size: number;
  onMemberPress?: (member: LeagueMember) => void;
}

interface PlacedMember {
  member: LeagueMember;
  x: number;
  y: number;
  starSize: number;
  zone: "promotion" | "safe" | "demotion";
}

// 安定した角度ジッタ
function hashToUnit(str: string, salt: number): number {
  let h = salt ^ 0x9e3779b9;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x85ebca6b);
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 0xc2b2ae35);
  h ^= h >>> 16;
  return ((h >>> 0) % 10000) / 10000;
}

function placeMembers(
  members: LeagueMember[],
  promotionZone: number,
  demotionZone: number,
  totalMembers: number,
  innerR: number,
  outerR: number
): { self: PlacedMember | null; others: PlacedMember[] } {
  if (members.length === 0) return { self: null, others: [] };
  const maxWeeklyXp = Math.max(1, ...members.map((m) => m.weekly_xp));

  // 自分以外のメンバーだけ配置
  const sorted = [...members].sort((a, b) => a.rank - b.rank);
  const ringRange = outerR - innerR;

  let self: PlacedMember | null = null;
  const others: PlacedMember[] = [];

  sorted.forEach((member, index) => {
    const xpRatio = member.weekly_xp / maxWeeklyXp;
    const starSize = 7 + xpRatio * 9; // 7..16

    const zone: "promotion" | "safe" | "demotion" =
      member.rank <= promotionZone
        ? "promotion"
        : member.rank > demotionZone
          ? "demotion"
          : "safe";

    if (member.is_self) {
      self = { member, x: 0, y: 0, starSize: starSize + 4, zone };
      return;
    }

    // 順位が高い = 中心に近い
    const rankRatio = Math.min(1, (member.rank - 1) / Math.max(1, totalMembers - 1));
    const radius = innerR + rankRatio * ringRange;
    const angleJitter = (hashToUnit(member.user_id, 7) - 0.5) * 0.4;
    const base = -Math.PI / 2 + (index / sorted.length) * Math.PI * 2;
    const angle = base + angleJitter;

    others.push({
      member,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      starSize,
      zone,
    });
  });

  return { self, others };
}

function MemberStar({
  placed,
  center,
  themeColor,
  onPress,
}: {
  placed: PlacedMember;
  center: number;
  themeColor: string;
  onPress?: () => void;
}) {
  const x = center + placed.x;
  const y = center + placed.y;

  const zoneColor =
    placed.zone === "promotion"
      ? "#fde68a" // 金: 昇格ゾーン
      : placed.zone === "demotion"
        ? "rgba(255,255,255,0.45)" // 薄白: 降格ゾーン
        : "rgba(255,255,255,0.85)"; // 白: 安全ゾーン

  const opacity = useRef(
    new Animated.Value(placed.zone === "promotion" ? 0.75 : 0.85)
  ).current;
  useEffect(() => {
    if (placed.zone !== "promotion") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [placed.zone]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${placed.member.username} ${placed.member.rank}位 ${placed.member.weekly_xp}XP`}
      style={({ pressed }) => [
        styles.hit,
        {
          left: x - 22,
          top: y - 22,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Animated.View
        style={{
          width: placed.starSize,
          height: placed.starSize,
          borderRadius: placed.starSize / 2,
          backgroundColor: zoneColor,
          opacity,
          shadowColor: zoneColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.85,
          shadowRadius: placed.starSize * 0.9,
        }}
      />
      {placed.member.rank <= 3 && (
        <Text style={styles.rankBadge}>#{placed.member.rank}</Text>
      )}
    </Pressable>
  );
}

export function LeagueCluster({
  leagueInfo,
  themeColor,
  size,
  onMemberPress,
}: LeagueClusterProps) {
  const center = size / 2;
  const innerR = size * 0.14;
  const outerR = size * 0.42;

  const { self, others } = useMemo(
    () =>
      placeMembers(
        leagueInfo.members,
        leagueInfo.promotion_zone,
        leagueInfo.demotion_zone,
        leagueInfo.members.length,
        innerR,
        outerR
      ),
    [leagueInfo, innerR, outerR]
  );

  // 昇格ゾーンリングの半径計算 (promotion_zone 番目の位置)
  const promotionRingR = useMemo(() => {
    const totalMembers = leagueInfo.members.length;
    const ratio = Math.min(1, (leagueInfo.promotion_zone) / Math.max(1, totalMembers - 1));
    return innerR + ratio * (outerR - innerR);
  }, [leagueInfo.promotion_zone, leagueInfo.members.length, innerR, outerR]);

  // 降格ゾーンリングの半径計算
  const demotionRingR = useMemo(() => {
    const totalMembers = leagueInfo.members.length;
    const ratio = Math.min(1, (leagueInfo.demotion_zone - 1) / Math.max(1, totalMembers - 1));
    return innerR + ratio * (outerR - innerR);
  }, [leagueInfo.demotion_zone, leagueInfo.members.length, innerR, outerR]);

  // 自分の呼吸
  const selfPulse = useRef(new Animated.Value(1)).current;
  const selfOpacity = useRef(new Animated.Value(0.88)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(selfPulse, {
            toValue: 1.12,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(selfOpacity, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(selfPulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(selfOpacity, {
            toValue: 0.88,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="leagueAura" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={themeColor} stopOpacity="0.28" />
            <Stop offset="55%" stopColor={themeColor} stopOpacity="0.07" />
            <Stop offset="100%" stopColor={themeColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={size * 0.47}
          fill="url(#leagueAura)"
        />

        {/* 昇格ゾーンリング: 金色細線 */}
        <Circle
          cx={center}
          cy={center}
          r={promotionRingR + 6}
          stroke="#fde68a"
          strokeOpacity={0.45}
          strokeWidth={0.8}
          strokeDasharray="2 4"
          fill="none"
        />
        {/* 降格ゾーンリング: 薄赤破線 */}
        <Circle
          cx={center}
          cy={center}
          r={demotionRingR + 6}
          stroke="#fb7185"
          strokeOpacity={0.28}
          strokeWidth={0.6}
          strokeDasharray="1 5"
          fill="none"
        />
      </Svg>

      {/* 中央: 自分 */}
      {self && (
        <>
          <Animated.View
            style={[
              styles.selfStar,
              {
                left: center - 18,
                top: center - 18,
                opacity: selfOpacity,
                transform: [{ scale: selfPulse }],
                borderColor: themeColor,
                shadowColor: themeColor,
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.selfCore, { backgroundColor: themeColor }]} />
          </Animated.View>
          <Text
            style={[
              styles.selfLabel,
              { top: center + 24, left: 0, width: size },
            ]}
            pointerEvents="none"
          >
            あなた #{self.member.rank}
          </Text>
        </>
      )}

      {/* 他メンバー */}
      {others.map((p) => (
        <MemberStar
          key={p.member.user_id}
          placed={p}
          center={center}
          themeColor={themeColor}
          onPress={() => onMemberPress?.(p.member)}
        />
      ))}

      {/* ゾーンラベル */}
      <Text
        style={[styles.zoneLabel, { top: 6, color: "#fde68a" }]}
        pointerEvents="none"
      >
        promotion
      </Text>
      <Text
        style={[styles.zoneLabel, { bottom: 6, color: "#fb7185" }]}
        pointerEvents="none"
      >
        demotion
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "center",
    position: "relative",
  },
  selfStar: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  selfCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  selfLabel: {
    position: "absolute",
    textAlign: "center",
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  hit: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadge: {
    position: "absolute",
    top: 30,
    color: "rgba(255,255,255,0.68)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  zoneLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.7,
  },
});
