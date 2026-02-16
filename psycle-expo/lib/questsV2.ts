import AsyncStorage from "@react-native-async-storage/async-storage";
import { dateKey } from "./streaks";

const STORAGE_KEY = "@psycle_quests_v2";
const SCHEMA_VERSION = 1;
const BOOST_DURATION_MINUTES = 15;
const BOOST_MULTIPLIER = 2;
const BOOST_MAX_BONUS_XP = 120;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function trackEvent(name: string, properties: Record<string, any>) {
  try {
    // Keep quests engine test-friendly by loading analytics lazily.
    void import("./analytics")
      .then(({ Analytics }) => {
        Analytics.track(name, properties);
      })
      .catch(() => {
        // no-op
      });
  } catch {
    // no-op
  }
}

export type QuestPeriod = "daily" | "weekly" | "monthly";
export type QuestMetric = "lesson_complete" | "study_day" | "journal_submit";
export type QuestEventType = "lesson_complete" | "journal_submit";

export interface QuestDefinition {
  id: string;
  period: QuestPeriod;
  metric: QuestMetric;
  target: number;
  rewardGems: number;
}

export interface QuestBoardItem extends QuestDefinition {
  cycleId: string;
  progress: number;
  claimed: boolean;
  completed: boolean;
}

export interface XpBoostTicket {
  validDate: string;
  durationMinutes: number;
  multiplier: number;
  maxBonusXp: number;
  activatedAt: string | null;
  consumedBonusXp: number;
}

export interface QuestBundleStatus {
  cycleId: string;
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
  rewardClaimed: boolean;
}

export interface QuestBoard {
  daily: QuestBoardItem[];
  weekly: QuestBoardItem[];
  monthly: QuestBoardItem[];
  bundleStatus: {
    daily: QuestBundleStatus & { ticketValidDate: string | null };
    weekly: QuestBundleStatus;
    monthly: QuestBundleStatus;
  };
  xpBoost: {
    hasTicket: boolean;
    validDate: string | null;
    active: boolean;
    remainingMs: number;
    consumedBonusXp: number;
    maxBonusXp: number;
    durationMinutes: number;
    multiplier: number;
  };
}

interface PeriodState {
  cycleId: string;
  progress: Record<string, number>;
  claimed: Record<string, boolean>;
  bundleClaimed: boolean;
  studyDayMarks: string[];
}

interface QuestStore {
  schemaVersion: number;
  daily: PeriodState;
  weekly: PeriodState;
  monthly: PeriodState;
  xpBoostTicket: XpBoostTicket | null;
}

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  { id: "daily_lesson_1", period: "daily", metric: "lesson_complete", target: 1, rewardGems: 5 },
  { id: "daily_lesson_3", period: "daily", metric: "lesson_complete", target: 3, rewardGems: 5 },
  { id: "daily_journal_1", period: "daily", metric: "journal_submit", target: 1, rewardGems: 5 },

  { id: "weekly_study_days_5", period: "weekly", metric: "study_day", target: 5, rewardGems: 15 },
  { id: "weekly_lessons_15", period: "weekly", metric: "lesson_complete", target: 15, rewardGems: 15 },
  { id: "weekly_journal_3", period: "weekly", metric: "journal_submit", target: 3, rewardGems: 15 },

  { id: "monthly_study_days_20", period: "monthly", metric: "study_day", target: 20, rewardGems: 40 },
  { id: "monthly_lessons_60", period: "monthly", metric: "lesson_complete", target: 60, rewardGems: 40 },
];

function definitionsByPeriod(period: QuestPeriod): QuestDefinition[] {
  return QUEST_DEFINITIONS.filter((quest) => quest.period === period);
}

function getWeekCycleId(now: Date): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return dateKey(d);
}

