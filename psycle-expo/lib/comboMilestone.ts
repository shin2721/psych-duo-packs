export type ComboMilestone = 3 | 5 | 10;

export function getNextCombo(currentCombo: number, isCorrect: boolean): number {
  const safeCurrentCombo = Number.isFinite(currentCombo) ? Math.max(0, Math.floor(currentCombo)) : 0;
  return isCorrect ? safeCurrentCombo + 1 : 0;
}

export function getComboMilestone(combo: number): ComboMilestone | null {
  const safeCombo = Number.isFinite(combo) ? Math.max(0, Math.floor(combo)) : 0;
  if (safeCombo === 3 || safeCombo === 5 || safeCombo === 10) {
    return safeCombo;
  }
  return null;
}
