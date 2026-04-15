import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { CourseWorldHero } from "../../components/CourseWorldHero";
import { GlobalHeaderMenu } from "../../components/GlobalHeaderMenu";
import { PaywallModal } from "../../components/PaywallModal";
import { CourseLeagueResultGate } from "../../components/course/CourseSections";
import { getLastWeekResult, type LeagueResult } from "../../lib/leagueReward";
import { buildCourseWorldViewModel } from "../../lib/courseWorld";
import { trailsByGenre } from "../../lib/data";
import { useAuth } from "../../lib/AuthContext";
import { Analytics } from "../../lib/analytics";
import { isLessonLocked, shouldShowPaywall } from "../../lib/paywall";
import { useBillingState, useEconomyState, useProgressionState } from "../../lib/state";
import { useToast } from "../../components/ToastProvider";
import type { TrailNode as CourseTrailNode } from "../../components/trail/types";

function buildCurrentTrail(
  selectedGenre: string,
  hasProAccess: boolean,
  completedLessons: Set<string>
): CourseTrailNode[] {
  const baseTrail = trailsByGenre[selectedGenre] || trailsByGenre.mental;

  return baseTrail.map((node, index) => {
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
}

export default function CourseScreen() {
  const {
    selectedGenre,
    setSelectedGenre,
    completedLessons,
    streakRepairOffer,
    purchaseStreakRepair,
    comebackRewardOffer,
  } = useProgressionState();
  const { hasProAccess } = useBillingState();
  const { setGemsDirectly } = useEconomyState();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [menuVisible, setMenuVisible] = useState(false);
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

  const currentTrail = useMemo(
    () => buildCurrentTrail(selectedGenre, hasProAccess, completedLessons),
    [selectedGenre, hasProAccess, completedLessons]
  );
  const nextActionNode = useMemo(
    () => currentTrail.find((node) => node.status === "current" && !!node.lessonFile),
    [currentTrail]
  );
  const model = useMemo(
    () =>
      buildCourseWorldViewModel({
        selectedGenre,
        currentTrail,
        nextActionNode,
        streakRepairOffer,
        comebackRewardOffer,
      }),
    [selectedGenre, currentTrail, nextActionNode, streakRepairOffer, comebackRewardOffer]
  );

  const handleLockedLessonAccess = async () => {
    const lessonCompleteCount = completedLessons.size;
    if (shouldShowPaywall(lessonCompleteCount)) {
      setPaywallContextGenre(selectedGenre);
      setPaywallVisible(true);
      return;
    }

    showToast("このレッスンはまだ準備中です。");
  };

  const handleLaunchCurrent = () => {
    if (!model) return;

    if (model.primaryAction.mode === "paywall") {
      void handleLockedLessonAccess();
      return;
    }

    if (model.primaryAction.mode === "review") {
      router.replace("/review");
      return;
    }

    if (model.primaryAction.targetLessonFile) {
      router.replace(`/lesson?file=${model.primaryAction.targetLessonFile}&genre=${selectedGenre}`);
    }
  };

  const handleNodePress = (nodeId: string) => {
    if (!model) return;
    if (nodeId !== model.currentLesson.id) return;
    handleLaunchCurrent();
  };

  const handleSupportPress = () => {
    const activeStreakRepairOffer =
      streakRepairOffer?.active && streakRepairOffer.expiresAtMs > Date.now() ? streakRepairOffer : null;
    if (activeStreakRepairOffer) {
      const result = purchaseStreakRepair();
      if (!result.success) {
        if (result.reason === "insufficient_gems") {
          showToast("ジェムが足りません。", "error");
          return;
        }
        if (result.reason === "expired") {
          showToast("オファーの期限が切れました。", "error");
        }
      }
      return;
    }

    const activeComebackRewardOffer =
      comebackRewardOffer?.active && comebackRewardOffer.expiresAtMs > Date.now()
        ? comebackRewardOffer
        : null;
    if (!activeComebackRewardOffer) return;

    const startableNode = currentTrail.find(
      (node) => node.status === "current" && !node.isLocked && !!node.lessonFile
    );
    if (startableNode?.lessonFile) {
      router.replace(`/lesson?file=${startableNode.lessonFile}&genre=${selectedGenre}`);
    }
  };

  if (!model) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <CourseWorldHero
        model={model}
        nextLessonId={model.primaryAction.mode === "lesson" ? model.primaryAction.targetNodeId : undefined}
        onNodePress={handleNodePress}
        onPrimaryPress={handleLaunchCurrent}
        onSupportPress={handleSupportPress}
        onUnitPress={() => setMenuVisible(true)}
        showMeta={false}
        showPrimaryAction={false}
        heroOffsetY={42}
      />

      <GlobalHeaderMenu
        menuVisible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelectGenre={(genreId) => {
          setSelectedGenre(genreId);
          setMenuVisible(false);
        }}
        selectedGenre={selectedGenre}
      />

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUpgrade={() => {
          Analytics.track("paywall_upgrade_clicked", {
            source: "course_world_paywall_modal",
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
          showToast(`報酬を受け取りました: ${claimedGems}ジェム / ${claimedBadges.length}バッジ`, "success");
        }}
        onDismiss={() => setShowLeagueResult(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
});
