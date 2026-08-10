export function getLessonTitle(unit: string, level: number): string {
  const titles: Record<string, string[]> = {
    mental: [
      "あなたの直感 vs 心理学",
      "寝る前のスマホ、何分の損？",
      "心臓が速い。もう失敗？",
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
