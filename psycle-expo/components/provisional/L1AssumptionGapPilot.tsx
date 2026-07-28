import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StarBackground } from "../StarBackground";
import { hapticFeedback } from "../../lib/haptics";

const COLORS = {
  bg: "#050713",
  card: "rgba(18, 20, 43, 0.94)",
  cardStrong: "#151630",
  line: "rgba(255, 255, 255, 0.10)",
  muted: "#9A9DB2",
  pink: "#F13F9D",
  pinkSoft: "rgba(241, 63, 157, 0.15)",
  text: "#F7F7FC",
  violet: "#9B87F5",
  violetSoft: "rgba(155, 135, 245, 0.14)",
  warning: "#F3B45C",
};

type Interpretation = {
  label: string;
  premise: string;
};

type SceneId = "reply" | "short" | "change" | "example";

type Scene = {
  id: SceneId;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  fact: string;
  interpretations: Interpretation[];
  checkpoint: string;
};

const DISCOVERY_INTERPRETATIONS = [
  "少し呆れている",
  "助けようとした",
  "急いでいただけ",
];

const SCENES: Scene[] = [
  {
    id: "reply",
    icon: "chatbubble-ellipses-outline",
    label: "返信が来ない",
    fact: "昨夜送った「明日どうする？」に、昼になっても返信がない。",
    interpretations: [
      {
        label: "行きたくなくなった",
        premise: "返信がない理由は、あなたとの予定にある",
      },
      {
        label: "後回しにされている",
        premise: "相手は読める状態で、返さないことを選んでいる",
      },
      {
        label: "忙しくて見られていない",
        premise: "相手には、返信できない事情がある",
      },
    ],
    checkpoint: "返信が来て、その内容を読んだ時",
  },
  {
    id: "short",
    icon: "remove-circle-outline",
    label: "短い返事が来た",
    fact: "相談を送ったら、「了解」とだけ返ってきた。",
    interpretations: [
      {
        label: "怒っている",
        premise: "短い返事は、怒りを伝えるためのものだ",
      },
      {
        label: "話を切り上げたい",
        premise: "相手は、これ以上やり取りしたくない",
      },
      {
        label: "急いでいるだけ",
        premise: "相手は、長く返せない状況にいる",
      },
    ],
    checkpoint: "次のやり取りか、相手の意図を確かめた時",
  },
  {
    id: "change",
    icon: "calendar-outline",
    label: "予定を変えられた",
    fact: "「今日の予定、来週でもいい？」と届いた。",
    interpretations: [
      {
        label: "会いたくなくなった",
        premise: "変更の理由は、あなたに会いたくないからだ",
      },
      {
        label: "自分は後回しだ",
        premise: "別の予定を、あなたより優先した",
      },
      {
        label: "急な事情が入った",
        premise: "相手には、予定を変える必要が生まれた",
      },
    ],
    checkpoint: "理由が届くか、次の日程が決まった時",
  },
  {
    id: "example",
    icon: "sparkles-outline",
    label: "例で試す",
    fact: "上司から「さっきの資料、直しておいた。」と届いた。",
    interpretations: [
      {
        label: "少し呆れている",
        premise: "直したことを伝えたのは、呆れた気持ちを示すためだ",
      },
      {
        label: "助けようとした",
        premise: "上司は、あなたの負担を減らそうとした",
      },
      {
        label: "急いでいただけ",
        premise: "上司は、先に資料を完成させる必要があった",
      },
    ],
    checkpoint: "次の会話か、直した意図を確かめた時",
  },
];

type TomorrowAnswer = "arrived" | "not-yet" | null;

