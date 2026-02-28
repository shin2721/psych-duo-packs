import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { Analytics } from './analytics';
import { getNotificationsConfig } from './gamificationConfig';
import { getMyLeague } from './league';
import i18n from './i18n';
import { buildReminderPlan, localDateAtHour, type ReminderKind } from './reminderRules';
import { getStudyRiskStatus } from './streaks';

const NOTIFICATION_PREF_KEY = '@psycle_notifications_enabled';
const REMINDER_SOURCE = 'psycle_reminder_v1';

const DEFAULT_PATH_BY_KIND: Record<ReminderKind, '/(tabs)/course' | '/(tabs)/quests' | '/(tabs)/leaderboard'> = {
  streak_risk: '/(tabs)/course',
  daily_quest_deadline: '/(tabs)/quests',
  league_demotion_risk: '/(tabs)/leaderboard',
  streak_broken: '/(tabs)/course',
  energy_recharged: '/(tabs)/course',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type { ReminderKind } from './reminderRules';

export async function getNotificationPreference(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(NOTIFICATION_PREF_KEY);
  if (raw === null) {
    return getNotificationsConfig().default_enabled;
  }
  return raw === '1';
}

export async function setNotificationPreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, enabled ? '1' : '0');
}

export async function ensureNotificationPermission(
  source: 'settings_toggle' | 'bootstrap' = 'bootstrap'
): Promise<'granted' | 'denied'> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    Analytics.track('notification_permission_result', {
      status: 'granted',
      source,
    });
    return 'granted';
  }

  const requested = await Notifications.requestPermissionsAsync();
  const status = requested.granted ? 'granted' : 'denied';

  Analytics.track('notification_permission_result', {
    status,
    source,
  });

  return status;
}

export async function cancelPsycleReminders(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const targets = all.filter(
    (item) => item.content.data && (item.content.data as Record<string, unknown>).source === REMINDER_SOURCE
  );

  await Promise.all(targets.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

function nextDailyOccurrenceIso(now: Date, hour: number, minute: number): string {
  const target = localDateAtHour(now, hour, minute);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.toISOString();
}

async function scheduleReminder(params: {
  kind: ReminderKind;
  path: '/(tabs)/course' | '/(tabs)/quests' | '/(tabs)/leaderboard';
  title: string;
  body: string;
  mode: 'daily' | 'once';
  hour: number;
  minute: number;
  now: Date;
  scheduledAt?: string;
}): Promise<void> {
  const { kind, path, title, body, mode, hour, minute, now, scheduledAt } = params;

  if (mode === 'daily') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          source: REMINDER_SOURCE,
          kind,
          path,
        },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    Analytics.track('reminder_scheduled', {
      kind,
      scheduledAt: nextDailyOccurrenceIso(now, hour, minute),
      source: 'sync_daily_reminders',
    });

    return;
  }

  if (!scheduledAt) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        source: REMINDER_SOURCE,
        kind,
        path,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(scheduledAt),
    },
  });

  Analytics.track('reminder_scheduled', {
    kind,
    scheduledAt,
    source: 'sync_daily_reminders',
  });
}

