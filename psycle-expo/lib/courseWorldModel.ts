import { genres } from "./data";
import { loadLessons, type Lesson } from "./lessons";
import type { ComebackRewardOffer } from "./comebackReward";
import i18n from "./i18n";
import type { StreakRepairOffer } from "./streakRepair";

export const COURSE_THEME_COLORS: Record<string, string> = {
  mental: "#ec4899",
  money: "#eab308",
  work: "#3b82f6",
  health: "#ef4444",
  social: "#f97316",
  study: "#22c55e",
};

export type CourseWorldNodeStatus = "done" | "current" | "locked";
export type CourseWorldNodeType = "lesson" | "review_blackhole";
export type CourseWorldPrimaryActionMode = "lesson" | "paywall" | "review";

export interface CourseWorldNode {
  accessibilityLabel: string;
  icon: string;
  id: string;
  isInteractive: boolean;
  isLocked?: boolean;
  label: string;
  levelNumber: number;
  lessonFile?: string;
  nodeType: CourseWorldNodeType;
  status: CourseWorldNodeStatus;
}

export interface CourseWorldSupportMoment {
  accessibilityHint?: string;
  body: string;
  ctaLabel?: string;
  kind: "streakRepair" | "comebackReward";
  title: string;
}

export interface CourseWorldViewModel {
  currentLesson: CourseWorldNode & {
    body: string;
    meta: string;
    title: string;
  };
  genreId: string;
  primaryAction: {
    label: string;
    mode: CourseWorldPrimaryActionMode;
    targetLessonFile?: string;
    targetNodeId: string;
  };
  progressLabel: string;
  reviewNode?: CourseWorldNode;
  routeNodes: CourseWorldNode[];
  summaryLabel: string;
  supportMoment?: CourseWorldSupportMoment;
  themeColor: string;
  unitLabel: string;
}

export interface CourseWorldTrailNode {
  icon: string;
  id: string;
  isLocked?: boolean;
  lessonFile?: string;
  status: string;
  type?: string;
}

export interface BuildCourseWorldViewModelInput {
  comebackRewardOffer: ComebackRewardOffer | null;
  currentTrail: CourseWorldTrailNode[];
  nextActionNode: CourseWorldTrailNode | null | undefined;
  nowMs?: number;
  selectedGenre: string;
  streakRepairOffer: StreakRepairOffer | null;
}

type SequenceNode = CourseWorldNode & {
  lesson: Lesson;
  orderIndex: number;
};

function normalizeNodeType(node: CourseWorldTrailNode, lesson: Lesson): CourseWorldNodeType {
  if (node.type === "review_blackhole" || lesson.nodeType === "review_blackhole") {
    return "review_blackhole";
  }
  return "lesson";
}

function getLessonForTrailNode(
  node: CourseWorldTrailNode,
  lessons: Lesson[],
  genreId: string
): Lesson | null {
  if (!node.lessonFile) return null;

  if (node.type === "review_blackhole" || node.lessonFile.endsWith("_review_bh1")) {
    return lessons.find((lesson) => lesson.id === `${genreId}_review_bh1`) ?? null;
  }

  const levelMatch = node.lessonFile.match(/_l(\d+)$/);
  if (!levelMatch) return null;

  const level = Number.parseInt(levelMatch[1] ?? "0", 10);
  return lessons.find(
    (lesson) => lesson.level === level && (lesson.nodeType === "lesson" || !lesson.nodeType)
  ) ?? null;
}

function truncateCopy(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeSupportCopy(text: string): string {
  return text.replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s+/g, " ").trim();
}

function deriveLessonBody(lesson: Lesson, status: CourseWorldNodeStatus): string {
  if (lesson.nodeType === "review_blackhole") {
    return String(i18n.t("course.world.reviewBody"));
  }

  if (status === "locked") {
    return String(i18n.t("course.world.lockedBody"));
  }

  const actionableAdvice = lesson.questions.find(
    (question) =>
      typeof (question as { actionable_advice?: string }).actionable_advice === "string" &&
      (question as { actionable_advice?: string }).actionable_advice?.trim()
  ) as { actionable_advice?: string } | undefined;

  if (actionableAdvice?.actionable_advice) {
    return truncateCopy(normalizeSupportCopy(actionableAdvice.actionable_advice), 46);
  }

  const tryThisQuestion = lesson.questions.find(
    (question) =>
      typeof (question as { expanded_details?: { try_this?: string } }).expanded_details?.try_this ===
      "string" &&
      (question as { expanded_details?: { try_this?: string } }).expanded_details?.try_this?.trim()
  ) as { expanded_details?: { try_this?: string } } | undefined;

  if (tryThisQuestion?.expanded_details?.try_this) {
    return truncateCopy(normalizeSupportCopy(tryThisQuestion.expanded_details.try_this), 46);
  }

  return String(i18n.t("course.world.lessonBodyFallback"));
}

