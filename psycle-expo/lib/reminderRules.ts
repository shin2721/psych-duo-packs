import type { StudyRiskStatus } from './streaks';
import type { NotificationsConfig } from './gamificationConfig';

export type ReminderKind = 'streak_risk' | 'daily_quest_deadline' | 'league_demotion_risk';

export interface ReminderPlanItem {
  kind: ReminderKind;
  path: '/(tabs)/course' | '/(tabs)/quests' | '/(tabs)/leaderboard';
  titleKey: string;
  bodyKey: string;
  mode: 'daily' | 'once';
  hour: number;
  minute: number;
  scheduledAt?: string;
}

export interface BuildReminderPlanInput {
  now: Date;
  config: NotificationsConfig;
  studyRiskStatus: StudyRiskStatus;
  hasPendingDailyQuests: boolean;
  isLeagueDemotionRisk: boolean;
}

export function isSundayLocal(now: Date): boolean {
  return now.getDay() === 0;
}

export function localDateAtHour(now: Date, hour: number, minute = 0): Date {
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function buildReminderPlan(input: BuildReminderPlanInput): ReminderPlanItem[] {
  const { now, config, studyRiskStatus, hasPendingDailyQuests, isLeagueDemotionRisk } = input;
  const plan: ReminderPlanItem[] = [];

  if (studyRiskStatus.riskType === 'at_risk') {
    plan.push({
      kind: 'streak_risk',
      path: '/(tabs)/course',
      titleKey: 'notifications.streakRisk.title',
      bodyKey: 'notifications.streakRisk.body',
      mode: 'daily',
      hour: config.streak_risk_hour,
      minute: 0,
    });
  }

  if (hasPendingDailyQuests) {
    plan.push({
      kind: 'daily_quest_deadline',
      path: '/(tabs)/quests',
      titleKey: 'notifications.dailyQuestDeadline.title',
      bodyKey: 'notifications.dailyQuestDeadline.body',
      mode: 'daily',
      hour: config.daily_quest_deadline_hour,
      minute: 0,
    });
  }

  if (isSundayLocal(now) && isLeagueDemotionRisk) {
    const target = localDateAtHour(now, config.league_demotion_risk_hour_sunday, 0);
    if (target.getTime() > now.getTime()) {
      plan.push({
        kind: 'league_demotion_risk',
        path: '/(tabs)/leaderboard',
        titleKey: 'notifications.leagueDemotionRisk.title',
        bodyKey: 'notifications.leagueDemotionRisk.body',
        mode: 'once',
        hour: config.league_demotion_risk_hour_sunday,
        minute: 0,
        scheduledAt: target.toISOString(),
      });
    }
  }

  const byKind = new Map<ReminderKind, ReminderPlanItem>();
  for (const item of plan) {
    byKind.set(item.kind, item);
  }

  return Array.from(byKind.values());
}
