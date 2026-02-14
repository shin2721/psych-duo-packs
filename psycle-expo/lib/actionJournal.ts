import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadLessons } from "./lessons";
import { dateKey } from "./streaks";

const STORAGE_KEY = "@psycle_action_journal_v1";
const SCHEMA_VERSION = 1;
const MAX_LESSON_HISTORY = 60;
const DAILY_JOURNAL_XP = 20;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type JournalResult = -2 | -1 | 0 | 1 | 2 | "not_tried";
export type TryOptionOrigin =
  | "recent_lesson"
  | "positive_history"
  | "genre_fallback"
  | "not_tried";

export interface TryOption {
  id: string;
  label: string;
  origin: TryOptionOrigin;
  lessonId: string | null;
  questionId: string | null;
  position: number;
}

export interface ActionJournalEntry {
  date: string;
  genreId: string;
  tryOptionId: string;
  tryLabel: string;
  result: JournalResult;
  note: string | null;
  rewardedXp: boolean;
  submittedAt: string;
  updatedAt: string;
}

export interface ActionJournalComposer {
  todayEntry: ActionJournalEntry | null;
  tryOptions: TryOption[];
  resultOptions: JournalResult[];
}

interface LessonCompletionLog {
  lessonId: string;
  genreId: string;
  completedAt: string;
  date: string;
}

interface ActionJournalStore {
  schemaVersion: number;
  lessonHistory: LessonCompletionLog[];
  entries: Record<string, ActionJournalEntry>;
}

const DEFAULT_STORE: ActionJournalStore = {
  schemaVersion: SCHEMA_VERSION,
  lessonHistory: [],
  entries: {},
};

function normalizeTryLabel(input: string): string {
  const removedEmoji = input
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
    .replace(/[\u200D]/g, "");
  return removedEmoji.replace(/\s+/g, " ").trim();
}

function normalizeTryKey(input: string): string {
  return normalizeTryLabel(input).toLowerCase();
}

function buildTryOptionId(label: string): string {
  const normalized = normalizeTryLabel(label);
  if (!normalized) return "not_tried";
  return `try:${normalized}`;
}

function isNotTriedOption(optionId: string): boolean {
  return optionId === "not_tried";
}

async function getStore(): Promise<ActionJournalStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STORE };
    const parsed = JSON.parse(raw) as Partial<ActionJournalStore>;
    return {
      schemaVersion: parsed.schemaVersion ?? SCHEMA_VERSION,
      lessonHistory: Array.isArray(parsed.lessonHistory) ? parsed.lessonHistory : [],
      entries: parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {},
    };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