function buildNodeAccessibilityLabel(
  label: string,
  levelNumber: number,
  nodeType: CourseWorldNodeType,
  status: CourseWorldNodeStatus
): string {
  if (nodeType === "review_blackhole") {
    return String(i18n.t("course.accessibility.nodeReview", { label }));
  }

  if (status === "done") {
    return String(i18n.t("course.accessibility.nodeCompleted", { number: levelNumber }));
  }

  if (status === "locked") {
    return String(i18n.t("course.accessibility.nodeLocked", { number: levelNumber }));
  }

  return String(i18n.t("course.accessibility.nodeCurrent", { number: levelNumber }));
}

function buildSequence(
  genreId: string,
  trail: CourseWorldTrailNode[],
  lessons: Lesson[],
  nextActionNode: CourseWorldTrailNode | null | undefined
): SequenceNode[] {
  const lessonTrail = trail.filter((node) => !!node.lessonFile);
  const nextActionIndex = Math.max(
    0,
    lessonTrail.findIndex((node) => node.id === nextActionNode?.id)
  );

  const sequence = lessonTrail
    .map((node, orderIndex) => {
      const lesson = getLessonForTrailNode(node, lessons, genreId);
      if (!lesson) return null;

      const nodeType = normalizeNodeType(node, lesson);
      const label = nodeType === "review_blackhole" ? "BH" : `L${lesson.level}`;
      const status: CourseWorldNodeStatus =
        orderIndex < nextActionIndex
          ? "done"
          : orderIndex === nextActionIndex
            ? node.isLocked
              ? "locked"
              : "current"
            : "locked";

      return {
        accessibilityLabel: buildNodeAccessibilityLabel(label, lesson.level, nodeType, status),
        icon: node.icon,
        id: node.id,
        isInteractive: false,
        isLocked: Boolean(node.isLocked),
        label,
        lesson,
        lessonFile: node.lessonFile,
        levelNumber: lesson.level,
        nodeType,
        orderIndex,
        status,
      };
    }) as Array<SequenceNode | null>;

  return sequence.filter((node): node is SequenceNode => node !== null);
}

function buildProgressLabel(currentNode: SequenceNode, maxLessonLevel: number): string {
  if (currentNode.nodeType === "review_blackhole") {
    return String(i18n.t("course.world.progressReview"));
  }

  return `${currentNode.levelNumber} / ${maxLessonLevel}`;
}

function buildPrimaryAction(
  currentNode: SequenceNode
): CourseWorldViewModel["primaryAction"] {
  if (currentNode.nodeType === "review_blackhole") {
    return {
      label: String(i18n.t("course.world.ctaOpenReview")),
      mode: "review",
      targetLessonFile: currentNode.lessonFile,
      targetNodeId: currentNode.id,
    };
  }

  if (currentNode.isLocked) {
    return {
      label: String(i18n.t("course.world.ctaSeeUnlock")),
      mode: "paywall",
      targetLessonFile: currentNode.lessonFile,
      targetNodeId: currentNode.id,
    };
  }

  return {
    label: String(i18n.t("course.world.ctaOpenLesson", { number: currentNode.levelNumber })),
    mode: "lesson",
    targetLessonFile: currentNode.lessonFile,
    targetNodeId: currentNode.id,
  };
}

function buildSupportMoment(
  streakRepairOffer: StreakRepairOffer | null,
  comebackRewardOffer: ComebackRewardOffer | null,
  nowMs: number
): CourseWorldSupportMoment | undefined {
  if (streakRepairOffer?.active && streakRepairOffer.expiresAtMs > nowMs) {
    const remainingHours = Math.max(
      1,
      Math.ceil((streakRepairOffer.expiresAtMs - nowMs) / (60 * 60 * 1000))
    );

    return {
      accessibilityHint: String(i18n.t("course.streakRepair.accessibilityHint")),
      body: String(
        i18n.t("course.streakRepair.body", {
          cost: streakRepairOffer.costGems,
          hours: remainingHours,
          streak: streakRepairOffer.previousStreak,
        })
      ),
      ctaLabel: String(i18n.t("course.streakRepair.cta")),
      kind: "streakRepair",
      title: String(i18n.t("course.streakRepair.title")),
    };
  }

  if (comebackRewardOffer?.active && comebackRewardOffer.expiresAtMs > nowMs) {
    return {
      accessibilityHint: String(i18n.t("course.comebackReward.accessibilityHint")),
      body: String(
        i18n.t("course.comebackReward.body", {
          days: comebackRewardOffer.daysSinceStudy,
          energy: comebackRewardOffer.rewardEnergy,
          gems: comebackRewardOffer.rewardGems,
        })
      ),
      kind: "comebackReward",
      title: String(i18n.t("course.comebackReward.title")),
    };
  }

  return undefined;
}

