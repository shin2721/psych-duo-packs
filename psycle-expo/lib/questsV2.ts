import AsyncStorage from "@react-native-async-storage/async-storage";
import { dateKey } from "./streaks";

const STORAGE_KEY = "@psycle_quests_v2";
const SCHEMA_VERSION = 2;
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
export type QuestClaimMode = "auto" | "manual";
export type QuestClaimSource = "lesson_complete" | "journal_submit" | "quests_tab";

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

export interface QueuedXpBoostTicket {
  validDate: string;
  durationMinutes: number;
  multiplier: number;
  maxBonusXp: number;
}

export interface QuestAutoClaimResult {
  claimedQuests: string[];
  claimedGems: number;
  weeklyFreezesGranted: number;
  monthlyBadgeId: string | null;
  dailyTicketGranted: boolean;
  dailyTicketQueued: boolean;
  dailyTicketBlocked: boolean;
  dailyTicketValidDate: string | null;
  dailyTicketQueuedValidDate: string | null;
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
    queuedValidDate: string | null;
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
  queuedXpBoostTicket: QueuedXpBoostTicket | null;
}

interface QuestClaimMeta {
  source?: QuestClaimSource;
  claimMode?: QuestClaimMode;
  trigger?: string;
}

interface QuestClaimResult {
  claimed: boolean;
  rewardGems: number;
}

