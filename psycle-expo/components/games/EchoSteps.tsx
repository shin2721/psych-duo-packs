import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { GameResult } from "../../lib/games.extra";
import i18n from "../../lib/i18n";

interface Props {
  onDone: (result: GameResult) => void;
}

const ICON_POOL = ["leaf", "flower", "sparkles", "heart", "star", "flash", "water", "flame"];

export function EchoSteps({ onDone }: Props) {
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [showing, setShowing] = useState(true);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    generateSequence();
  }, [round]);

  useEffect(() => {
    if (showing) {
      const timer = setTimeout(() => setShowing(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showing]);

  const generateSequence = () => {
    const length = Math.min(3 + round, 5);
    const seq = Array.from({ length }, () => ICON_POOL[Math.floor(Math.random() * ICON_POOL.length)]);
    setSequence(seq);
    setUserInput([]);
    setShowing(true);
  };

  const handleIconTap = (icon: string) => {
    const nextIndex = userInput.length;
    const correct = sequence[nextIndex] === icon;

    if (!correct) {
      setMistakes((m) => m + 1);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      return;
    }

    const newInput = [...userInput, icon];
    setUserInput(newInput);

    if (newInput.length === sequence.length) {
      if (round >= 3) {
        finish();
      } else {
        setTimeout(() => setRound((r) => r + 1), 500);
      }
    }
  };

  const finish = () => {
    const baseXp = 8;
    const bonus = mistakes === 0 ? 5 : 0;
    onDone({
      xp: baseXp + bonus,
      mistakes,
      timeMs: Date.now() - startTime,
      meta: { rounds: round },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("gameEchoSteps.round", { round })}</Text>
      <Text style={styles.subtitle}>{i18n.t("gameEchoSteps.mistakes", { count: mistakes })}</Text>

      <Animated.View style={[styles.sequenceBox, { transform: [{ translateX: shakeAnim }] }]}>
        {showing ? (
          <View style={styles.iconRow}>
            {sequence.map((icon, i) => (
              <View key={i} style={styles.iconCard}>
                <Ionicons name={icon as any} size={32} color={theme.colors.accent} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.iconRow}>
            {sequence.map((_, i) => (
              <View key={i} style={[styles.iconCard, userInput[i] && styles.iconCardFilled]}>
                {userInput[i] && <Ionicons name={userInput[i] as any} size={32} color={theme.colors.success} />}
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {!showing && (
        <View style={styles.pool}>
          {ICON_POOL.map((icon) => (
            <Pressable key={icon} style={styles.poolIcon} onPress={() => handleIconTap(icon)}>
              <Ionicons name={icon as any} size={28} color={theme.colors.text} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.sub,
    marginBottom: theme.spacing.xl,
  },
  sequenceBox: {
    marginBottom: theme.spacing.xl,
  },
  iconRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  iconCard: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.line,
  },
  iconCardFilled: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.card,
  },
  pool: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    justifyContent: "center",
    maxWidth: 320,
  },
  poolIcon: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
