import { buildReminderPlan } from '../../lib/reminderRules';
import type { StudyRiskStatus } from '../../lib/streaks';

const config = {
  streak_risk_hour: 22,
  daily_quest_deadline_hour: 21,
  league_demotion_risk_hour_sunday: 18,
  default_enabled: true,
};

function risk(status: StudyRiskStatus['riskType']): StudyRiskStatus {
  return {
    riskType: status,
    todayStudied: status === 'safe_today',
    studyStreak: 3,
    lastStudyDate: status === 'inactive' ? null : '2026-02-18',
    daysSinceStudy: status === 'inactive' ? null : 1,
  };
}

describe('buildReminderPlan', () => {
  test('streak risk appears only when at_risk', () => {
    const plan = buildReminderPlan({
      now: new Date('2026-02-19T10:00:00+09:00'),
      config,
      studyRiskStatus: risk('at_risk'),
      hasPendingDailyQuests: false,
      isLeagueDemotionRisk: false,
    });

    expect(plan.find((item) => item.kind === 'streak_risk')).toBeTruthy();
    expect(plan.find((item) => item.kind === 'streak_risk')?.hour).toBe(22);

    const safePlan = buildReminderPlan({
      now: new Date('2026-02-19T10:00:00+09:00'),
      config,
      studyRiskStatus: risk('safe_today'),
      hasPendingDailyQuests: false,
      isLeagueDemotionRisk: false,
    });

    expect(safePlan.find((item) => item.kind === 'streak_risk')).toBeUndefined();
  });

  test('daily quest reminder appears only when pending daily exists', () => {
    const withPending = buildReminderPlan({
      now: new Date('2026-02-19T10:00:00+09:00'),
      config,
      studyRiskStatus: risk('safe_today'),
      hasPendingDailyQuests: true,
      isLeagueDemotionRisk: false,
    });

    expect(withPending.find((item) => item.kind === 'daily_quest_deadline')).toBeTruthy();
    expect(withPending.find((item) => item.kind === 'daily_quest_deadline')?.hour).toBe(21);

    const withoutPending = buildReminderPlan({
      now: new Date('2026-02-19T10:00:00+09:00'),
      config,
      studyRiskStatus: risk('safe_today'),
      hasPendingDailyQuests: false,
      isLeagueDemotionRisk: false,
    });

    expect(withoutPending.find((item) => item.kind === 'daily_quest_deadline')).toBeUndefined();
  });

  test('league demotion reminder appears on sunday demotion risk before 18:00 only', () => {
    const sundayPlan = buildReminderPlan({
      now: new Date('2026-02-22T10:00:00+09:00'),
      config,
      studyRiskStatus: risk('safe_today'),
      hasPendingDailyQuests: false,
      isLeagueDemotionRisk: true,
    });

    const leagueItem = sundayPlan.find((item) => item.kind === 'league_demotion_risk');
    expect(leagueItem).toBeTruthy();
    expect(leagueItem?.mode).toBe('once');
    expect(leagueItem?.scheduledAt).toBeTruthy();

    const sundayLatePlan = buildReminderPlan({
      now: new Date('2026-02-22T20:00:00+09:00'),
      config,
      studyRiskStatus: risk('safe_today'),
      hasPendingDailyQuests: false,
      isLeagueDemotionRisk: true,
    });

    expect(sundayLatePlan.find((item) => item.kind === 'league_demotion_risk')).toBeUndefined();
  });

  test('same-day re-sync plan stays deduplicated by kind', () => {
    const plan = buildReminderPlan({
      now: new Date('2026-02-22T10:00:00+09:00'),
      config,
      studyRiskStatus: risk('at_risk'),
      hasPendingDailyQuests: true,
      isLeagueDemotionRisk: true,
    });

    const kinds = plan.map((item) => item.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });
});