interface DailyBundleClaimResult {
  granted: boolean;
  ticket?: XpBoostTicket;
  queuedTicket?: QueuedXpBoostTicket;
  blocked: boolean;
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
    queuedXpBoostTicket: null,
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

function sanitizeQueuedTicket(input: Partial<QueuedXpBoostTicket> | null | undefined): QueuedXpBoostTicket | null {
  if (!input || !input.validDate) return null;
  return {
    validDate: input.validDate,
    durationMinutes: Number(input.durationMinutes || BOOST_DURATION_MINUTES),
    multiplier: Number(input.multiplier || BOOST_MULTIPLIER),
    maxBonusXp: Number(input.maxBonusXp || BOOST_MAX_BONUS_XP),
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
      schemaVersion: Number(parsed.schemaVersion || SCHEMA_VERSION),
      daily: sanitizePeriodState(parsed.daily, "daily", dailyCycleId),
      weekly: sanitizePeriodState(parsed.weekly, "weekly", weeklyCycleId),
      monthly: sanitizePeriodState(parsed.monthly, "monthly", monthlyCycleId),
      xpBoostTicket: parsed.xpBoostTicket || null,
      queuedXpBoostTicket: sanitizeQueuedTicket(parsed.queuedXpBoostTicket),
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

function normalizeClaimMeta(meta?: QuestClaimMeta): Required<QuestClaimMeta> {
  return {
    source: meta?.source || "quests_tab",
    claimMode: meta?.claimMode || "manual",
    trigger: meta?.trigger || "unspecified",
  };
}

function createTicket(validDate: string): XpBoostTicket {
  return {
    validDate,
    durationMinutes: BOOST_DURATION_MINUTES,
    multiplier: BOOST_MULTIPLIER,
    maxBonusXp: BOOST_MAX_BONUS_XP,
    activatedAt: null,
    consumedBonusXp: 0,
  };
}

function createNextDayTicket(now: Date): XpBoostTicket {
  const validDate = dateKey(new Date(now.getTime() + ONE_DAY_MS));
  return createTicket(validDate);
}

function toQueuedTicket(ticket: XpBoostTicket): QueuedXpBoostTicket {
  return {
    validDate: ticket.validDate,
    durationMinutes: ticket.durationMinutes,
    multiplier: ticket.multiplier,
    maxBonusXp: ticket.maxBonusXp,
  };
}

function fromQueuedTicket(ticket: QueuedXpBoostTicket): XpBoostTicket {
  return {
    validDate: ticket.validDate,
    durationMinutes: ticket.durationMinutes,
    multiplier: ticket.multiplier,
    maxBonusXp: ticket.maxBonusXp,
    activatedAt: null,
    consumedBonusXp: 0,
  };
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

function isQueuedTicketExpired(ticket: QueuedXpBoostTicket, now: Date): boolean {
  return ticket.validDate < dateKey(now);
}

function ensureTicketConsistency(
  store: QuestStore,
  now: Date
): { changed: boolean; primaryExpired: boolean; queuedExpired: boolean; queuedPromoted: boolean } {
  let changed = false;
  let primaryExpired = false;
  let queuedExpired = false;
  let queuedPromoted = false;

  const primary = store.xpBoostTicket;
  if (primary && isTicketExpired(primary, now)) {
    store.xpBoostTicket = null;
    changed = true;
    primaryExpired = true;
  }

  const queued = store.queuedXpBoostTicket;
  if (queued && isQueuedTicketExpired(queued, now)) {
    store.queuedXpBoostTicket = null;
    changed = true;
    queuedExpired = true;
  }

  if (!store.xpBoostTicket && store.queuedXpBoostTicket) {
    store.xpBoostTicket = fromQueuedTicket(store.queuedXpBoostTicket);
    store.queuedXpBoostTicket = null;
    changed = true;
    queuedPromoted = true;
  }

  return { changed, primaryExpired, queuedExpired, queuedPromoted };
}

function assignDailyTicket(
  store: QuestStore,
  ticket: XpBoostTicket,
  meta?: QuestClaimMeta
): { ticketGranted: boolean; ticketQueued: boolean; ticketBlocked: boolean; queuedTicket?: QueuedXpBoostTicket } {
  const normalizedMeta = normalizeClaimMeta(meta);

  if (!store.xpBoostTicket) {
    store.xpBoostTicket = ticket;
    trackEvent("xp_boost_ticket_granted", {
      source: normalizedMeta.source,
      claimMode: normalizedMeta.claimMode,
      trigger: normalizedMeta.trigger,
      validDate: ticket.validDate,
      boostDurationMin: ticket.durationMinutes,
      multiplier: ticket.multiplier,
      maxBonusXp: ticket.maxBonusXp,
    });
    return { ticketGranted: true, ticketQueued: false, ticketBlocked: false };
  }

  if (!store.queuedXpBoostTicket) {
    const queued = toQueuedTicket(ticket);
    store.queuedXpBoostTicket = queued;
    trackEvent("xp_boost_ticket_queued", {
      source: normalizedMeta.source,
      claimMode: normalizedMeta.claimMode,
      trigger: normalizedMeta.trigger,
      validDate: queued.validDate,
      boostDurationMin: queued.durationMinutes,
      multiplier: queued.multiplier,
      maxBonusXp: queued.maxBonusXp,
    });
    return { ticketGranted: false, ticketQueued: true, ticketBlocked: false, queuedTicket: queued };
  }

  trackEvent("xp_boost_ticket_grant_blocked", {
    source: normalizedMeta.source,
    claimMode: normalizedMeta.claimMode,
    trigger: normalizedMeta.trigger,
    reason: "queue_full",
  });
  return { ticketGranted: false, ticketQueued: false, ticketBlocked: true };
}

function resolveDailyBundleRewardType(result: { ticketGranted: boolean; ticketQueued: boolean; ticketBlocked: boolean }): string {
  if (result.ticketGranted) return "xp_boost_ticket";
  if (result.ticketQueued) return "xp_boost_ticket_queued";
  return "xp_boost_ticket_blocked";
}

function claimQuestRewardInternal(
  store: QuestStore,
  questId: string,
  now: Date,
  meta?: QuestClaimMeta
): QuestClaimResult {
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
  const normalizedMeta = normalizeClaimMeta(meta);

  trackEvent("quest_reward_claimed", {
    source: normalizedMeta.source,
    claimMode: normalizedMeta.claimMode,
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

function claimDailyBundleRewardInternal(
  store: QuestStore,
  now: Date,
  meta?: QuestClaimMeta,
  options?: { cycleIdOverride?: string; ticketValidDateOverride?: string }
): DailyBundleClaimResult {
  const defs = definitionsByPeriod("daily");
  const allDailyClaimed = defs.every((quest) => store.daily.claimed[quest.id] === true);
  if (!allDailyClaimed || store.daily.bundleClaimed) {
    return { granted: false, blocked: false };
  }

  store.daily.bundleClaimed = true;
  const ticket = createTicket(options?.ticketValidDateOverride || dateKey(new Date(now.getTime() + ONE_DAY_MS)));
  const ticketResult = assignDailyTicket(store, ticket, meta);
  const normalizedMeta = normalizeClaimMeta(meta);

  trackEvent("quest_bundle_completed", {
    source: normalizedMeta.source,
    claimMode: normalizedMeta.claimMode,
    period: "daily",
    cycleId: options?.cycleIdOverride || store.daily.cycleId,
    rewardType: resolveDailyBundleRewardType(ticketResult),
  });

  return {
    granted: true,
    blocked: ticketResult.ticketBlocked,
    ticket: ticketResult.ticketGranted ? ticket : undefined,
    queuedTicket: ticketResult.ticketQueued ? ticketResult.queuedTicket : undefined,
  };
}

function claimWeeklyBundleRewardInternal(
  store: QuestStore,
  meta?: QuestClaimMeta
): { granted: boolean; rewardFreezes: number } {
  const defs = definitionsByPeriod("weekly");
  const allWeeklyClaimed = defs.every((quest) => store.weekly.claimed[quest.id] === true);

  if (!allWeeklyClaimed || store.weekly.bundleClaimed) {
    return { granted: false, rewardFreezes: 0 };
  }

  store.weekly.bundleClaimed = true;
  const normalizedMeta = normalizeClaimMeta(meta);

  trackEvent("quest_bundle_completed", {
    source: normalizedMeta.source,
    claimMode: normalizedMeta.claimMode,
    period: "weekly",
    cycleId: store.weekly.cycleId,
    rewardType: "freeze",
    rewardAmount: 1,
  });

  return { granted: true, rewardFreezes: 1 };
}

function claimMonthlyBundleRewardInternal(
  store: QuestStore,
  meta?: QuestClaimMeta
): { granted: boolean; badgeId: string | null } {
  const defs = definitionsByPeriod("monthly");
  const allMonthlyClaimed = defs.every((quest) => store.monthly.claimed[quest.id] === true);

  if (!allMonthlyClaimed || store.monthly.bundleClaimed) {
    return { granted: false, badgeId: null };
  }

  store.monthly.bundleClaimed = true;
  const normalizedMeta = normalizeClaimMeta(meta);

  trackEvent("quest_bundle_completed", {
    source: normalizedMeta.source,
    claimMode: normalizedMeta.claimMode,
    period: "monthly",
    cycleId: store.monthly.cycleId,
    rewardType: "badge",
    rewardBadgeId: "monthly_consistency_v1",
  });

  return { granted: true, badgeId: "monthly_consistency_v1" };
}

async function ensureStore(now: Date = new Date()): Promise<QuestStore> {
  const store = await loadStore(now);
  let changed = false;

  const ticketState = ensureTicketConsistency(store, now);
  if (ticketState.primaryExpired) {
    trackEvent("xp_boost_expired", {
      source: "quests_tab",
      reason: "expired_or_capped",
    });
  }
  changed = changed || ticketState.changed;

  // Legacy compatibility path: previous daily bundle left unclaimed in older state.
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
      const bundleResult = claimDailyBundleRewardInternal(
        store,
        now,
        { source: "quests_tab", claimMode: "auto", trigger: "daily_bundle_rollover" },
        { cycleIdOverride: previousCycleDay, ticketValidDateOverride: expectedToday }
      );
      if (bundleResult.granted) {
        changed = true;
      }
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
      queuedValidDate: store.queuedXpBoostTicket?.validDate || null,
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
  now: Date = new Date(),
  meta?: { source?: QuestClaimSource; claimMode?: QuestClaimMode }
): Promise<{ claimed: boolean; rewardGems: number }> {
  const store = await ensureStore(now);
  const result = claimQuestRewardInternal(store, questId, now, meta);
  if (result.claimed) {
    await saveStore(store);
  }
  return result;
}

export async function claimDailyBundleRewardIfEligible(
  now: Date = new Date(),
  meta?: { source?: QuestClaimSource; claimMode?: QuestClaimMode }
): Promise<{ granted: boolean; ticket?: XpBoostTicket; queuedTicket?: QueuedXpBoostTicket; blocked: boolean }> {
  const store = await ensureStore(now);
  const result = claimDailyBundleRewardInternal(store, now, {
    source: meta?.source,
    claimMode: meta?.claimMode,
    trigger: "daily_bundle_claim",
  });
  if (result.granted) {
    await saveStore(store);
  }
  return result;
}

export async function claimWeeklyBundleRewardIfEligible(
  now: Date = new Date(),
  meta?: { source?: QuestClaimSource; claimMode?: QuestClaimMode }
): Promise<{ granted: boolean; rewardFreezes: number }> {
  const store = await ensureStore(now);
  const result = claimWeeklyBundleRewardInternal(store, {
    source: meta?.source,
    claimMode: meta?.claimMode,
    trigger: "weekly_bundle_claim",
  });
  if (result.granted) {
    await saveStore(store);
  }
  return result;
}

export async function claimMonthlyBundleRewardIfEligible(
  now: Date = new Date(),
  meta?: { source?: QuestClaimSource; claimMode?: QuestClaimMode }
): Promise<{ granted: boolean; badgeId: string | null }> {
  const store = await ensureStore(now);
  const result = claimMonthlyBundleRewardInternal(store, {
    source: meta?.source,
    claimMode: meta?.claimMode,
    trigger: "monthly_bundle_claim",
  });
  if (result.granted) {
    await saveStore(store);
  }
  return result;
}

export async function autoClaimEligibleQuestRewards(
  input?: { source?: QuestClaimSource; now?: Date }
): Promise<QuestAutoClaimResult> {
  const now = input?.now || new Date();
  const source = input?.source || "quests_tab";

  const store = await ensureStore(now);

  const result: QuestAutoClaimResult = {
    claimedQuests: [],
    claimedGems: 0,
    weeklyFreezesGranted: 0,
    monthlyBadgeId: null,
    dailyTicketGranted: false,
    dailyTicketQueued: false,
    dailyTicketBlocked: false,
    dailyTicketValidDate: null,
    dailyTicketQueuedValidDate: null,
  };

  let changed = false;

  for (const definition of QUEST_DEFINITIONS) {
    const claim = claimQuestRewardInternal(store, definition.id, now, {
      source,
      claimMode: "auto",
      trigger: "auto_claim_pass",
    });
    if (!claim.claimed) continue;
    changed = true;
    result.claimedQuests.push(definition.id);
    result.claimedGems += claim.rewardGems;
  }

  const dailyBundle = claimDailyBundleRewardInternal(
    store,
    now,
    { source, claimMode: "auto", trigger: "daily_bundle_auto_claim" }
  );
  if (dailyBundle.granted) {
    changed = true;
    result.dailyTicketGranted = Boolean(dailyBundle.ticket);
    result.dailyTicketQueued = Boolean(dailyBundle.queuedTicket);
    result.dailyTicketBlocked = Boolean(dailyBundle.blocked);
    result.dailyTicketValidDate = dailyBundle.ticket?.validDate || null;
    result.dailyTicketQueuedValidDate = dailyBundle.queuedTicket?.validDate || null;
  }

  const weeklyBundle = claimWeeklyBundleRewardInternal(store, {
    source,
    claimMode: "auto",
    trigger: "weekly_bundle_auto_claim",
  });
  if (weeklyBundle.granted) {
    changed = true;
    result.weeklyFreezesGranted = weeklyBundle.rewardFreezes;
  }

  const monthlyBundle = claimMonthlyBundleRewardInternal(store, {
    source,
    claimMode: "auto",
    trigger: "monthly_bundle_auto_claim",
  });
  if (monthlyBundle.granted) {
    changed = true;
    result.monthlyBadgeId = monthlyBundle.badgeId;
  }

  if (changed) {
    await saveStore(store);
    trackEvent("quest_auto_claim_applied", {
      source,
      claimedQuestCount: result.claimedQuests.length,
      claimedGems: result.claimedGems,
      weeklyFreezesGranted: result.weeklyFreezesGranted,
      monthlyBadgeGranted: Boolean(result.monthlyBadgeId),
      dailyTicketGranted: result.dailyTicketGranted,
      dailyTicketQueued: result.dailyTicketQueued,
      dailyTicketBlocked: result.dailyTicketBlocked,
    });
  }

  return result;
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
