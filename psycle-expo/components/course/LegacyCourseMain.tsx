import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { theme } from "../../lib/theme";
import { trailsByGenre } from "../../lib/data";
import { useBillingState, useEconomyState, useProgressionState } from "../../lib/state";
import { Trail } from "../trail";
import type { TrailNode as CourseTrailNode } from "../trail/types";
import { GlobalHeader } from "../GlobalHeader";
import { PaywallModal } from "../PaywallModal";
import {
  CourseLeagueResultGate,
  CourseLessonModal,
  CourseNextStepCard,
  CourseOfferBanner,
} from "./CourseSections";
import { isLessonLocked, shouldShowPaywall } from "../../lib/paywall";
import { getLastWeekResult, type LeagueResult } from "../../lib/leagueReward";
import { useAuth } from "../../lib/AuthContext";
import i18n from "../../lib/i18n";
import { Analytics } from "../../lib/analytics";
import { useToast } from "../ToastProvider";

const GENRE_COLORS: Record<string, string> = {
  mental: "#ec4899",
  money: "#eab308",
  work: "#3b82f6",
  health: "#ef4444",
  social: "#f97316",
  study: "#22c55e",
};

export function LegacyCourseMain() {
  const {
    selectedGenre,
    completedLessons,
    streakRepairOffer,
    purchaseStreakRepair,
    comebackRewardOffer,
  } = useProgressionState();
  const { hasProAccess } = useBillingState();
  const { setGemsDirectly } = useEconomyState();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [modalNode, setModalNode] = useState<string | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallContextGenre, setPaywallContextGenre] = useState<string | null>(null);
  const [leagueResult, setLeagueResult] = useState<LeagueResult | null>(null);
  const [showLeagueResult, setShowLeagueResult] = useState(false);

  useEffect(() => {
    async function checkLeagueResult() {
      if (!user) return;
      const result = await getLastWeekResult(user.id);
      if (result.hasReward) {
        setLeagueResult(result);
        setShowLeagueResult(true);
      }
    }
    void checkLeagueResult();
  }, [user]);

  const themeColor = GENRE_COLORS[selectedGenre] || GENRE_COLORS.mental;
  const baseTrail = trailsByGenre[selectedGenre] || trailsByGenre.mental;

  const currentTrail: CourseTrailNode[] = baseTrail.map((node, index) => {
    const lessonFile = node.lessonFile;
    if (!lessonFile) return node;

    const levelMatch = lessonFile.match(/_l(\d+)$/);
    const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;
    const locked = isLessonLocked(selectedGenre, level, hasProAccess);
    if (locked) {
      return { ...node, status: "current", isLocked: true };
    }

    const isCompleted = completedLessons.has(lessonFile);
    if (isCompleted) return { ...node, status: "done" };

    const prevNode = baseTrail[index - 1];
    const prevCompleted = prevNode?.lessonFile ? completedLessons.has(prevNode.lessonFile) : true;
    if (index === 0 || prevCompleted) return { ...node, status: "current" };
    return { ...node, status: "locked" };
  });

  const nextActionNode = currentTrail.find(
    (node) => node.status === "current" && !!node.lessonFile
  );

  const handleLockedLessonAccess = async () => {
    const lessonCompleteCount = completedLessons.size;
    if (shouldShowPaywall(lessonCompleteCount)) {
      setPaywallContextGenre(selectedGenre);
      setPaywallVisible(true);
      return;
    }

    showToast(String(i18n.t("course.keepUsingMessage")));
  };

  const handleStart = () => {
    if (!modalNode) {
      setModalNode(null);
      return;
    }

    const node = currentTrail.find((trailNode) => trailNode.id === modalNode);
    if (!node?.lessonFile) {
      setModalNode(null);
      return;
    }

    router.replace(`/lesson?file=${node.lessonFile}&genre=${selectedGenre}`);
    setModalNode(null);
  };

  const activeStreakRepairOffer =
    streakRepairOffer?.active && streakRepairOffer.expiresAtMs > Date.now()
      ? streakRepairOffer
      : null;
  const streakRepairRemainingHours = activeStreakRepairOffer
    ? Math.max(1, Math.ceil((activeStreakRepairOffer.expiresAtMs - Date.now()) / (60 * 60 * 1000)))
    : null;
  const activeComebackRewardOffer =
    !activeStreakRepairOffer &&
    comebackRewardOffer?.active &&
    comebackRewardOffer.expiresAtMs > Date.now()
      ? comebackRewardOffer
      : null;

  const handleStartComebackLesson = () => {
    const startableNode = currentTrail.find(
      (node) => node.status === "current" && !node.isLocked && !!node.lessonFile
    );

    if (startableNode?.lessonFile) {
      router.replace(`/lesson?file=${startableNode.lessonFile}&genre=${selectedGenre}`);
      return;
    }

    const fallbackNode =
      currentTrail.find((node) => node.status === "current" && !!node.lessonFile) ??
      currentTrail.find((node) => !!node.lessonFile);
    if (fallbackNode) {
      setModalNode(fallbackNode.id);
    }
  };

  const handleNextStepPress = () => {
    if (!nextActionNode) return;
    if (nextActionNode.isLocked) {
      void handleLockedLessonAccess();
      return;
    }
    setModalNode(nextActionNode.id);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlobalHeader />

      {activeStreakRepairOffer ? (
        <CourseOfferBanner
          variant="streakRepair"
          title={String(i18n.t("course.streakRepair.title"))}
          body={String(
            i18n.t("course.streakRepair.body", {
              streak: activeStreakRepairOffer.previousStreak,
              cost: activeStreakRepairOffer.costGems,
              hours: streakRepairRemainingHours,
            })
          )}
          ctaLabel={String(i18n.t("course.streakRepair.cta"))}
          accessibilityHint={String(i18n.t("course.streakRepair.accessibilityHint"))}
          onPress={() => {
            const result = purchaseStreakRepair();
            if (!result.success) {
              if (result.reason === "insufficient_gems") {
                showToast(String(i18n.t("course.streakRepair.insufficientGems")), "error");
                return;
              }
              if (result.reason === "expired") {
                showToast(String(i18n.t("course.streakRepair.expired")), "error");
              }
            }
          }}
        />
      ) : null}

      {activeComebackRewardOffer ? (
        <CourseOfferBanner
          variant="comeback"
          title={String(i18n.t("course.comebackReward.title"))}
          body={String(
            i18n.t("course.comebackReward.body", {
              days: activeComebackRewardOffer.daysSinceStudy,
              energy: activeComebackRewardOffer.rewardEnergy,
              gems: activeComebackRewardOffer.rewardGems,
            })
          )}
          ctaLabel={String(i18n.t("course.comebackReward.cta"))}
          accessibilityHint={String(i18n.t("course.comebackReward.accessibilityHint"))}
          onPress={handleStartComebackLesson}
        />
      ) : null}

      {nextActionNode ? (
        <CourseNextStepCard isLocked={Boolean(nextActionNode.isLocked)} onPress={handleNextStepPress} />
      ) : null}

      <Trail
        trail={currentTrail}
        hideLabels
        onStart={(nodeId) => setModalNode(nodeId)}
        onLockedPress={() => {
          void handleLockedLessonAccess();
        }}
        themeColor={themeColor}
      />

      <CourseLessonModal
        visible={!!modalNode}
        onStart={handleStart}
        onCancel={() => setModalNode(null)}
      />

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUpgrade={() => {
          Analytics.track("paywall_upgrade_clicked", {
            source: "course_paywall_modal",
            genreId: paywallContextGenre ?? selectedGenre,
            lessonCompleteCount: completedLessons.size,
          });
          router.push("/(tabs)/shop");
          setPaywallVisible(false);
          setPaywallContextGenre(null);
        }}
      />

      <CourseLeagueResultGate
        result={leagueResult}
        visible={showLeagueResult}
        onClaim={(claimedGems, claimedBadges, newBalance) => {
          if (newBalance !== undefined) {
            setGemsDirectly(newBalance);
          }
          showToast(
            String(
              i18n.t("course.rewardClaimedMessage", {
                gems: claimedGems,
                badges: claimedBadges.length,
              })
            ),
            "success"
          );
        }}
        onDismiss={() => setShowLeagueResult(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
});