async function saveStore(store: ActionJournalStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function parseLessonTarget(lessonId: string): { unit: string; level?: number } | null {
  const review = lessonId.match(/^([a-z]+)_review_/);
  if (review) {
    return { unit: review[1] };
  }
  const levelMatch = lessonId.match(/^([a-z]+)_l(\d+)$/);
  if (levelMatch) {
    return { unit: levelMatch[1], level: parseInt(levelMatch[2], 10) };
  }
  const lessonMatch = lessonId.match(/^([a-z]+)_lesson_(\d+)$/);
  if (lessonMatch) {
    return { unit: lessonMatch[1], level: parseInt(lessonMatch[2], 10) };
  }
  return null;
}

function getInterventionsFromLesson(genreId: string, lessonId: string): TryOption[] {
  const parsed = parseLessonTarget(lessonId);
  if (!parsed || parsed.unit !== genreId) return [];

  const lessons = loadLessons(parsed.unit);
  const exact = lessons.find((lesson) => lesson.id === lessonId);
  const byLevel =
    parsed.level != null
      ? lessons.find((lesson) => lesson.level === parsed.level && lesson.nodeType === "lesson")
      : null;
  const targetLesson = exact || byLevel;
  if (!targetLesson) return [];

  return targetLesson.questions
    .map((question: any) => {
      const details = question?.expanded_details;
      const claimType = details?.claim_type;
      const tryThis = typeof details?.try_this === "string" ? details.try_this : null;
      if (claimType !== "intervention" || !tryThis) return null;
      const normalizedLabel = normalizeTryLabel(tryThis);
      if (!normalizedLabel) return null;
      return {
        id: buildTryOptionId(normalizedLabel),
        label: normalizedLabel,
        origin: "recent_lesson" as const,
        lessonId,
        questionId: question?.id || question?.source_id || null,
        position: 0,
      };
    })
    .filter(Boolean) as TryOption[];
}

function getGenreFallbackOptions(genreId: string): TryOption[] {
  const lessons = loadLessons(genreId);
  const options: TryOption[] = [];
  for (const lesson of lessons) {
    for (const question of lesson.questions as any[]) {
      const details = question?.expanded_details;
      if (details?.claim_type !== "intervention") continue;
      const tryThis = typeof details?.try_this === "string" ? details.try_this : null;
      if (!tryThis) continue;
      const label = normalizeTryLabel(tryThis);
      if (!label) continue;
      options.push({
        id: buildTryOptionId(label),
        label,
        origin: "genre_fallback",
        lessonId: lesson.id,
        questionId: question?.id || question?.source_id || null,
        position: 0,
      });
    }
  }
  return options;
}

function dedupeOptions(options: TryOption[]): TryOption[] {
  const seen = new Set<string>();
  const out: TryOption[] = [];
  for (const option of options) {
    const key = normalizeTryKey(option.label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(option);
  }
  return out;
}

function recentDaysList(days: number, today: string): string[] {
  const target: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() - i);
    target.push(dateKey(d));
  }
  return target;
}

function getRecentPositiveOption(
  store: ActionJournalStore,
  genreId: string,
  today: string
): { option: TryOption; recencyBonus: number } | null {
  const dates = new Set(recentDaysList(30, today));
  const candidates = Object.values(store.entries)
    .filter((entry) => entry.genreId === genreId)
    .filter((entry) => dates.has(entry.date))
    .filter((entry) => typeof entry.result === "number" && entry.result >= 1)
    .filter((entry) => !isNotTriedOption(entry.tryOptionId));
  if (candidates.length === 0) return null;

  const byLabel = new Map<string, { count: number; lastUpdatedAt: string; label: string; tryOptionId: string }>();
  for (const entry of candidates) {
    const key = normalizeTryKey(entry.tryLabel);
    const current = byLabel.get(key);
    if (!current) {
      byLabel.set(key, {
        count: 1,
        lastUpdatedAt: entry.updatedAt,
        label: normalizeTryLabel(entry.tryLabel),
        tryOptionId: entry.tryOptionId,
      });
      continue;
    }
    current.count += 1;
    if (entry.updatedAt > current.lastUpdatedAt) {
      current.lastUpdatedAt = entry.updatedAt;
    }
  }

  const best = [...byLabel.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
  })[0];

  if (!best || !best.label) return null;
  const todayMs = new Date(`${today}T00:00:00`).getTime();
  const updatedMs = new Date(best.lastUpdatedAt).getTime();
  const diffDays = Number.isFinite(updatedMs)
    ? Math.max(0, Math.floor((todayMs - updatedMs) / ONE_DAY_MS))
    : 9;
  const recencyBonus = Math.max(0, 9 - diffDays);

  return {
    option: {
      id: best.tryOptionId || buildTryOptionId(best.label),
      label: best.label,
      origin: "positive_history",
      lessonId: null,
      questionId: null,
      position: 0,
    },
    recencyBonus,
  };
}

