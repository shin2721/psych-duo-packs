import React, { createContext, useContext, useState, ReactNode } from "react";

interface Quest {
  id: string;
  type: "daily" | "weekly" | "monthly";
  title: string;
  need: number;
  progress: number;
  rewardXp: number;
  claimed: boolean;
  chestState: "closed" | "opening" | "opened";
}

interface AppState {
  selectedGenre: string;
  setSelectedGenre: (id: string) => void;
  xp: number;
  addXp: (amount: number) => void;
  quests: Quest[];
  incrementQuest: (id: string, step?: number) => void;
  claimQuest: (id: string) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [selectedGenre, setSelectedGenre] = useState("mental");
  const [xp, setXP] = useState(0);
  const [quests, setQuests] = useState<Quest[]>([
    { id: "q_monthly_50pts", type: "monthly", title: "50クエストポイントを獲得する", need: 50, progress: 12, rewardXp: 150, claimed: false, chestState: "closed" },
    { id: "q_monthly_breathTempo", type: "monthly", title: "呼吸ゲームで60秒達成", need: 60, progress: 0, rewardXp: 120, claimed: false, chestState: "closed" },
    { id: "q_monthly_echoSteps", type: "monthly", title: "エコーステップ3回クリア", need: 3, progress: 0, rewardXp: 100, claimed: false, chestState: "closed" },
    { id: "q_monthly_balance", type: "monthly", title: "バランスゲーム5回クリア", need: 5, progress: 0, rewardXp: 110, claimed: false, chestState: "closed" },
    { id: "q_monthly_budget", type: "monthly", title: "予算ゲームでパーフェクト達成", need: 3, progress: 0, rewardXp: 150, claimed: false, chestState: "closed" },
    { id: "q_daily_3lessons", type: "daily", title: "レッスンを3回完了", need: 3, progress: 0, rewardXp: 30, claimed: false, chestState: "closed" },
    { id: "q_daily_5streak", type: "daily", title: "2回のレッスンで5問連続正解", need: 2, progress: 0, rewardXp: 40, claimed: false, chestState: "closed" },
    { id: "q_weekly_10lessons", type: "weekly", title: "週に10レッスン完了", need: 10, progress: 2, rewardXp: 100, claimed: false, chestState: "closed" },
  ]);

  const addXp = (amount: number) => setXP((prev) => prev + amount);

  const incrementQuest = (id: string, step = 1) => {
    setQuests((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, progress: Math.min(q.progress + step, q.need) }
          : q
      )
    );
  };

  const claimQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id && q.progress >= q.need && !q.claimed) {
          addXp(q.rewardXp);
          return { ...q, claimed: true, chestState: "opening" as const };
        }
        return q;
      })
    );

    setTimeout(() => {
      setQuests((prev) =>
        prev.map((q) => (q.id === id ? { ...q, chestState: "opened" as const } : q))
      );
    }, 1200);
  };

  return (
    <AppStateContext.Provider
      value={{
        selectedGenre,
        setSelectedGenre,
        xp,
        addXp,
        quests,
        incrementQuest,
        claimQuest,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
