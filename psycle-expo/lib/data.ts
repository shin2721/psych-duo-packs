export const genres = [
  { id: "mental", label: "メンタル", icon: "brain" },
  { id: "money", label: "お金", icon: "cash" },
  { id: "work", label: "仕事術", icon: "briefcase" },
  { id: "health", label: "健康", icon: "fitness" },
  { id: "social", label: "人間関係", icon: "people" },
  { id: "study", label: "学習法", icon: "book" },
];

export const trailsByGenre: Record<string, any[]> = {
  mental: [
    { id: "m1", status: "done", icon: "leaf", type: "lesson", lessonId: "mental_lesson_1" },
    { id: "m2", status: "current", icon: "flower", type: "lesson", lessonId: "mental_lesson_2" },
    { id: "m3", status: "locked", icon: "sparkles", type: "lesson", lessonId: "mental_lesson_3" },
  ],
  money: [
    { id: "mo1", status: "done", icon: "cash", type: "lesson", lessonId: "money_lesson_1" },
    { id: "mo2", status: "current", icon: "card", type: "lesson", lessonId: "money_lesson_2" },
    { id: "mo3", status: "locked", icon: "trending-up", type: "lesson", lessonId: "money_lesson_3" },
  ],
  work: [
    { id: "w1", status: "done", icon: "briefcase", type: "lesson", lessonId: "work_lesson_1" },
    { id: "w2", status: "current", icon: "calendar", type: "lesson", lessonId: "work_lesson_2" },
    { id: "w3", status: "locked", icon: "clipboard", type: "lesson", lessonId: "work_lesson_3" },
  ],
  health: [
    { id: "h1", status: "done", icon: "fitness", type: "lesson", lessonId: "health_lesson_1" },
    { id: "h2", status: "current", icon: "heart", type: "lesson", lessonId: "health_lesson_2" },
    { id: "h3", status: "locked", icon: "nutrition", type: "lesson", lessonId: "health_lesson_3" },
  ],
  social: [
    { id: "s1", status: "done", icon: "people", type: "lesson", lessonId: "social_lesson_1" },
    { id: "s2", status: "current", icon: "chatbubbles", type: "lesson", lessonId: "social_lesson_2" },
    { id: "s3", status: "locked", icon: "happy", type: "lesson", lessonId: "social_lesson_3" },
  ],
  study: [
    { id: "st1", status: "done", icon: "book", type: "lesson", lessonId: "study_lesson_1" },
    { id: "st2", status: "current", icon: "school", type: "lesson", lessonId: "study_lesson_2" },
    { id: "st3", status: "locked", icon: "library", type: "lesson", lessonId: "study_lesson_3" },
  ],
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