export default function L1AssumptionGapPilot() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [discoveryChoice, setDiscoveryChoice] = useState<string | null>(null);
  const [sceneId, setSceneId] = useState<SceneId | null>(null);
  const [firstChoice, setFirstChoice] = useState<string | null>(null);
  const [premiseRemoved, setPremiseRemoved] = useState(false);
  const [secondChoice, setSecondChoice] = useState<string | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [tomorrowAnswer, setTomorrowAnswer] = useState<TomorrowAnswer>(null);
  const inkProgress = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const hasMountedRef = useRef(false);

  const scene = useMemo(
    () => SCENES.find((item) => item.id === sceneId) ?? null,
    [sceneId]
  );

  const firstInterpretation = useMemo(
    () => scene?.interpretations.find((item) => item.label === firstChoice) ?? null,
    [firstChoice, scene]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ animated: false, y: 0 });

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const announcements = [
      "発見。この一文、何に見えた？",
      "自分の生活へ。今日、近かったのは？",
      "1回目。いまの読みを、一度残す",
      premiseRemoved
        ? "2回目。空欄を外したまま、もう一度"
        : "空欄を外す。その結論には、見えない1行がいる",
      "持ち帰り。今日のレンズ",
    ];
    AccessibilityInfo.announceForAccessibility(announcements[step]);
  }, [premiseRemoved, step]);

  const handleDiscoveryChoice = (choice: string) => {
    setDiscoveryChoice(choice);
    inkProgress.setValue(0);
    Animated.timing(inkProgress, {
      duration: 900,
      toValue: 1,
      useNativeDriver: false,
    }).start();
    void hapticFeedback.selection();
  };

  const goToStep = (next: number) => {
    setStep(next);
    void hapticFeedback.light();
  };

  const resetPractice = () => {
    setSceneId(null);
    setFirstChoice(null);
    setPremiseRemoved(false);
    setSecondChoice(null);
    setRecorded(false);
    setTomorrowAnswer(null);
    goToStep(1);
  };

  const renderDiscovery = () => (
    <>
      <SectionLead
        kicker="DISCOVERY · 先に直感"
        title="この一文、何に見えた？"
        body="正解はありません。読んだ瞬間に浮かんだ続きを1つ。"
      />

      <View style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>上</Text>
          </View>
          <Text style={styles.messageSender}>上司</Text>
          <Text style={styles.messageTime}>14:18</Text>
        </View>
        <Text style={styles.messageText}>さっきの資料、直しておいた。</Text>
      </View>

      <View style={styles.optionStack}>
        {(discoveryChoice ? [discoveryChoice] : DISCOVERY_INTERPRETATIONS).map((choice) => (
          <ChoiceButton
            key={choice}
            label={choice}
            selected={discoveryChoice === choice}
            onPress={() => handleDiscoveryChoice(choice)}
            testID={`discovery-choice-${choice}`}
          />
        ))}
      </View>

      {discoveryChoice ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDiscoveryChoice(null)}
            style={styles.reselectButton}
            testID="reselect-discovery"
          >
            <Ionicons name="pencil" size={14} color={COLORS.violet} />
            <Text style={styles.reselectText}>別の読みを仮置きする</Text>
          </Pressable>
          <View style={styles.inkReveal} testID="discovery-reveal">
            <Text style={styles.inkRevealLabel}>いま頭にできた一文</Text>
            <Text style={styles.inkSentence}>
              上司は、
              <Animated.Text
                style={{
                  color: inkProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [COLORS.pink, COLORS.text],
                  }),
                }}
              >
                {discoveryChoice}
              </Animated.Text>
              。
            </Text>
            <Animated.View
              style={[
                styles.inkUnderline,
                {
                  opacity: inkProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                },
              ]}
            />
            <Text style={styles.revealCopy}>
              下線が消えると、最初から書かれていた文に見える。でも、この一文は元の画面にはない。
            </Text>
          </View>
        </>
      ) : null}
    </>
  );

  const renderSceneChoice = () => (
    <>
      <SectionLead
        kicker="TRANSFER · 自分の生活へ"
        title="今日、近かったのは？"
        body="自由記述なし・保存なし。近い場面を1つ。なければ例で試せます。"
      />

      <View style={styles.sceneGrid}>
        {SCENES.map((item) => {
          const selected = item.id === sceneId;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                setSceneId(item.id);
                setFirstChoice(null);
                setSecondChoice(null);
                void hapticFeedback.selection();
              }}
              style={({ pressed }) => [
                styles.sceneCard,
                selected && styles.sceneCardSelected,
                pressed && styles.pressed,
              ]}
              testID={`scene-${item.id}`}
            >
              <View style={[styles.sceneIcon, selected && styles.sceneIconSelected]}>
                <Ionicons
                  name={item.icon}
                  size={21}
                  color={selected ? COLORS.pink : COLORS.violet}
                />
              </View>
              <Text style={[styles.sceneLabel, selected && styles.sceneLabelSelected]}>
                {item.label}
              </Text>
              <Ionicons
                name={selected ? "checkmark-circle" : "chevron-forward"}
                size={20}
                color={selected ? COLORS.pink : COLORS.muted}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.safetyContrast} testID="safety-contrast">
        <View style={styles.safetyIcon}>
          <Ionicons name="shield-checkmark" size={19} color={COLORS.warning} />
        </View>
        <View style={styles.safetyCopy}>
          <Text style={styles.safetyEyebrow}>これは待たない</Text>
          <Text style={styles.safetyText}>
            見覚えのないログイン通知・脅迫・明示的な危険は、空欄を考える前に確認する。
          </Text>
        </View>
      </View>
    </>
  );

  const renderCommit = () => {
    if (!scene) return null;
    return (
      <>
        <SectionLead
          kicker="COMMIT · 1回目"
          title="いまの読みを、一度残す"
          body="安心できる答えではなく、この瞬間にいちばん浮かんだものを選びます。"
        />

        <FactCard fact={scene.fact} />

        <Text style={styles.questionLabel}>この場面は、どういうことに見える？</Text>
        <View style={styles.optionStack}>
          {(firstChoice
            ? scene.interpretations.filter((item) => item.label === firstChoice)
            : scene.interpretations
          ).map((item) => (
            <ChoiceButton
              key={item.label}
              label={item.label}
              selected={firstChoice === item.label}
              onPress={() => {
                setFirstChoice(item.label);
                void hapticFeedback.selection();
              }}
              testID={`first-choice-${item.label}`}
            />
          ))}
        </View>
        {firstChoice ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setFirstChoice(null)}
            style={styles.reselectButton}
            testID="reselect-first-choice"
          >
            <Ionicons name="pencil" size={14} color={COLORS.violet} />
            <Text style={styles.reselectText}>別の読みを仮置きする</Text>
          </Pressable>
        ) : null}

        <Text style={styles.noScoreCopy}>正解の提出ではなく、いまの読みの仮置きです。</Text>
      </>
    );
  };

  const renderRecheck = () => {
    if (!scene || !firstChoice || !firstInterpretation) return null;

    if (!premiseRemoved) {
      return (
        <>
          <SectionLead
            kicker="REMOVE · 空欄を外す"
            title="その結論には、見えない1行がいる"
            body="最初の読みを否定せず、支えている前提だけを画面から外します。"
          />

          <View style={styles.conclusionCard}>
            <Text style={styles.cardCaption}>あなたが残した読み</Text>
            <Text style={styles.conclusionText}>{firstChoice}</Text>
          </View>

          <View style={styles.premiseCard} testID="premise-card">
            <View style={styles.premiseTopRow}>
              <Ionicons name="add-circle" size={21} color={COLORS.pink} />
              <Text style={styles.premiseTopLabel}>この結論に必要な、まだ見えない1行</Text>
            </View>
            <Text style={styles.premiseText}>{firstInterpretation.premise}</Text>
            <View style={styles.unconfirmedPill}>
              <Text style={styles.unconfirmedText}>画面からは未確認</Text>
            </View>
          </View>

          <View style={styles.factVsPremise}>
            <View style={styles.miniColumn}>
              <Text style={styles.miniColumnLabel}>見えた</Text>
              <Text style={styles.miniColumnText}>{scene.fact}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.miniColumn}>
              <Text style={[styles.miniColumnLabel, { color: COLORS.pink }]}>足した</Text>
              <Text style={styles.miniColumnText}>{firstInterpretation.premise}</Text>
            </View>
          </View>
        </>
      );
    }

    const recheckOptions = [
      ...scene.interpretations.map((item) => item.label),
      "まだ決めない",
    ];

    return (
      <>
        <SectionLead
          kicker="RECHECK · 2回目"
          title="空欄を外したまま、もう一度"
          body="結論が同じでも大丈夫。変えるためではなく、扱い方を確かめます。"
        />

        <FactCard fact={scene.fact} />

        <View style={styles.removedPremise} testID="removed-premise">
          <Ionicons name="remove-circle" size={20} color={COLORS.violet} />
          <Text style={styles.removedPremiseText}>{firstInterpretation.premise}</Text>
          <Text style={styles.removedBadge}>未確認へ戻した</Text>
        </View>

        <Text style={styles.questionLabel}>いまの扱いに、いちばん近いのは？</Text>
        <View style={styles.compactChoiceGrid}>
          {(secondChoice ? [secondChoice] : recheckOptions).map((choice) => (
            <CompactChoiceButton
              key={choice}
              label={choice}
              selected={secondChoice === choice}
              onPress={() => {
                setSecondChoice(choice);
                void hapticFeedback.selection();
              }}
              testID={`second-choice-${choice}`}
            />
          ))}
        </View>
        {secondChoice ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setSecondChoice(null)}
            style={styles.reselectButton}
            testID="reselect-second-choice"
          >
            <Ionicons name="pencil" size={14} color={COLORS.violet} />
            <Text style={styles.reselectText}>もう一度、仮置きする</Text>
          </Pressable>
        ) : null}
      </>
    );
  };

  const renderResult = () => {
    if (!scene || !firstChoice || !firstInterpretation || !secondChoice) return null;
    const unchanged = firstChoice === secondChoice;

    return (
      <>
        <SectionLead
          kicker="LENS · 持ち帰る"
          title={unchanged ? "結論は同じ。それでも、分けられた" : "1行を外すと、読みが動いた"}
          body={
            unchanged
              ? "最初の読みを、確認済みの事実から未確認の読みへ戻しました。"
              : "正解に近づいたのではなく、最初の前提なしでもう一度選びました。"
          }
        />

        <View style={styles.deltaCard} testID="result-delta">
          <View style={styles.deltaRow}>
            <Text style={styles.deltaLabel}>最初</Text>
            <Text style={styles.deltaValue}>{firstChoice}</Text>
          </View>
          <View style={styles.deltaArrow}>
            <Ionicons name="arrow-down" size={18} color={COLORS.violet} />
            <Text style={styles.deltaArrowText}>未確認の1行を外す</Text>
          </View>
          <View style={styles.deltaRow}>
            <Text style={[styles.deltaLabel, { color: COLORS.pink }]}>いま</Text>
            <Text style={styles.deltaValue}>{secondChoice}</Text>
          </View>
        </View>

        <LinearGradient
          colors={["rgba(241,63,157,0.22)", "rgba(155,135,245,0.13)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lensCard}
        >
          <Text style={styles.lensLabel}>今日のレンズ</Text>
          <Text style={styles.lensText}>
            この結論のうち、{"\n"}書かれていなかった一文はどれ？
          </Text>
        </LinearGradient>

        <View style={styles.threeLineCard}>
          <ResultLine label="見えたもの" value={scene.fact} />
          <ResultLine label="自分が足した一文" value={firstInterpretation.premise} accent />
          <ResultLine label="答え合わせ" value={scene.checkpoint} last />
        </View>

        {!recorded ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setRecorded(true);
              void hapticFeedback.success();
            }}
            style={({ pressed }) => [styles.recordButton, pressed && styles.pressed]}
            testID="record-practice"
          >
            <View style={styles.recordIcon}>
              <Ionicons name="leaf" size={20} color={COLORS.pink} />
            </View>
            <View style={styles.recordCopy}>
              <Text style={styles.recordTitle}>生活に当てた1回として残す</Text>
              <Text style={styles.recordSub}>任意・無罰。この試作では閉じると消えます。</Text>
            </View>
            <Ionicons name="add" size={22} color={COLORS.muted} />
          </Pressable>
        ) : (
          <View style={styles.tomorrowCard} testID="tomorrow-check">
            <View style={styles.tomorrowHeader}>
              <View style={styles.recordIcon}>
                <Ionicons name="checkmark" size={20} color={COLORS.pink} />
              </View>
              <View>
                <Text style={styles.tomorrowKicker}>生活に当てた 1回</Text>
                <Text style={styles.tomorrowTitle}>翌日の1タップを試す</Text>
              </View>
            </View>
            <Text style={styles.tomorrowQuestion}>その空欄に、答えは入った？</Text>
            <View style={styles.tomorrowActions}>
              <SmallChoice
                label="入った"
                selected={tomorrowAnswer === "arrived"}
                onPress={() => setTomorrowAnswer("arrived")}
                testID="tomorrow-arrived"
              />
              <SmallChoice
                label="まだ入っていない"
                selected={tomorrowAnswer === "not-yet"}
                onPress={() => setTomorrowAnswer("not-yet")}
                testID="tomorrow-not-yet"
              />
            </View>
            {tomorrowAnswer ? (
              <Text style={styles.tomorrowFeedback} testID="tomorrow-feedback">
                {tomorrowAnswer === "arrived"
                  ? "最初の読みと比べる材料が、1つ増えました。"
                  : "空欄はまだ空欄。未確認のまま残せます。"}
              </Text>
            ) : null}
            <Text style={styles.prototypeNote}>試作のため今すぐ表示。保存・通知はしません。</Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={resetPractice}
          style={({ pressed }) => [
            styles.inlineRepeatButton,
            pressed && styles.pressed,
          ]}
          testID="l1-pilot-primary"
        >
          <Text style={styles.inlineRepeatText}>別の場面でもう1回</Text>
          <Ionicons name="refresh" size={18} color={COLORS.violet} />
        </Pressable>
      </>
    );
  };

  const canContinue =
    (step === 0 && Boolean(discoveryChoice)) ||
    (step === 1 && Boolean(sceneId)) ||
    (step === 2 && Boolean(firstChoice)) ||
    (step === 3 && (premiseRemoved ? Boolean(secondChoice) : true));

  const primaryLabel =
    step === 0
      ? "自分の場面で試す"
      : step === 1
        ? "この場面で進む"
          : step === 2
            ? "この読みを残す"
            : premiseRemoved
              ? "1回目と比べる"
              : "この1行を未確認に戻す";

  const handlePrimary = () => {
    if (!canContinue) return;
    if (step === 3 && !premiseRemoved) {
      setPremiseRemoved(true);
      setSecondChoice(null);
      void hapticFeedback.medium();
      return;
    }
    goToStep(step + 1);
  };

  return (
    <View style={styles.root} testID="l1-pilot-screen">
      <StarBackground />
      <LinearGradient
        colors={["rgba(5,7,19,0.34)", "rgba(5,7,19,0.90)", COLORS.bg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="試作を閉じる"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            testID="close-l1-pilot"
          >
            <Ionicons name="close" size={26} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>書かれていない一文</Text>
            <View style={styles.progressTrack}>
              {Array.from({ length: 5 }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    index <= step && styles.progressSegmentActive,
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.stepText}>{step + 1}/5</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                (step === 4 ? 32 : 132) + Math.max(insets.bottom, 12),
            },
          ]}
          showsVerticalScrollIndicator={false}
          testID="l1-pilot-scroll"
        >
          {step === 0 ? renderDiscovery() : null}
          {step === 1 ? renderSceneChoice() : null}
          {step === 2 ? renderCommit() : null}
          {step === 3 ? renderRecheck() : null}
          {step === 4 ? renderResult() : null}
        </ScrollView>

        {step !== 4 ? (
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canContinue }}
              disabled={!canContinue}
              onPress={handlePrimary}
              style={({ pressed }) => [
                styles.primaryButton,
                !canContinue && styles.primaryButtonDisabled,
                pressed && styles.primaryButtonPressed,
              ]}
              testID="l1-pilot-primary"
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  !canContinue && styles.primaryButtonTextDisabled,
                ]}
              >
                {primaryLabel}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={!canContinue ? "#656777" : "#160611"}
              />
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function SectionLead({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.sectionLead}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function FactCard({ fact }: { fact: string }) {
  return (
    <View style={styles.factCard}>
      <View style={styles.factLabelRow}>
        <Ionicons name="eye-outline" size={18} color={COLORS.violet} />
        <Text style={styles.factLabel}>画面にあること</Text>
      </View>
      <Text style={styles.factText}>{fact}</Text>
    </View>
  );
}

function ChoiceButton({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceButton,
        selected && styles.choiceButtonSelected,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <View style={[styles.choiceMarker, selected && styles.choiceMarkerSelected]}>
        <Ionicons
          name={selected ? "bookmark" : "add"}
          size={16}
          color={selected ? COLORS.pink : COLORS.violet}
        />
      </View>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
        {label}
      </Text>
      {selected ? <Text style={styles.choiceStatus}>仮置き</Text> : null}
    </Pressable>
  );
}

function ResultLine({
  label,
  value,
  accent = false,
  last = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.resultLine, last && styles.resultLineLast]}>
      <Text style={[styles.resultLineLabel, accent && { color: COLORS.pink }]}>
        {label}
      </Text>
      <Text style={styles.resultLineValue}>{value}</Text>
    </View>
  );
}

