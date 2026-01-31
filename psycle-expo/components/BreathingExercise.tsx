import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";

interface BreathingConfig {
  type: "breathing_478" | "breathing_box" | "breathing_coherence";
  cycles: number;
  inhale: number;
  hold: number;
  exhale: number;
  animation: "circle_expand_contract";
  haptic: boolean;
}

interface Props {
  config: BreathingConfig;
  onComplete: () => void;
}

type Phase = "inhale" | "hold" | "exhale" | "pause";

export function BreathingExercise({ config, onComplete }: Props) {
  const [currentCycle, setCurrentCycle] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<Phase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(config.inhale);
  const [isComplete, setIsComplete] = useState(false);

  const circleScale = useRef(new Animated.Value(0.5)).current;
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Circle animation
  useEffect(() => {
    if (currentPhase === "inhale") {
      // Expand
      Animated.timing(circleScale, {
        toValue: 1,
        duration: config.inhale * 1000,
        useNativeDriver: true,
      }).start();
    } else if (currentPhase === "exhale") {
      // Contract
      Animated.timing(circleScale, {
        toValue: 0.5,
        duration: config.exhale * 1000,
        useNativeDriver: true,
      }).start();
    }
    // Hold: no animation change
  }, [currentPhase, config.inhale, config.exhale]);

  // Phase progression
  useEffect(() => {
    if (isComplete) return;

    const phaseDurations: Record<Phase, number> = {
      inhale: config.inhale,
      hold: config.hold,
      exhale: config.exhale,
      pause: 1, // 1 second pause between cycles
    };

    const currentDuration = phaseDurations[currentPhase];
    setSecondsLeft(currentDuration);

    // Haptic feedback at phase start
    if (config.haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Countdown timer
    let countdown = currentDuration;
    countdownTimerRef.current = setInterval(() => {
      countdown--;
      setSecondsLeft(countdown);
      if (countdown === 0 && countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }, 1000);

    // Phase transition timer
    phaseTimerRef.current = setTimeout(() => {
      const nextPhase: Record<Phase, Phase | null> = {
        inhale: "hold",
        hold: "exhale",
        exhale: currentCycle < config.cycles - 1 ? "pause" : null,
        pause: "inhale",
      };

      const next = nextPhase[currentPhase];

      if (next === null) {
        // Exercise complete
        setIsComplete(true);
        if (config.haptic) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setTimeout(() => onComplete(), 500);
      } else if (next === "pause") {
        setCurrentPhase("pause");
      } else if (next === "inhale" && currentPhase === "pause") {
        setCurrentCycle((prev) => prev + 1);
        setCurrentPhase("inhale");
      } else {
        setCurrentPhase(next);
      }
    }, currentDuration * 1000);

    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [currentPhase, currentCycle, config, isComplete, onComplete]);

  const phaseLabels: Record<Phase, string> = {
    inhale: "吸う",
    hold: "止める",
    exhale: "吐く",
    pause: "休憩",
  };

  const phaseColors: Record<Phase, string> = {
    inhale: "#3b82f6", // Blue
    hold: "#8b5cf6", // Purple
    exhale: "#10b981", // Green
    pause: "#6b7280", // Gray
  };

  return (
    <View style={styles.container}>
      <Text style={styles.cycleText}>
        {currentCycle + 1} / {config.cycles}
      </Text>

      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: phaseColors[currentPhase],
              transform: [{ scale: circleScale }],
            },
          ]}
        />
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.phaseText}>{phaseLabels[currentPhase]}</Text>
        <Text style={styles.countdownText}>{secondsLeft}</Text>
      </View>

      {isComplete && (
        <Text style={styles.completeText}>完了！</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cycleText: {
    fontSize: 18,
    color: "#9ca3af",
    marginBottom: 32,
  },
  circleContainer: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  circle: {
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  instructionContainer: {
    alignItems: "center",
  },
  phaseText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 64,
    fontWeight: "800",
    color: "#fff",
  },
  completeText: {
    position: "absolute",
    bottom: 48,
    fontSize: 24,
    fontWeight: "700",
    color: "#10b981",
  },
});