function getAnchorLevel(currentNode: SequenceNode): number {
  if (currentNode.nodeType === "review_blackhole") {
    return Math.max(1, Math.floor(currentNode.levelNumber));
  }
  return currentNode.levelNumber;
}

function buildRouteNodes(sequence: SequenceNode[], currentNode: SequenceNode): CourseWorldNode[] {
  const anchorLevel = getAnchorLevel(currentNode);
  const lessonNodes = sequence.filter((node) => node.nodeType === "lesson");
  const lowerBound = Math.max(1, anchorLevel - 2);
  const upperBound = anchorLevel + 2;

  return lessonNodes
    .filter(
      (node) =>
        node.levelNumber >= lowerBound &&
        node.levelNumber <= upperBound &&
        node.id !== currentNode.id
    )
    .map(({ lesson, orderIndex, ...node }) => ({
      ...node,
      isInteractive: false,
    }));
}

function buildReviewNode(sequence: SequenceNode[], currentNode: SequenceNode): CourseWorldNode | undefined {
  const anchorLevel = getAnchorLevel(currentNode);
  const candidates = sequence.filter((node) => node.nodeType === "review_blackhole");
  const nearest = candidates
    .filter((node) => Math.abs(Math.floor(node.levelNumber) - anchorLevel) <= 2)
    .sort((left, right) => Math.abs(left.levelNumber - anchorLevel) - Math.abs(right.levelNumber - anchorLevel))[0];

  if (!nearest || nearest.id === currentNode.id) {
    return undefined;
  }

  const { lesson, orderIndex, ...node } = nearest;
  return {
    ...node,
    isInteractive: false,
  };
}

export function buildCourseWorldViewModel(
  input: BuildCourseWorldViewModelInput
): CourseWorldViewModel | null {
  const nowMs = input.nowMs ?? Date.now();
  const lessons = loadLessons(input.selectedGenre);
  if (lessons.length === 0) return null;

  const sequence = buildSequence(input.selectedGenre, input.currentTrail, lessons, input.nextActionNode);
  if (sequence.length === 0) return null;

  const currentNode =
    sequence.find((node) => node.id === input.nextActionNode?.id) ??
    sequence.find((node) => node.status === "current") ??
    sequence[0];

  if (!currentNode) return null;

  const lessonCount = lessons.filter((lesson) => lesson.nodeType !== "review_blackhole").length;
  const doneCount = sequence.filter(
    (node) => node.nodeType === "lesson" && node.status === "done"
  ).length;
  const remainingCount = Math.max(0, lessonCount - doneCount - (currentNode.nodeType === "lesson" ? 1 : 0));
  const unitLabel = genres.find((genre) => genre.id === input.selectedGenre)?.label ?? input.selectedGenre;
  const currentBody = deriveLessonBody(currentNode.lesson, currentNode.status);
  const routeNodes = buildRouteNodes(sequence, currentNode);
  const reviewNode = buildReviewNode(sequence, currentNode);

  return {
    currentLesson: {
      accessibilityLabel: currentNode.accessibilityLabel,
      body: currentBody,
      icon: currentNode.icon,
      id: currentNode.id,
      isInteractive: true,
      isLocked: currentNode.isLocked,
      label: currentNode.label,
      levelNumber: currentNode.levelNumber,
      lessonFile: currentNode.lessonFile,
      meta: String(
        i18n.t("course.world.metaQuestionsXp", {
          count: currentNode.lesson.questions.length,
          xp: currentNode.lesson.totalXP,
        })
      ),
      nodeType: currentNode.nodeType,
      status: currentNode.status,
      title: currentNode.lesson.title,
    },
    genreId: input.selectedGenre,
    primaryAction: buildPrimaryAction(currentNode),
    progressLabel: buildProgressLabel(currentNode, lessonCount),
    reviewNode,
    routeNodes,
    summaryLabel: formatCourseWorldSummary(doneCount, remainingCount),
    supportMoment: buildSupportMoment(input.streakRepairOffer, input.comebackRewardOffer, nowMs),
    themeColor: COURSE_THEME_COLORS[input.selectedGenre] ?? COURSE_THEME_COLORS.mental,
    unitLabel,
  };
}

export function formatCourseWorldSummary(doneCount: number, remainingCount: number): string {
  return String(i18n.t("course.world.summary", { done: doneCount, remaining: remainingCount }));
}
