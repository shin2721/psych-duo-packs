export function getLessonTitle(unit: string, level: number): string {
  const titles: Record<string, string[]> = {
    mental: [
      "焦りの3タイプ",
      "不安と事実を分ける",
      "焦りに10秒を挟む",
      "自責から次の一手へ",
      "反芻を見分ける",
      "戻るルートを作る",
    ],
    money: [
      "自己回復プレミアム",
    ],
    work: [
      "最初の5分版を作る",
      "完璧主義を10秒でほどく",
    ],
    health: [
      "眠ろうとする焦り",
    ],
    social: [
      "断る前に保留する",
      "即答から10秒離れる",
    ],
    study: [
      "夜の情報と契約を分ける",
    ],
  };

  return titles[unit]?.[level - 1] || `レッスン${level}`;
}