function getMonthlyCycleId(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getCycleId(period: QuestPeriod, now: Date): string {
  if (period === "daily") return dateKey(now);
  if (period === "weekly") return getWeekCycleId(now);
  return getMonthlyCycleId(now);
}

function buildPeriodState(period: QuestPeriod, cycleId: string): PeriodState {
  const progress: Record<string, number> = {};
  const claimed: Record<string, boolean> = {};
  for (const quest of definitionsByPeriod(period)) {
    progress[quest.id] = 0;
    claimed[quest.id] = false;
  }
  return {
    cycleId,
    progress,
    claimed,
    bundleClaimed: false,
    studyDayMarks: [],
  };
}

function buildDefaultStore(now: Date): QuestStore {
  return {
    schemaVersion: SCHEMA_VERSION,
    daily: buildPeriodState("daily", getCycleId("daily", now)),
    weekly: buildPeriodState("weekly", getCycleId("weekly", now)),
    monthly: buildPeriodState("monthly", getCycleId("monthly", now)),
    xpBoostTicket: null,
  };
}

function sanitizePeriodState(input: Partial<PeriodState> | undefined, period: QuestPeriod, cycleId: string): PeriodState {
  const base = buildPeriodState(period, cycleId);
  if (!input) return base;

  return {
    cycleId: input.cycleId || cycleId,
    progress: { ...base.progress, ...(input.progress || {}) },
    claimed: { ...base.claimed, ...(input.claimed || {}) },
    bundleClaimed: Boolean(input.bundleClaimed),
    studyDayMarks: Array.isArray(input.studyDayMarks) ? input.studyDayMarks : [],
  };
}

async function loadStore(now: Date): Promise<QuestStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefaultStore(now);

    const parsed = JSON.parse(raw) as Partial<QuestStore>;
    const dailyCycleId = getCycleId("daily", now);
    const weeklyCycleId = getCycleId("weekly", now);
    const monthlyCycleId = getCycleId("monthly", now);

    return {
      schemaVersion: parsed.schemaVersion || SCHEMA_VERSION,
      daily: sanitizePeriodState(parsed.daily, "daily", dailyCycleId),
      weekly: sanitizePeriodState(parsed.weekly, "weekly", weeklyCycleId),
      monthly: sanitizePeriodState(parsed.monthly, "monthly", monthlyCycleId),
      xpBoostTicket: parsed.xpBoostTicket || null,
    };
  } catch {
    return buildDefaultStore(now);
  }
}

