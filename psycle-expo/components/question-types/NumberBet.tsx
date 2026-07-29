import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { hapticFeedback } from "../../lib/haptics";
import { theme } from "../../lib/theme";

const TRACK_INSET = 18;

/**
 * 数値予想。
 *
 * 先に自分の予想を確定させてから実際の値を見せる。確定後は自分の目盛りと
 * 実際の目盛りが同じ軸の上に並び、その距離がそのまま「どれだけ外したか」に
 * なる。答えだけを表示すると、この距離が消える。
 */
export function NumberBet({
  min,
  max,
  step,
  decimals,
  unit,
  value,
  answer,
  showResult,
  onChange,
  onLock,
  onDragStart,
  onDragEnd,
}: {
  min: number;
  max: number;
  step: number;
  decimals: number;
  unit: string;
  value: number | null;
  answer: number;
  showResult: boolean;
  onChange: (next: number) => void;
  onLock: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackPageXRef = useRef(0);
  const draft = value === null ? (min + max) / 2 : value;

  const stateRef = useRef({ draft, min, max, step, showResult, trackWidth, onChange, onDragStart, onDragEnd });
  stateRef.current = { draft, min, max, step, showResult, trackWidth, onChange, onDragStart, onDragEnd };

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackPageXRef.current = x;
      if (width > 0) setTrackWidth(width);
    });
  }, []);

  const quantize = useCallback((raw: number) => {
    const s = stateRef.current;
    const clamped = Math.min(s.max, Math.max(s.min, raw));
    const snapped = s.min + Math.round((clamped - s.min) / s.step) * s.step;
    return Math.min(s.max, Math.max(s.min, Number(snapped.toFixed(6))));
  }, []);

  // pageX（画面絶対座標）からトラック左端を引いて位置を出す。
  // locationX は触れた子ビュー基準になることがあり、値が飛ぶ。
  const setFromPageX = useCallback(
    (pageX: number) => {
      const s = stateRef.current;
      if (!s.trackWidth) return;
      const localX = pageX - trackPageXRef.current;
      const usable = Math.max(1, s.trackWidth - TRACK_INSET * 2);
      const ratio = Math.min(1, Math.max(0, (localX - TRACK_INSET) / usable));
      const next = quantize(s.min + ratio * (s.max - s.min));
      if (next !== s.draft) {
        s.onChange(next);
        void hapticFeedback.selection();
      }
    },
    [quantize]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !stateRef.current.showResult,
        onMoveShouldSetPanResponder: () => !stateRef.current.showResult,
        onMoveShouldSetPanResponderCapture: () => !stateRef.current.showResult,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (stateRef.current.showResult) return;
          stateRef.current.onDragStart?.();
          measureTrack();
          setFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          if (stateRef.current.showResult) return;
          setFromPageX(gestureState.moveX);
        },
        onPanResponderRelease: () => stateRef.current.onDragEnd?.(),
        onPanResponderTerminate: () => stateRef.current.onDragEnd?.(),
      }),
    [measureTrack, setFromPageX]
  );

  const ratioOf = (v: number) => {
    if (max === min) return 0;
    return Math.min(1, Math.max(0, (v - min) / (max - min)));
  };
  const usable = Math.max(1, trackWidth - TRACK_INSET * 2);
  const xOf = (v: number) => TRACK_INSET + ratioOf(v) * usable;

  const guessX = xOf(draft);
  const answerX = xOf(answer);
  const gapLeft = Math.min(guessX, answerX);
  const gapWidth = Math.abs(guessX - answerX);

  const onTrackLayout = () => measureTrack();

  return (
    <View style={styles.wrap} testID="number-bet">
      {!showResult ? (
        <>
          <Text style={styles.draftValue} testID="number-bet-draft">
            {draft.toFixed(decimals)}
          </Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </>
      ) : null}

      <View
        ref={trackRef}
        style={styles.track}
        onLayout={onTrackLayout}
        {...(showResult ? {} : panResponder.panHandlers)}
        testID="number-bet-track"
      >
        <View style={styles.rail} />

        {showResult ? (
          <View
            style={[styles.gapBand, { left: gapLeft, width: gapWidth }]}
            testID="number-bet-gap"
          />
        ) : null}

        <View style={[styles.pin, { left: guessX }]}>
          {showResult ? <Text style={styles.pinNumGuess}>{draft.toFixed(decimals)}</Text> : null}
          <View style={[styles.pinBar, styles.pinBarGuess]} />
          {showResult ? <Text style={styles.pinCapGuess}>あなた</Text> : null}
        </View>

        {showResult ? (
          <View style={[styles.pin, { left: answerX }]} testID="number-bet-answer-pin">
            <Text style={styles.pinNumTruth}>{answer.toFixed(decimals)}</Text>
            <View style={[styles.pinBar, styles.pinBarTruth]} />
            <Text style={styles.pinCapTruth}>実際</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.ends}>
        <Text style={styles.endLabel}>{min.toFixed(decimals)}</Text>
        <Text style={styles.endLabel}>{max.toFixed(decimals)}</Text>
      </View>

      {showResult ? (
        unit ? <Text style={styles.unitAfter}>{unit}</Text> : null
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="この予想で賭ける"
          onPress={() => {
            void hapticFeedback.medium();
            onLock();
          }}
          style={({ pressed }) => [styles.lockButton, pressed && styles.lockButtonPressed]}
          testID="number-bet-lock"
        >
          <Text style={styles.lockLabel}>この予想で賭ける</Text>
        </Pressable>
      )}
    </View>
  );
}

const GUESS = "#6E8FD9";
const TRUTH = "#E5A93C";

const styles = StyleSheet.create({
  draftValue: {
    color: GUESS,
    fontSize: 46,
    fontWeight: "700",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  endLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  ends: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 2,
  },
  gapBand: {
    backgroundColor: "rgba(148,163,184,0.35)",
    borderRadius: 2,
    bottom: 14,
    height: 4,
    position: "absolute",
  },
  lockButton: {
    alignItems: "center",
    backgroundColor: GUESS,
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 52,
    paddingHorizontal: 20,
  },
  lockButtonPressed: {
    opacity: 0.8,
  },
  lockLabel: {
    color: "#0b1220",
    fontSize: 16,
    fontWeight: "700",
  },
  pin: {
    alignItems: "center",
    bottom: 10,
    position: "absolute",
    transform: [{ translateX: -30 }],
    width: 60,
  },
  pinBar: {
    borderRadius: 1,
    height: 30,
    width: 2,
  },
  pinBarGuess: { backgroundColor: GUESS },
  pinBarTruth: { backgroundColor: TRUTH },
  pinCapGuess: {
    color: GUESS,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  pinCapTruth: {
    color: TRUTH,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  pinNumGuess: {
    color: GUESS,
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  pinNumTruth: {
    color: TRUTH,
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  rail: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 2,
    bottom: 14,
    height: 4,
    left: TRACK_INSET,
    position: "absolute",
    right: TRACK_INSET,
  },
  track: {
    height: 92,
    justifyContent: "flex-end",
    marginTop: 20,
  },
  unit: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  unitAfter: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  wrap: {
    marginBottom: 8,
    paddingTop: 8,
  },
});