function buildTryOptions(store: ActionJournalStore, genreId: string, today: string): TryOption[] {
  type RankedOption = {
    option: TryOption;
    score: number;
    order: number;
  };

  const rankedByKey = new Map<string, RankedOption>();
  let insertionOrder = 0;

  const upsertRanked = (option: TryOption, score: number) => {
    const key = normalizeTryKey(option.label);
    if (!key || option.id === "not_tried") return;
    const current = rankedByKey.get(key);
    if (
      !current ||
      score > current.score ||
      (score === current.score && insertionOrder < current.order)
    ) {
      rankedByKey.set(key, {
        option: { ...option, position: 0 },
        score,
        order: insertionOrder,
      });
    }
    insertionOrder += 1;
  };

  const recentGenreLessons = store.lessonHistory
    .filter((item) => item.genreId === genreId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 5);

  const positive = getRecentPositiveOption(store, genreId, today);
  if (positive) {
    upsertRanked(positive.option, 90 + positive.recencyBonus);
  }

  recentGenreLessons.forEach((item, index) => {
    const recencyBonus = Math.max(0, 9 - index);
    const options = dedupeOptions(
      getInterventionsFromLesson(genreId, item.lessonId)
    ).map((option) => ({ ...option, origin: "recent_lesson" as const }));
    options.forEach((option) => upsertRanked(option, 70 + recencyBonus));
  });

  dedupeOptions(getGenreFallbackOptions(genreId)).forEach((option) => {
    upsertRanked(option, 40);
  });

  const rankedOptions = [...rankedByKey.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.order - b.order;
    })
    .slice(0, 3)
    .map((item) => item.option);

  const finalOptions = [
    ...rankedOptions,
    {
      id: "not_tried",
      label: "not_tried",
      origin: "not_tried" as const,
      lessonId: null,
      questionId: null,
      position: 0,
    },
  ].slice(0, 4);

  return finalOptions.map((option, index) => ({
    ...option,
    position: index + 1,
  }));
}

export async function recordLessonCompletionForJournal(
  lessonId: string,
  genreId: string
): Promise<void> {
  const store = await getStore();
  const now = new Date().toISOString();
  store.lessonHistory.push({
    lessonId,
    genreId,
    completedAt: now,
    date: dateKey(),
  });
  store.lessonHistory = store.lessonHistory
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, MAX_LESSON_HISTORY);
  await saveStore(store);
}

export async function getActionJournalComposer(genreId: string): Promise<ActionJournalComposer> {
  const store = await getStore();
  const today = dateKey();
  const todayEntry = store.entries[today] || null;
  const tryOptions = buildTryOptions(store, genreId, today).map((option) => {
    if (option.origin === "not_tried") {
      return {
        ...option,
        label: "not_tried",
      };
    }
    return option;
  });
  return {
    todayEntry,
    tryOptions,
    resultOptions: [-2, -1, 0, 1, 2],
  };
}

export async function submitActionJournal(input: {
  genreId: string;
  tryOptionId: string;
  tryLabel: string;
  result: JournalResult;
  note?: string;
}): Promise<{ created: boolean; updated: boolean; xpAwarded: boolean; rewardXp: number }> {
  const store = await getStore();
  const today = dateKey();
  const now = new Date().toISOString();
  const existing = store.entries[today] || null;

  const isNotTried = isNotTriedOption(input.tryOptionId);
  if (isNotTried && input.result !== "not_tried") {
    throw new Error("Invalid result for not_tried option");
  }
  if (!isNotTried && input.result === "not_tried") {
    throw new Error("not_tried result requires not_tried option");
  }

  const xpAwarded = !existing;
  const rewardXp = xpAwarded ? DAILY_JOURNAL_XP : 0;

  const entry: ActionJournalEntry = {
    date: today,
    genreId: input.genreId,
    tryOptionId: input.tryOptionId,
    tryLabel: isNotTried ? "not_tried" : normalizeTryLabel(input.tryLabel),
    result: input.result,
    note: input.note?.trim() ? input.note.trim() : null,
    rewardedXp: existing?.rewardedXp || xpAwarded,
    submittedAt: existing?.submittedAt || now,
    updatedAt: now,
  };

  store.entries[today] = entry;
  await saveStore(store);

  return {
    created: !existing,
    updated: Boolean(existing),
    xpAwarded,
    rewardXp,
  };
}
