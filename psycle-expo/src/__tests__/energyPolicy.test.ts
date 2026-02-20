import { getEffectiveFreeEnergyCap, isFirstDayBonusActive } from '../../lib/energyPolicy';

describe('energyPolicy', () => {
  const launchAt = Date.UTC(2026, 1, 20, 0, 0, 0); // 2026-02-20T00:00:00Z

  test('firstLaunchAt null -> bonus inactive, cap = base', () => {
    expect(isFirstDayBonusActive(null, launchAt)).toBe(false);
    expect(getEffectiveFreeEnergyCap(3, 3, null, launchAt)).toBe(3);
  });

  test('within 24h -> bonus active, cap = base + bonus', () => {
    const now = launchAt + (23 * 60 + 59) * 60 * 1000;
    expect(isFirstDayBonusActive(launchAt, now)).toBe(true);
    expect(getEffectiveFreeEnergyCap(3, 3, launchAt, now)).toBe(6);
  });

  test('exactly 24h -> bonus inactive, cap = base', () => {
    const now = launchAt + 24 * 60 * 60 * 1000;
    expect(isFirstDayBonusActive(launchAt, now)).toBe(false);
    expect(getEffectiveFreeEnergyCap(3, 3, launchAt, now)).toBe(3);
  });

  test('after 48h -> bonus inactive, cap = base', () => {
    const now = launchAt + 48 * 60 * 60 * 1000;
    expect(isFirstDayBonusActive(launchAt, now)).toBe(false);
    expect(getEffectiveFreeEnergyCap(3, 3, launchAt, now)).toBe(3);
  });
});
