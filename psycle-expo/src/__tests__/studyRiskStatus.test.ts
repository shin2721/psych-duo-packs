jest.mock('../../lib/analytics', () => ({
  Analytics: {
    track: jest.fn(),
  },
}));

import { getStudyRiskStatusFromData } from '../../lib/streaks';

describe('getStudyRiskStatusFromData', () => {
  const now = new Date('2026-02-19T10:00:00+09:00');

  test('today studied -> safe_today', () => {
    const result = getStudyRiskStatusFromData(
      {
        studyStreak: 5,
        lastStudyDate: '2026-02-19',
      },
      now
    );

    expect(result.riskType).toBe('safe_today');
    expect(result.todayStudied).toBe(true);
    expect(result.daysSinceStudy).toBe(0);
  });

  test('yesterday studied -> at_risk', () => {
    const result = getStudyRiskStatusFromData(
      {
        studyStreak: 4,
        lastStudyDate: '2026-02-18',
      },
      now
    );

    expect(result.riskType).toBe('at_risk');
    expect(result.todayStudied).toBe(false);
    expect(result.daysSinceStudy).toBe(1);
  });

  test('no history -> inactive', () => {
    const result = getStudyRiskStatusFromData(
      {
        studyStreak: 0,
        lastStudyDate: null,
      },
      now
    );

    expect(result.riskType).toBe('inactive');
    expect(result.todayStudied).toBe(false);
    expect(result.daysSinceStudy).toBeNull();
  });
});
