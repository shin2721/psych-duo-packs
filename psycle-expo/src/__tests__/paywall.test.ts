import { getPaywallProgress, shouldShowPaywall } from '../../lib/paywall';

describe('paywall (study-only)', () => {
  test('lessonCompleteCount = 2 -> hidden', () => {
    expect(shouldShowPaywall(2)).toBe(false);
  });

  test('lessonCompleteCount = 3 -> visible', () => {
    expect(shouldShowPaywall(3)).toBe(true);
  });

  test('progress is lesson-only and becomes ready at threshold', () => {
    expect(getPaywallProgress(0)).toEqual({
      canShow: false,
      progress: '0/3 lessons',
    });
    expect(getPaywallProgress(2)).toEqual({
      canShow: false,
      progress: '2/3 lessons',
    });
    expect(getPaywallProgress(3)).toEqual({
      canShow: true,
      progress: 'ready',
    });
  });
});
