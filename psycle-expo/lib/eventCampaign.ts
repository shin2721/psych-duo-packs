import type {
  EventCampaignConfig,
  EventQuestMetric,
  EventQuestTemplateConfig,
} from "./gamificationConfig";

export interface EventQuestInstance {
  id: string;
  templateId: string;
  metric: EventQuestMetric;
  need: number;
  progress: number;
  rewardGems: number;
  claimed: boolean;
  titleKey: string;
}

export interface EventCampaignState {
  eventId: string;
  started: boolean;
  completed: boolean;
  quests: EventQuestInstance[];
}

function parseTimeMs(value: string): number | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeInt(value: unknown, fallback: number, min = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.floor(parsed));
}

function createEventQuestInstance(template: EventQuestTemplateConfig): EventQuestInstance {
  return {
    id: template.template_id,
    templateId: template.template_id,
    metric: template.metric,
    need: Math.max(1, Math.floor(template.need)),
    progress: 0,
    rewardGems: Math.max(0, Math.floor(template.reward_gems)),
    claimed: false,
    titleKey: template.title_key,
  };
}

export function isEventWindowActive(now: Date, config: EventCampaignConfig): boolean {
  if (!config.enabled) return false;
  const nowMs = now.getTime();
  const startMs = parseTimeMs(config.start_at);
  const endMs = parseTimeMs(config.end_at);
  if (startMs === null || endMs === null) return false;
  if (endMs < startMs) return false;
  return nowMs >= startMs && nowMs <= endMs;
}

export function buildInitialEventState(config: EventCampaignConfig): EventCampaignState {
  return {
    eventId: config.id,
    started: false,
    completed: false,
    quests: config.quests.map(createEventQuestInstance),
  };
}

export function normalizeEventCampaignState(raw: unknown): EventCampaignState | null {
  if (!raw || typeof raw !== "object") return null;
  const state = raw as Partial<EventCampaignState>;
  if (typeof state.eventId !== "string" || state.eventId.length === 0) return null;
  if (!Array.isArray(state.quests)) return null;

  const quests: EventQuestInstance[] = [];
  for (const questRaw of state.quests) {
    if (!questRaw || typeof questRaw !== "object") continue;
    const quest = questRaw as Partial<EventQuestInstance>;
    if (typeof quest.templateId !== "string" || quest.templateId.length === 0) continue;
    if (quest.metric !== "lesson_complete" && quest.metric !== "streak5_milestone") continue;
    if (typeof quest.titleKey !== "string" || quest.titleKey.length === 0) continue;
    const need = normalizeInt(quest.need, 1, 1);
    const progress = Math.min(need, normalizeInt(quest.progress, 0, 0));
    quests.push({
      id: typeof quest.id === "string" && quest.id.length > 0 ? quest.id : quest.templateId,
      templateId: quest.templateId,
      metric: quest.metric,
      need,
      progress,
      rewardGems: normalizeInt(quest.rewardGems, 0, 0),
      claimed: Boolean(quest.claimed),
      titleKey: quest.titleKey,
    });
  }

  return {
    eventId: state.eventId,
    started: Boolean(state.started),
    completed: Boolean(state.completed),
    quests,
  };
}

export function reconcileEventStateOnAccess(
  state: EventCampaignState | null,
  config: EventCampaignConfig,
  _now: Date = new Date()
): EventCampaignState {
  const normalized = normalizeEventCampaignState(state);
  if (!normalized || normalized.eventId !== config.id) {
    return buildInitialEventState(config);
  }

  const byTemplate = new Map<string, EventQuestInstance>();
  normalized.quests.forEach((quest) => {
    byTemplate.set(quest.templateId, quest);
  });

  const quests = config.quests.map((template) => {
    const previous = byTemplate.get(template.template_id);
    const nextNeed = Math.max(1, Math.floor(template.need));
    const nextReward = Math.max(0, Math.floor(template.reward_gems));
    const progress = previous ? Math.min(nextNeed, previous.progress) : 0;
    const claimed = previous?.claimed === true && progress >= nextNeed;
    return {
      id: template.template_id,
      templateId: template.template_id,
      metric: template.metric,
      need: nextNeed,
      progress,
      rewardGems: nextReward,
      claimed,
      titleKey: template.title_key,
    };
  });

  const started = normalized.started || quests.some((quest) => quest.progress > 0);
  const completed = normalized.completed || (quests.length > 0 && quests.every((quest) => quest.claimed));

  return {
    eventId: config.id,
    started,
    completed,
    quests,
  };
}

export function applyEventMetricProgress(
  state: EventCampaignState,
  metric: EventQuestMetric,
  step: number
): EventCampaignState {
  const safeStep = normalizeInt(step, 0, 0);
  if (safeStep <= 0) return state;

  const quests = state.quests.map((quest) => {
    if (quest.metric !== metric || quest.claimed) return quest;
    return {
      ...quest,
      progress: Math.min(quest.need, quest.progress + safeStep),
    };
  });

  return {
    ...state,
    quests,
  };
}

export function getEventRemainingMs(config: EventCampaignConfig, now: Date = new Date()): number {
  const endMs = parseTimeMs(config.end_at);
  if (endMs === null) return 0;
  return Math.max(0, endMs - now.getTime());
}