async function saveStore(store: QuestStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function allClaimed(periodState: PeriodState, period: QuestPeriod): boolean {
  const defs = definitionsByPeriod(period);
  return defs.every((quest) => periodState.claimed[quest.id] === true);
}

function addProgress(state: PeriodState, questId: string, step: number): void {
  const definition = QUEST_DEFINITIONS.find((quest) => quest.id === questId);
  if (!definition) return;
  const current = Number(state.progress[questId] || 0);
  state.progress[questId] = Math.min(definition.target, current + step);
}

function isTicketExpired(ticket: XpBoostTicket, now: Date): boolean {
  const today = dateKey(now);
  if (ticket.validDate < today) return true;
  if (ticket.validDate > today) return false;

  if (!ticket.activatedAt) return false;
  const end = new Date(ticket.activatedAt).getTime() + ticket.durationMinutes * 60 * 1000;
  if (Number.isNaN(end)) return true;
  return now.getTime() >= end || ticket.consumedBonusXp >= ticket.maxBonusXp;
}

function ensureTicketConsistency(store: QuestStore, now: Date): { changed: boolean; expired: boolean } {
  const ticket = store.xpBoostTicket;
  if (!ticket) return { changed: false, expired: false };
  if (!isTicketExpired(ticket, now)) return { changed: false, expired: false };

  store.xpBoostTicket = null;
  return { changed: true, expired: true };
}

async function ensureStore(now: Date = new Date()): Promise<QuestStore> {
  const store = await loadStore(now);
  let changed = false;

  // 期限切れチケットの掃除
  const ticketState = ensureTicketConsistency(store, now);
  if (ticketState.expired) {
    trackEvent("xp_boost_expired", {
      source: "quests_engine",
      reason: "expired_or_capped",
    });
  }
  changed = changed || ticketState.changed;

  // 日次サイクル更新時に、前日3/3達成済みでbundle未受取なら自動で翌日チケットを付与
  const currentDailyCycle = getCycleId("daily", now);
  if (store.daily.cycleId !== currentDailyCycle) {
    const previousDaily = store.daily;
    const previousCycleDay = previousDaily.cycleId;
    const expectedToday = dateKey(now);
    const expectedPrev = dateKey(new Date(now.getTime() - ONE_DAY_MS));

    if (
      previousCycleDay === expectedPrev
      && !previousDaily.bundleClaimed
      && allClaimed(previousDaily, "daily")
    ) {
      const ticket: XpBoostTicket = {
        validDate: expectedToday,
        durationMinutes: BOOST_DURATION_MINUTES,
        multiplier: BOOST_MULTIPLIER,
        maxBonusXp: BOOST_MAX_BONUS_XP,
        activatedAt: null,
        consumedBonusXp: 0,
      };
      store.xpBoostTicket = ticket;
      previousDaily.bundleClaimed = true;
      trackEvent("quest_bundle_completed", {
        source: "quests_engine",
        period: "daily",
        cycleId: previousCycleDay,
        rewardType: "xp_boost_ticket",
      });
      trackEvent("xp_boost_ticket_granted", {
        source: "quests_engine",
        trigger: "daily_bundle_rollover",
        validDate: ticket.validDate,
        boostDurationMin: ticket.durationMinutes,
        multiplier: ticket.multiplier,
      });
    }

    store.daily = buildPeriodState("daily", currentDailyCycle);
    changed = true;
  }

  const currentWeeklyCycle = getCycleId("weekly", now);
  if (store.weekly.cycleId !== currentWeeklyCycle) {
    store.weekly = buildPeriodState("weekly", currentWeeklyCycle);
    changed = true;
  }

  const currentMonthlyCycle = getCycleId("monthly", now);
  if (store.monthly.cycleId !== currentMonthlyCycle) {
    store.monthly = buildPeriodState("monthly", currentMonthlyCycle);
    changed = true;
  }

  if (changed) {
    await saveStore(store);
  }

  return store;
}

function buildBoardItems(period: QuestPeriod, state: PeriodState): QuestBoardItem[] {
  return definitionsByPeriod(period).map((definition) => {
    const progress = Number(state.progress[definition.id] || 0);
    const claimed = Boolean(state.claimed[definition.id]);
    return {
      ...definition,
      cycleId: state.cycleId,
      progress,
      claimed,
      completed: progress >= definition.target,
    };
  });
}

function buildBundle(period: QuestPeriod, items: QuestBoardItem[], state: PeriodState): QuestBundleStatus {
  const completedCount = items.filter((item) => item.claimed).length;
  return {
    cycleId: state.cycleId,
    completedCount,
    totalCount: items.length,
    allCompleted: completedCount >= items.length,
    rewardClaimed: state.bundleClaimed,
  };
}

export async function getQuestBoard(now: Date = new Date()): Promise<QuestBoard> {
  const store = await ensureStore(now);
  const daily = buildBoardItems("daily", store.daily);
  const weekly = buildBoardItems("weekly", store.weekly);
  const monthly = buildBoardItems("monthly", store.monthly);

  const xpState = await getXpBoostState(now);

  return {
    daily,
    weekly,
    monthly,
    bundleStatus: {
      daily: {
        ...buildBundle("daily", daily, store.daily),
        ticketValidDate: store.xpBoostTicket?.validDate || null,
      },
      weekly: buildBundle("weekly", weekly, store.weekly),
      monthly: buildBundle("monthly", monthly, store.monthly),
    },
    xpBoost: {
      hasTicket: Boolean(store.xpBoostTicket),
      validDate: store.xpBoostTicket?.validDate || null,
      active: xpState.active,
      remainingMs: xpState.remainingMs,
      consumedBonusXp: xpState.consumedBonusXp,
      maxBonusXp: store.xpBoostTicket?.maxBonusXp || BOOST_MAX_BONUS_XP,
      durationMinutes: store.xpBoostTicket?.durationMinutes || BOOST_DURATION_MINUTES,
      multiplier: store.xpBoostTicket?.multiplier || BOOST_MULTIPLIER,
    },
  };
}

export async function recordQuestEvent(
  event: { type: QuestEventType; lessonId?: string; genreId?: string },
  now: Date = new Date()
): Promise<void> {
  const store = await ensureStore(now);
  const today = dateKey(now);

  if (event.type === "lesson_complete") {
    addProgress(store.daily, "daily_lesson_1", 1);
    addProgress(store.daily, "daily_lesson_3", 1);
    addProgress(store.weekly, "weekly_lessons_15", 1);
    addProgress(store.monthly, "monthly_lessons_60", 1);

    if (!store.weekly.studyDayMarks.includes(today)) {
      store.weekly.studyDayMarks.push(today);
      addProgress(store.weekly, "weekly_study_days_5", 1);
    }

    if (!store.monthly.studyDayMarks.includes(today)) {
      store.monthly.studyDayMarks.push(today);
      addProgress(store.monthly, "monthly_study_days_20", 1);
    }
  }

  if (event.type === "journal_submit") {
    addProgress(store.daily, "daily_journal_1", 1);
    addProgress(store.weekly, "weekly_journal_3", 1);
  }

  await saveStore(store);
}

export async function claimQuestReward(
  questId: string,
  now: Date = new Date()
): Promise<{ claimed: boolean; rewardGems: number }> {
  const store = await ensureStore(now);
  const definition = QUEST_DEFINITIONS.find((quest) => quest.id === questId);
  if (!definition) return { claimed: false, rewardGems: 0 };

  const periodState =
    definition.period === "daily"
      ? store.daily
      : definition.period === "weekly"
        ? store.weekly
        : store.monthly;

  const current = Number(periodState.progress[questId] || 0);
  if (periodState.claimed[questId] || current < definition.target) {
    return { claimed: false, rewardGems: 0 };
  }

  periodState.claimed[questId] = true;
  await saveStore(store);

  trackEvent("quest_reward_claimed", {
    source: "quests_tab",
    period: definition.period,
    questId: definition.id,
    cycleId: periodState.cycleId,
    progress: current,
    target: definition.target,
    rewardGems: definition.rewardGems,
  });

  return {
    claimed: true,
    rewardGems: definition.rewardGems,
  };
}

function createNextDayTicket(now: Date): XpBoostTicket {
  const validDate = dateKey(new Date(now.getTime() + ONE_DAY_MS));
  return {
    validDate,
    durationMinutes: BOOST_DURATION_MINUTES,
    multiplier: BOOST_MULTIPLIER,
    maxBonusXp: BOOST_MAX_BONUS_XP,
    activatedAt: null,
    consumedBonusXp: 0,
  };
}

export async function claimDailyBundleRewardIfEligible(
  now: Date = new Date()
): Promise<{ granted: boolean; ticket?: XpBoostTicket }> {
  const store = await ensureStore(now);

  const defs = definitionsByPeriod("daily");
  const allDailyClaimed = defs.every((quest) => store.daily.claimed[quest.id] === true);
  if (!allDailyClaimed || store.daily.bundleClaimed) {
    return { granted: false };
  }

  store.daily.bundleClaimed = true;
  const ticket = createNextDayTicket(now);
  store.xpBoostTicket = ticket;
  await saveStore(store);

  trackEvent("quest_bundle_completed", {
    source: "quests_tab",
    period: "daily",
    cycleId: store.daily.cycleId,
    rewardType: "xp_boost_ticket",
  });
  trackEvent("xp_boost_ticket_granted", {
    source: "quests_tab",
    trigger: "daily_bundle_claim",
    validDate: ticket.validDate,
    boostDurationMin: ticket.durationMinutes,
    multiplier: ticket.multiplier,
  });

  return { granted: true, ticket };
}

export async function claimWeeklyBundleRewardIfEligible(
  now: Date = new Date()
): Promise<{ granted: boolean; rewardFreezes: number }> {
  const store = await ensureStore(now);
  const defs = definitionsByPeriod("weekly");
  const allWeeklyClaimed = defs.every((quest) => store.weekly.claimed[quest.id] === true);

  if (!allWeeklyClaimed || store.weekly.bundleClaimed) {
    return { granted: false, rewardFreezes: 0 };
  }

  store.weekly.bundleClaimed = true;
  await saveStore(store);

  trackEvent("quest_bundle_completed", {
    source: "quests_tab",
    period: "weekly",
    cycleId: store.weekly.cycleId,
    rewardType: "freeze",
    rewardAmount: 1,
  });

  return { granted: true, rewardFreezes: 1 };
}

export async function claimMonthlyBundleRewardIfEligible(
  now: Date = new Date()
): Promise<{ granted: boolean; badgeId: string | null }> {
  const store = await ensureStore(now);
  const defs = definitionsByPeriod("monthly");
  const allMonthlyClaimed = defs.every((quest) => store.monthly.claimed[quest.id] === true);

  if (!allMonthlyClaimed || store.monthly.bundleClaimed) {
    return { granted: false, badgeId: null };
  }

  store.monthly.bundleClaimed = true;
  await saveStore(store);

  trackEvent("quest_bundle_completed", {
    source: "quests_tab",
    period: "monthly",
    cycleId: store.monthly.cycleId,
    rewardType: "badge",
    rewardBadgeId: "monthly_consistency_v1",
  });

  return { granted: true, badgeId: "monthly_consistency_v1" };
}

export async function getXpBoostState(
  now: Date = new Date()
): Promise<{ active: boolean; remainingMs: number; consumedBonusXp: number }> {
  const store = await ensureStore(now);
  const ticket = store.xpBoostTicket;
  if (!ticket) {
    return { active: false, remainingMs: 0, consumedBonusXp: 0 };
  }

  if (ticket.validDate !== dateKey(now) || !ticket.activatedAt) {
    return {
      active: false,
      remainingMs: 0,
      consumedBonusXp: ticket.consumedBonusXp,
    };
  }

  const endTs = new Date(ticket.activatedAt).getTime() + ticket.durationMinutes * 60 * 1000;
  const remainingMs = Math.max(0, endTs - now.getTime());
  const active = remainingMs > 0 && ticket.consumedBonusXp < ticket.maxBonusXp;
  return {
    active,
    remainingMs,
    consumedBonusXp: ticket.consumedBonusXp,
  };
}

export async function applyXpBoost(
  baseXp: number,
  source: "lesson" | "question",
  now: Date = new Date()
): Promise<{ effectiveXp: number; bonusXp: number; boostApplied: boolean }> {
  const normalizedBaseXp = Math.max(0, Math.floor(baseXp));
  if (normalizedBaseXp === 0) {
    return { effectiveXp: 0, bonusXp: 0, boostApplied: false };
  }

  const store = await ensureStore(now);
  const ticket = store.xpBoostTicket;
  const today = dateKey(now);

  if (!ticket || ticket.validDate !== today) {
    return { effectiveXp: normalizedBaseXp, bonusXp: 0, boostApplied: false };
  }

  if (!ticket.activatedAt) {
    ticket.activatedAt = now.toISOString();
    trackEvent("xp_boost_started", {
      source,
      validDate: ticket.validDate,
      boostDurationMin: ticket.durationMinutes,
      multiplier: ticket.multiplier,
      maxBonusXp: ticket.maxBonusXp,
    });
  }

  const endTs = new Date(ticket.activatedAt).getTime() + ticket.durationMinutes * 60 * 1000;
  if (Number.isNaN(endTs) || now.getTime() >= endTs || ticket.consumedBonusXp >= ticket.maxBonusXp) {
    store.xpBoostTicket = null;
    await saveStore(store);
    trackEvent("xp_boost_expired", {
      source,
      reason: ticket.consumedBonusXp >= ticket.maxBonusXp ? "bonus_cap_reached" : "duration_ended",
    });
    return { effectiveXp: normalizedBaseXp, bonusXp: 0, boostApplied: false };
  }

  const multiplier = Math.max(1, ticket.multiplier);
  const maxBonus = Math.max(0, ticket.maxBonusXp);
  const remainingBonus = Math.max(0, maxBonus - ticket.consumedBonusXp);
  const candidateBonus = Math.max(0, Math.floor(normalizedBaseXp * (multiplier - 1)));
  const bonusXp = Math.min(candidateBonus, remainingBonus);
  const effectiveXp = normalizedBaseXp + bonusXp;

  ticket.consumedBonusXp += bonusXp;

  trackEvent("xp_boost_applied", {
    source,
    baseXp: normalizedBaseXp,
    bonusXp,
    effectiveXp,
    consumedBonusXp: ticket.consumedBonusXp,
    maxBonusXp: ticket.maxBonusXp,
    remainingMs: Math.max(0, endTs - now.getTime()),
  });

  if (ticket.consumedBonusXp >= ticket.maxBonusXp) {
    store.xpBoostTicket = null;
    trackEvent("xp_boost_expired", {
      source,
      reason: "bonus_cap_reached",
    });
  }

  await saveStore(store);

  return {
    effectiveXp,
    bonusXp,
    boostApplied: bonusXp > 0,
  };
}
