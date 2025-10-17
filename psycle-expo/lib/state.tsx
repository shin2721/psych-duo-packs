import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import {
  canUseMistakesHub,
  consumeMistakesHub,
  getMistakesHubRemaining,
  hasProItemAccess,
} from "../src/featureGate";
import { selectMistakesHubItems } from "../src/features/mistakesHub";

type PlanId = "free" | "pro" | "max";

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

interface ReviewEvent {
  userId: string;
  itemId: string;
  ts: number;
  result: "correct" | "incorrect";
  latencyMs?: number;
  dueAt?: number;
  tags?: string[];
  beta?: number;
  p?: number;
}

interface AppState {
  selectedGenre: string;
  setSelectedGenre: (id: string) => void;
  xp: number;
  addXp: (amount: number) => void;
  quests: Quest[];
  incrementQuest: (id: string, step?: number) => void;
  claimQuest: (id: string) => void;
  // Streak system
  streak: number;
  lastStudyDate: string | null;
  freezeCount: number;
  useFreeze: () => boolean;
  // Currency system
  gems: number;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  buyFreeze: () => boolean;
  // Daily goal system
  dailyGoal: number;
  dailyXP: number;
  setDailyGoal: (xp: number) => void;
  // Life system
  lives: number;
  maxLives: number;
  loseLife: () => boolean;
  refillLives: () => boolean;
  lastLifeLostTime: number | null;
  // Plan & Entitlements
  planId: PlanId;
  setPlanId: (plan: PlanId) => void;
  hasProAccess: boolean;
  // MistakesHub
  reviewEvents: ReviewEvent[];
  addReviewEvent: (event: Omit<ReviewEvent, "userId" | "ts">) => void;
  getMistakesHubItems: () => string[];
  canAccessMistakesHub: boolean;
  mistakesHubRemaining: number | null;
  startMistakesHubSession: () => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [selectedGenre, setSelectedGenre] = useState("mental");
  const [xp, setXP] = useState(0);

  // Plan & Entitlements
  const [planId, setPlanIdState] = useState<PlanId>("free");
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([]);
  const DUMMY_USER_ID = "user_local"; // In production, use actual user ID

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

  // Streak system
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [freezeCount, setFreezeCount] = useState(2); // Start with 2 free freezes

  // Currency system
  const [gems, setGems] = useState(50); // Start with 50 gems

  // Daily goal system
  const [dailyGoal, setDailyGoalState] = useState(10); // Regular = 10 XP
  const [dailyXP, setDailyXP] = useState(0);
  const [dailyGoalLastReset, setDailyGoalLastReset] = useState(getTodayDate());

  // Life system
  const MAX_LIVES = 5;
  const [lives, setLives] = useState(MAX_LIVES);
  const [lastLifeLostTime, setLastLifeLostTime] = useState<number | null>(null);

