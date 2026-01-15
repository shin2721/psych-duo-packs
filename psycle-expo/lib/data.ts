export const genres = [
  { id: "mental", label: "メンタル", icon: "brain", emoji: "🧠" },
  { id: "money", label: "お金", icon: "cash", emoji: "💰" },
  { id: "work", label: "仕事術", icon: "briefcase", emoji: "💼" },
  { id: "health", label: "健康", icon: "fitness", emoji: "❤️" },
  { id: "social", label: "人間関係", icon: "people", emoji: "🤝" },
  { id: "study", label: "学習法", icon: "book", emoji: "📚" },
];

// Helper to generate trail nodes
const generateTrail = (genreId: string, count: number) => {
  const icons = ["leaf", "flower", "sparkles", "star", "heart-circle", "pulse", "school", "flask", "shield-checkmark", "trophy"];
  const nodes = [];

  for (let i = 1; i <= count; i++) {
    // Inject Black Hole Node after lesson 5 (before lesson 6)
    if (i === 6) {
      nodes.push({
        id: `${genreId}_bh1`,
        status: "locked",
        icon: "planet",
        type: "review_blackhole",
        lessonFile: `${genreId}_review_bh1`,
        lessonId: `${genreId}_review_bh1`
      });
    }

    nodes.push({
      id: `${genreId.charAt(0)}${i}`,
      status: i === 1 ? "current" : "locked",
      icon: icons[(i - 1) % icons.length],
      type: "lesson",
      lessonFile: `${genreId}_l${String(i).padStart(2, '0')}`, // For mental (legacy format support)
      lessonId: `${genreId}_lesson_${i}` // Standard format
    });
  }
  return nodes;
};

export const trailsByGenre: Record<string, any[]> = {
  mental: generateTrail("mental", 100),
  money: generateTrail("money", 100),
  work: generateTrail("work", 100),
  health: generateTrail("health", 100),
  search: generateTrail("search", 100), // kept for reference
  social: generateTrail("social", 100),
  study: generateTrail("study", 100),
};

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
