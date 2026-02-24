type QuestType = "daily" | "weekly" | "monthly";

type QuestLike = {
  type: QuestType;
  progress: number;
  claimed: boolean;
  chestState: "closed" | "opening" | "opened";
};

export type QuestCycleKeys = {
  daily: string;
  weekly: string;
  monthly: string;
};

export type QuestCycleResetType = QuestType;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getIsoWeekKey(date: Date): string {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (localDate.getDay() + 6) % 7; // Monday=0 ... Sunday=6
  localDate.setDate(localDate.getDate() + 3 - day); // Thursday 기준

  const weekYear = localDate.getFullYear();
  const firstThursday = new Date(weekYear, 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() + 3 - firstDay);

  const weekNumber =
    1 + Math.round((localDate.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return `${weekYear}-W${pad2(weekNumber)}`;
}

export function getQuestCycleKeys(now: Date = new Date()): QuestCycleKeys {
  const daily = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const weekly = getIsoWeekKey(now);
  const monthly = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  return { daily, weekly, monthly };
}

export function areQuestCycleKeysEqual(a: QuestCycleKeys, b: QuestCycleKeys): boolean {
  return a.daily === b.daily && a.weekly === b.weekly && a.monthly === b.monthly;
}

export function resetQuestsByCycleChange<T extends QuestLike>(
  quests: T[],
  prevKeys: QuestCycleKeys,
  nextKeys: QuestCycleKeys
): { quests: T[]; resetTypes: QuestCycleResetType[] } {
  const resetTypes: QuestCycleResetType[] = [];
  if (prevKeys.daily !== nextKeys.daily) resetTypes.push("daily");
  if (prevKeys.weekly !== nextKeys.weekly) resetTypes.push("weekly");
  if (prevKeys.monthly !== nextKeys.monthly) resetTypes.push("monthly");

  if (resetTypes.length === 0) {
    return { quests, resetTypes };
  }

  const resetTypeSet = new Set<QuestType>(resetTypes);
  const nextQuests = quests.map((quest) => {
    if (!resetTypeSet.has(quest.type)) return quest;
    return {
      ...quest,
      progress: 0,
      claimed: false,
      chestState: "closed",
    };
  });

  return {
    quests: nextQuests as T[],
    resetTypes,
  };
}