  // Helper: Get today's date in YYYY-MM-DD format
  function getTodayDate(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Helper: Get yesterday's date
  function getYesterdayDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Check and reset daily progress
  useEffect(() => {
    const today = getTodayDate();
    if (dailyGoalLastReset !== today) {
      setDailyXP(0);
      setDailyGoalLastReset(today);
    }
  }, [dailyGoalLastReset]);

  // Update streak when studying
  const updateStreak = () => {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    if (lastStudyDate === today) {
      // Already studied today, no change
      return;
    } else if (lastStudyDate === yesterday) {
      // Studied yesterday, increment streak
      setStreak((prev) => prev + 1);
      setLastStudyDate(today);
    } else if (lastStudyDate === null) {
      // First time studying
      setStreak(1);
      setLastStudyDate(today);
    } else {
      // Streak broken, check if freeze available
      if (freezeCount > 0) {
        // Auto-use freeze to save streak
        setFreezeCount((prev) => prev - 1);
        setStreak((prev) => prev + 1);
        setLastStudyDate(today);
      } else {
        // Streak lost, reset to 1
        setStreak(1);
        setLastStudyDate(today);
      }
    }
  };

  // Add XP and update daily progress + streak
  const addXp = (amount: number) => {
    setXP((prev) => prev + amount);
    setDailyXP((prev) => {
      const newDailyXP = prev + amount;
      // Award gems when daily goal is reached
      if (prev < dailyGoal && newDailyXP >= dailyGoal) {
        addGems(5); // 5 gems for completing daily goal
      }
      return newDailyXP;
    });
    updateStreak();
  };

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
          addGems(10); // Also award 10 gems for quest completion
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

  // Currency methods
  const addGems = (amount: number) => {
    setGems((prev) => prev + amount);
  };

  const spendGems = (amount: number): boolean => {
    if (gems >= amount) {
      setGems((prev) => prev - amount);
      return true;
    }
    return false;
  };

  const buyFreeze = (): boolean => {
    const cost = 10; // 10 gems per freeze
    if (spendGems(cost)) {
      setFreezeCount((prev) => prev + 1);
      return true;
    }
    return false;
  };

  const useFreeze = (): boolean => {
    if (freezeCount > 0) {
      setFreezeCount((prev) => prev - 1);
      return true;
    }
    return false;
  };

  const setDailyGoal = (xp: number) => {
    setDailyGoalState(xp);
  };

  // Life system methods
  const loseLife = (): boolean => {
    if (lives > 0) {
      setLives((prev) => prev - 1);
      setLastLifeLostTime(Date.now());
      return true;
    }
    return false;
  };

  const refillLives = (): boolean => {
    const cost = 10; // 10 gems for full refill
    if (spendGems(cost)) {
      setLives(MAX_LIVES);
      setLastLifeLostTime(null);
      return true;
    }
    return false;
  };

  // Plan & Entitlements methods
  const setPlanId = (plan: PlanId) => {
    setPlanIdState(plan);
  };

  const hasProAccess = hasProItemAccess(planId);
  const canAccessMistakesHub = canUseMistakesHub(DUMMY_USER_ID, planId);
  const mistakesHubRemaining = getMistakesHubRemaining(DUMMY_USER_ID, planId);

  // MistakesHub methods
  const addReviewEventFunc = (event: Omit<ReviewEvent, "userId" | "ts">) => {
    const fullEvent: ReviewEvent = {
      ...event,
      userId: DUMMY_USER_ID,
      ts: Date.now(),
    };
    setReviewEvents((prev) => [...prev, fullEvent]);
  };

  const getMistakesHubItemsFunc = (): string[] => {
    return selectMistakesHubItems(reviewEvents);
  };

  const startMistakesHubSessionFunc = () => {
    if (canAccessMistakesHub) {
      consumeMistakesHub(DUMMY_USER_ID);
      // TODO: Navigate to MistakesHub session screen
    }
  };

  // Auto-recover lives over time (30 minutes per life)
  useEffect(() => {
    if (lives >= MAX_LIVES || lastLifeLostTime === null) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastLoss = now - lastLifeLostTime;
      const LIFE_RECOVERY_TIME = 30 * 60 * 1000; // 30 minutes

      if (timeSinceLastLoss >= LIFE_RECOVERY_TIME) {
        setLives((prev) => {
          const newLives = Math.min(prev + 1, MAX_LIVES);
          if (newLives >= MAX_LIVES) {
            setLastLifeLostTime(null);
          } else {
            setLastLifeLostTime(now);
          }
          return newLives;
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lives, lastLifeLostTime, MAX_LIVES]);

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
        // Streak system
        streak,
        lastStudyDate,
        freezeCount,
        useFreeze,
        // Currency system
        gems,
        addGems,
        spendGems,
        buyFreeze,
        // Daily goal system
        dailyGoal,
        dailyXP,
        setDailyGoal,
        // Life system
        lives,
        maxLives: MAX_LIVES,
        loseLife,
        refillLives,
        lastLifeLostTime,
        // Plan & Entitlements
        planId,
        setPlanId,
        hasProAccess,
        // MistakesHub
        reviewEvents,
        addReviewEvent: addReviewEventFunc,
        getMistakesHubItems: getMistakesHubItemsFunc,
        canAccessMistakesHub,
        mistakesHubRemaining,
        startMistakesHubSession: startMistakesHubSessionFunc,
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
