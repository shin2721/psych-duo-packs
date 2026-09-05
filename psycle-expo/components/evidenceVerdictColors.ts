import type { VerdictWeight } from "../types/question";

// 判定チップの色。シートで色相を持つのはこの1系統だけで、上端の帯と説の引用線にも同じ色を通す。
export const VERDICT_COLORS: Record<VerdictWeight, string> = {
  green: "#22C55E",
  amber: "#E5A93C",
  grey: "#94A3B8",
  // 「調べて、差が出なかった」の確定色。grey（まだ調べられていない）と明度を離す
  // （#5B9CF6 は grey と輝度がほぼ同じで、グレースケールで見分けがつかなかった）。
  blue: "#3B82F6",
};
