import type { IoniconName } from "./ioniconName";

export interface GenreOption {
  id: string;
  label: string;
  icon: IoniconName;
  emoji: string;
}

export const genres: GenreOption[] = [
  { id: "mental", label: "メンタル", icon: "sparkles", emoji: "🧠" },
  { id: "money", label: "お金", icon: "cash", emoji: "💰" },
  { id: "work", label: "仕事術", icon: "briefcase", emoji: "💼" },
  { id: "health", label: "健康", icon: "fitness", emoji: "❤️" },
  { id: "social", label: "人間関係", icon: "people", emoji: "🤝" },
  { id: "study", label: "学習法", icon: "book", emoji: "📚" },
];

export const league = [
  { id: "p1", name: "Miyu", xp: 1008 },
  { id: "p2", name: "Aleena", xp: 956 },
  { id: "p3", name: "Takeya", xp: 944 },
  { id: "p4", name: "Amanda", xp: 855 },
  { id: "p5", name: "Ms", xp: 738 },
  { id: "p6", name: "bobshih", xp: 735 },
  { id: "p7", name: "Chi", xp: 640 },
  { id: "p8", name: "Kai", xp: 520 },
  { id: "p9", name: "Rin", xp: 340 },
  { id: "p10", name: "Jun", xp: 180 },
  { id: "p11", name: "Sora", xp: 150 },
  { id: "p12", name: "Hana", xp: 120 },
  { id: "p13", name: "Yuki", xp: 100 },
  { id: "p14", name: "Kana", xp: 80 },
  { id: "p15", name: "Ryo", xp: 60 },
  { id: "p16", name: "Aoi", xp: 40 },
  { id: "p17", name: "Mei", xp: 20 },
];

export const promotionCut = 3;
export const relegationCut = 17;