function CompactChoiceButton({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactChoice,
        selected && styles.compactChoiceSelected,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <View style={styles.compactChoiceTop}>
        <Ionicons
          name={selected ? "bookmark" : "add"}
          size={14}
          color={selected ? COLORS.pink : COLORS.violet}
        />
        <Text style={[styles.compactChoiceText, selected && styles.compactChoiceTextSelected]}>
          {label}
        </Text>
      </View>
      {selected ? <Text style={styles.compactChoiceStatus}>仮置き</Text> : null}
    </Pressable>
  );
}

function SmallChoice({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        onPress();
        void hapticFeedback.selection();
      }}
      style={({ pressed }) => [
        styles.smallChoice,
        selected && styles.smallChoiceSelected,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <Text style={[styles.smallChoiceText, selected && styles.smallChoiceTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomColor: COLORS.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerCenter: {
    flex: 1,
    gap: 9,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  progressTrack: {
    flexDirection: "row",
    gap: 5,
  },
  progressSegment: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 4,
    flex: 1,
    height: 4,
  },
  progressSegmentActive: {
    backgroundColor: COLORS.pink,
  },
  stepText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  sectionLead: {
    marginBottom: 26,
  },
  kicker: {
    color: COLORS.pink,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.7,
    lineHeight: 39,
    marginBottom: 10,
  },
  body: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 23,
  },
  messageCard: {
    backgroundColor: COLORS.cardStrong,
    borderColor: "rgba(155,135,245,0.25)",
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 18,
    padding: 19,
    shadowColor: COLORS.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  messageHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 15,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: COLORS.violetSoft,
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    marginRight: 9,
    width: 30,
  },
  avatarText: {
    color: COLORS.violet,
    fontSize: 13,
    fontWeight: "900",
  },
  messageSender: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  messageTime: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  messageText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 29,
  },
  optionStack: {
    gap: 10,
  },
  reselectButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    marginTop: 11,
    paddingHorizontal: 4,
    paddingVertical: 7,
  },
  reselectText: {
    color: COLORS.violet,
    fontSize: 12,
    fontWeight: "800",
  },
  compactChoiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  choiceButton: {
    alignItems: "center",
    backgroundColor: "rgba(15, 18, 34, 0.90)",
    borderColor: COLORS.line,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 62,
    paddingHorizontal: 17,
  },
  choiceButtonSelected: {
    backgroundColor: COLORS.pinkSoft,
    borderColor: COLORS.pink,
  },
  choiceMarker: {
    alignItems: "center",
    backgroundColor: COLORS.violetSoft,
    borderRadius: 9,
    height: 30,
    justifyContent: "center",
    marginRight: 13,
    width: 30,
  },
  choiceMarkerSelected: {
    backgroundColor: "rgba(241,63,157,0.18)",
  },
  choiceStatus: {
    color: COLORS.pink,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 8,
  },
  choiceText: {
    color: "#C7C9D5",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  choiceTextSelected: {
    color: COLORS.text,
  },
  compactChoice: {
    alignItems: "center",
    backgroundColor: "rgba(15, 18, 34, 0.90)",
    borderColor: COLORS.line,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 60,
    paddingHorizontal: 10,
    width: "48%",
  },
  compactChoiceSelected: {
    backgroundColor: COLORS.pinkSoft,
    borderColor: COLORS.pink,
  },
  compactChoiceText: {
    color: "#C7C9D5",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center",
  },
  compactChoiceTextSelected: {
    color: COLORS.text,
  },
  compactChoiceTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  compactChoiceStatus: {
    color: COLORS.pink,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 4,
  },
  inkReveal: {
    backgroundColor: "rgba(9, 11, 25, 0.88)",
    borderColor: "rgba(241,63,157,0.30)",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    padding: 19,
  },
  inkRevealLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inkSentence: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 31,
  },
  inkUnderline: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.pink,
    height: 2,
    marginRight: 8,
    marginTop: 2,
    width: "58%",
  },
  revealCopy: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 14,
  },
  sceneGrid: {
    gap: 11,
  },
  sceneCard: {
    alignItems: "center",
    backgroundColor: "rgba(15, 18, 34, 0.90)",
    borderColor: COLORS.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 72,
    padding: 14,
  },
  sceneCardSelected: {
    backgroundColor: COLORS.pinkSoft,
    borderColor: COLORS.pink,
  },
  sceneIcon: {
    alignItems: "center",
    backgroundColor: COLORS.violetSoft,
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginRight: 13,
    width: 42,
  },
  sceneIconSelected: {
    backgroundColor: "rgba(241,63,157,0.18)",
  },
  sceneLabel: {
    color: COLORS.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  sceneLabelSelected: {
    color: "#FFFFFF",
  },
  safetyContrast: {
    alignItems: "flex-start",
    backgroundColor: "rgba(78, 51, 19, 0.23)",
    borderColor: "rgba(243,180,92,0.34)",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 18,
    padding: 15,
  },
  safetyIcon: {
    alignItems: "center",
    backgroundColor: "rgba(243,180,92,0.12)",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    marginRight: 12,
    width: 36,
  },
  safetyCopy: {
    flex: 1,
  },
  safetyEyebrow: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 4,
  },
  safetyText: {
    color: "#D6C9B4",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  factCard: {
    backgroundColor: COLORS.violetSoft,
    borderColor: "rgba(155,135,245,0.30)",
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    padding: 18,
  },
  factLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  factLabel: {
    color: COLORS.violet,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  factText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 28,
  },
  questionLabel: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 27,
    marginBottom: 14,
  },
  noScoreCopy: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 14,
    textAlign: "center",
  },
  conclusionCard: {
    backgroundColor: COLORS.pinkSoft,
    borderColor: "rgba(241,63,157,0.34)",
    borderRadius: 19,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  cardCaption: {
    color: COLORS.pink,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
  },
  conclusionText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
  },
  premiseCard: {
    backgroundColor: COLORS.cardStrong,
    borderColor: COLORS.line,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  premiseTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 13,
  },
  premiseTopLabel: {
    color: COLORS.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  premiseText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 27,
  },
  unconfirmedPill: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.pinkSoft,
    borderRadius: 999,
    marginTop: 15,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  unconfirmedText: {
    color: COLORS.pink,
    fontSize: 12,
    fontWeight: "900",
  },
  factVsPremise: {
    backgroundColor: "rgba(9, 11, 25, 0.82)",
    borderColor: COLORS.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 15,
  },
  miniColumn: {
    flex: 1,
  },
  miniColumnLabel: {
    color: COLORS.violet,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 6,
  },
  miniColumnText: {
    color: "#C8CAD6",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  verticalDivider: {
    backgroundColor: COLORS.line,
    marginHorizontal: 12,
    width: StyleSheet.hairlineWidth,
  },
  removedPremise: {
    alignItems: "center",
    backgroundColor: "rgba(155,135,245,0.10)",
    borderColor: "rgba(155,135,245,0.26)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
    padding: 14,
  },
  removedPremiseText: {
    color: "#B8B3D4",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "line-through",
  },
  removedBadge: {
    color: COLORS.violet,
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 28,
    width: "100%",
  },
  deltaCard: {
    backgroundColor: COLORS.cardStrong,
    borderColor: COLORS.line,
    borderRadius: 21,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  deltaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  deltaLabel: {
    color: COLORS.violet,
    fontSize: 12,
    fontWeight: "900",
    width: 42,
  },
  deltaValue: {
    color: COLORS.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  deltaArrow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    marginLeft: 10,
    paddingVertical: 13,
  },
  deltaArrowText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  threeLineCard: {
    backgroundColor: "rgba(10, 12, 28, 0.88)",
    borderColor: COLORS.line,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 17,
  },
  resultLine: {
    borderBottomColor: COLORS.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  resultLineLast: {
    borderBottomWidth: 0,
  },
  resultLineLabel: {
    color: COLORS.violet,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 5,
  },
  resultLineValue: {
    color: "#D6D7E0",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  lensCard: {
    borderColor: "rgba(241,63,157,0.38)",
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
  },
  lensLabel: {
    color: COLORS.pink,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 9,
  },
  lensText: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 31,
  },
  recordButton: {
    alignItems: "center",
    backgroundColor: "rgba(15, 18, 34, 0.92)",
    borderColor: COLORS.line,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: "row",
    padding: 15,
  },
  recordIcon: {
    alignItems: "center",
    backgroundColor: COLORS.pinkSoft,
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    marginRight: 12,
    width: 40,
  },
  recordCopy: {
    flex: 1,
  },
  recordTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 3,
  },
  recordSub: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  tomorrowCard: {
    backgroundColor: "rgba(15, 18, 34, 0.94)",
    borderColor: "rgba(241,63,157,0.30)",
    borderRadius: 20,
    borderWidth: 1,
    padding: 17,
  },
  tomorrowHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 15,
  },
  tomorrowKicker: {
    color: COLORS.pink,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 3,
  },
  tomorrowTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  tomorrowQuestion: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
  },
  tomorrowActions: {
    flexDirection: "row",
    gap: 9,
  },
  smallChoice: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: COLORS.line,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8,
  },
  smallChoiceSelected: {
    backgroundColor: COLORS.pinkSoft,
    borderColor: COLORS.pink,
  },
  smallChoiceText: {
    color: "#C2C4D0",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  smallChoiceTextSelected: {
    color: COLORS.text,
  },
  tomorrowFeedback: {
    color: "#D8D3EA",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 12,
  },
  prototypeNote: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 10,
  },
  inlineRepeatButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inlineRepeatText: {
    color: COLORS.violet,
    fontSize: 14,
    fontWeight: "900",
  },
  bottomBar: {
    backgroundColor: "rgba(5, 7, 19, 0.97)",
    borderTopColor: COLORS.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    position: "absolute",
    right: 0,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.pink,
    borderRadius: 19,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 18,
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
  },
  primaryButtonDisabled: {
    backgroundColor: "#242634",
    shadowOpacity: 0,
  },
  primaryButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: "#160611",
    fontSize: 17,
    fontWeight: "900",
  },
  primaryButtonTextDisabled: {
    color: "#656777",
  },
  pressed: {
    opacity: 0.76,
  },
});
