import React, { useState, useEffect, useRef } from "react";
import { AppState, AppStateStatus, View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { theme } from "../../lib/theme";
import { GameResult } from "../../lib/games.extra";
import i18n from "../../lib/i18n";

interface Props {
  onDone: (result: GameResult) => void;
}

const PHASE_DURATIONS = [4000, 2000, 6000];
const TARGET_INTERVAL = 1000;

export function BreathTempo({ onDone }: Props) {
  const [phase, setPhase] = useState(0);
  const [taps, setTaps] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tapsRef = useRef<number[]>([]);
  const startedAtRef = useRef(Date.now());
  const phaseStartedAtRef = useRef(Date.now());
  const pausedAtRef = useRef<number | null>(null);
  const finishCalledRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const phases = [
    String(i18n.t("gameBreathTempo.phases.inhale")),
    String(i18n.t("gameBreathTempo.phases.hold")),
    String(i18n.t("gameBreathTempo.phases.exhale")),
  ];

  useEffect(() => {
    phaseStartedAtRef.current = Date.now();
    setPhaseProgress(0);
  }, [phase]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasActive = appStateRef.current === "active";
      const isNowActive = nextState === "active";
      appStateRef.current = nextState;

      if (wasActive && !isNowActive) {
        pausedAtRef.current = Date.now();
        setIsPaused(true);
        return;
      }

      if (!wasActive && isNowActive && pausedAtRef.current) {
        const pausedDuration = Date.now() - pausedAtRef.current;
        startedAtRef.current += pausedDuration;
        phaseStartedAtRef.current += pausedDuration;
        pausedAtRef.current = null;
        setIsPaused(false);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const remaining = Math.max(0, 60 - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        finish();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) return;

    const phaseDuration = PHASE_DURATIONS[phase % 3];
    const phaseTimer = setInterval(() => {
      const elapsed = Date.now() - phaseStartedAtRef.current;
      if (elapsed >= phaseDuration) {
        setPhase((prev) => prev + 1);
        return;
      }

      setPhaseProgress((elapsed / phaseDuration) * 100);
    }, 100);
    return () => clearInterval(phaseTimer);
  }, [phase, isPaused]);

  const handleTap = () => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current, now];
    setTaps(tapsRef.current);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const finish = () => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;

    const finalTaps = tapsRef.current;
    const intervals: number[] = [];
    for (let i = 1; i < finalTaps.length; i++) {
      intervals.push(finalTaps[i] - finalTaps[i - 1]);
    }

    const rmse = intervals.length > 0
      ? Math.sqrt(intervals.reduce((sum, val) => sum + Math.pow(val - TARGET_INTERVAL, 2), 0) / intervals.length)
      : 1000;

    const accuracy = Math.max(0, 1 - rmse / 500);
    const baseXp = 6;
    const bonusXp = Math.floor(accuracy * 6);

    onDone({
      xp: baseXp + bonusXp,
      mistakes: Math.floor((1 - accuracy) * 10),
      timeMs: Date.now() - startedAtRef.current,
      meta: { taps: finalTaps.length, rmse, accuracy },
    });
  };

  const currentPhase = phases[phase % 3];
  const arcAngle = (phaseProgress / 100) * 360;

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{i18n.t("gameBreathTempo.seconds", { count: timeLeft })}</Text>
      <Text style={styles.phaseLabel}>{currentPhase}</Text>

      <View style={styles.circle}>
        <View style={[styles.arc, { transform: [{ rotate: `${arcAngle}deg` }] }]} />
        <Animated.View style={[styles.innerCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.tapCount}>{taps.length}</Text>
        </Animated.View>
      </View>

      <Pressable style={styles.tapButton} onPress={handleTap}>
        <Text style={styles.tapText}>{i18n.t("gameBreathTempo.tap")}</Text>
      </Pressable>

      <Pressable style={styles.skipButton} onPress={finish}>
        <Text style={styles.skipText}>{i18n.t("gameBreathTempo.finish")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  timer: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.accent,
    marginBottom: theme.spacing.md,
  },
  phaseLabel: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: theme.spacing.xl,
  },
  arc: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: theme.colors.accent,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  innerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  tapCount: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.text,
  },
  tapButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 48,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.md,
  },
  tapText: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.bg,
  },
  skipButton: {
    paddingVertical: theme.spacing.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.sub,
  },
});