export async function syncDailyReminders(input: {
  userId: string;
  hasPendingDailyQuests: boolean;
  streakRepairOffer?: { active: boolean; expiresAtMs: number } | null;
  energy?: number;
  maxEnergy?: number;
  lastEnergyUpdateTime?: number | null;
  energyRefillMinutes?: number;
  isSubscriptionActive?: boolean;
  now?: Date;
}): Promise<void> {
  const {
    userId,
    hasPendingDailyQuests,
    streakRepairOffer,
    energy,
    maxEnergy,
    lastEnergyUpdateTime,
    energyRefillMinutes,
    isSubscriptionActive,
  } = input;
  const now = input.now ?? new Date();

  if (!userId) return;

  const enabled = await getNotificationPreference();
  if (!enabled) {
    await cancelPsycleReminders();
    return;
  }

  const permission = await ensureNotificationPermission('bootstrap');
  if (permission !== 'granted') {
    await cancelPsycleReminders();
    return;
  }

  const [studyRiskStatus, leagueInfo] = await Promise.all([
    getStudyRiskStatus(now),
    now.getDay() === 0 ? getMyLeague(userId) : Promise.resolve(null),
  ]);

  const isLeagueDemotionRisk = !!(
    leagueInfo && leagueInfo.my_rank > 0 && leagueInfo.my_rank >= leagueInfo.demotion_zone
  );

  const plan = buildReminderPlan({
    now,
    config: getNotificationsConfig(),
    studyRiskStatus,
    hasPendingDailyQuests,
    isLeagueDemotionRisk,
  });

  const extraPlan: typeof plan = [];
  const nowMs = now.getTime();

  if (streakRepairOffer?.active && Number.isFinite(streakRepairOffer.expiresAtMs)) {
    const expiresAtMs = Math.floor(streakRepairOffer.expiresAtMs);
    const scheduledMs = Math.min(expiresAtMs - 60 * 1000, nowMs + 5 * 60 * 1000);
    if (scheduledMs > nowMs) {
      extraPlan.push({
        kind: 'streak_broken',
        path: '/(tabs)/course',
        titleKey: 'notifications.streakBroken.title',
        bodyKey: 'notifications.streakBroken.body',
        mode: 'once',
        hour: 0,
        minute: 0,
        scheduledAt: new Date(scheduledMs).toISOString(),
      });
    }
  }

  if (
    !isSubscriptionActive &&
    Number.isFinite(energy) &&
    Number.isFinite(maxEnergy) &&
    Number.isFinite(lastEnergyUpdateTime) &&
    Number.isFinite(energyRefillMinutes)
  ) {
    const safeEnergy = Math.max(0, Math.floor(Number(energy)));
    const safeMaxEnergy = Math.max(0, Math.floor(Number(maxEnergy)));
    const remainingEnergy = safeMaxEnergy - safeEnergy;
    if (remainingEnergy > 0) {
      const refillMs = Math.max(1, Math.floor(Number(energyRefillMinutes))) * 60 * 1000;
      const targetMs = Math.floor(Number(lastEnergyUpdateTime)) + remainingEnergy * refillMs;
      if (targetMs > nowMs) {
        extraPlan.push({
          kind: 'energy_recharged',
          path: '/(tabs)/course',
          titleKey: 'notifications.energyRecharged.title',
          bodyKey: 'notifications.energyRecharged.body',
          mode: 'once',
          hour: 0,
          minute: 0,
          scheduledAt: new Date(targetMs).toISOString(),
        });
      }
    }
  }

  const fullPlan = [...plan, ...extraPlan];

  await cancelPsycleReminders();

  for (const item of fullPlan) {
    await scheduleReminder({
      kind: item.kind,
      path: item.path,
      title: String(i18n.t(item.titleKey)),
      body: String(i18n.t(item.bodyKey)),
      mode: item.mode,
      hour: item.hour,
      minute: item.minute,
      now,
      scheduledAt: item.scheduledAt,
    });
  }
}

export function registerNotificationResponseHandler(
  onRoute: (path: '/(tabs)/course' | '/(tabs)/quests' | '/(tabs)/leaderboard') => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    if (!data || data.source !== REMINDER_SOURCE) return;

    const kind = (typeof data.kind === 'string' ? data.kind : undefined) as ReminderKind | undefined;
    if (kind) {
      Analytics.track('reminder_opened', {
        kind,
        source: 'notification_tap',
      });
    }

    const path =
      (typeof data.path === 'string' ? data.path : undefined) ||
      (kind ? DEFAULT_PATH_BY_KIND[kind] : undefined);

    if (
      path === '/(tabs)/course' ||
      path === '/(tabs)/quests' ||
      path === '/(tabs)/leaderboard'
    ) {
      onRoute(path);
    }
  });

  return () => subscription.remove();
}
