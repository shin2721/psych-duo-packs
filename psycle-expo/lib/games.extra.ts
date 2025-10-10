export interface GameResult {
  xp: number;
  mistakes: number;
  timeMs: number;
  meta?: Record<string, any>;
}

export interface GameConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetTime: number;
  questKey?: string;
}

export const breathTempo: GameConfig = {
  id: "breathTempo",
  title: "呼吸のテンポ",
  description: "リズムに合わせてタップしてください",
  icon: "fitness",
  targetTime: 60000,
  questKey: "breathTempoSeconds",
};

export const echoSteps: GameConfig = {
  id: "echoSteps",
  title: "エコーステップ",
  description: "順序を覚えてタップ",
  icon: "flashlight",
  targetTime: 45000,
  questKey: "echoStepsClears",
};

export const evidenceBalance: GameConfig = {
  id: "evidenceBalance",
  title: "証拠のバランス",
  description: "賛否の重さを調整",
  icon: "scale",
  targetTime: 90000,
  questKey: "balanceClears",
};

export const budgetBonds: GameConfig = {
  id: "budgetBonds",
  title: "予算の絆",
  description: "目標金額を作る",
  icon: "card",
  targetTime: 60000,
  questKey: "budgetBondsClears",
};

export const allGames = [breathTempo, echoSteps, evidenceBalance, budgetBonds];
