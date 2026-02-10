import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";
import { BADGES, Badge, BadgeStats } from "./badges";
import {
  getStreakData,
  addFreezes,
  useFreeze as useFreezeStreak
} from "../lib/streaks";
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

export interface MistakeItem {
  id: string; // Question ID
  lessonId: string;
  timestamp: number;
  questionType?: string;

  // Spaced Repetition System (SRS) fields
  box: number; // 1-5 (Current proficiency level, 6 = graduated/cleared)
  nextReviewDate: number; // Timestamp when this item becomes available for review
  interval: number; // Current interval in days
}

interface AppState {
  selectedGenre: string;
  setSelectedGenre: (id: string) => void;
  xp: number;
  addXp: (amount: number) => Promise<void>;
  skill: number; // Elo rating (default 1500)
  skillConfidence: number; // Confidence in skill rating (0-100)
  questionsAnswered: number; // Total questions answered
  updateSkill: (isCorrect: boolean, itemDifficulty?: number) => void;
  quests: Quest[];
  incrementQuest: (id: string, step?: number) => void;
  claimQuest: (id: string) => void;
  // Streak system
  streak: number;
  lastStudyDate: string | null;
  lastActivityDate: string | null; // ISO date string for streak calculation
  streakHistory: { date: string; xp: number; lessonsCompleted: number }[]; // Last 30 days
  updateStreakForToday: (currentXP?: number) => Promise<void>;
  freezeCount: number;
  useFreeze: () => boolean;
  // Currency system
  gems: number;
  addGems: (amount: number) => void;
  setGemsDirectly: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  buyFreeze: () => boolean;
  // Double XP Boost
  doubleXpEndTime: number | null;
  buyDoubleXP: () => boolean;
  isDoubleXpActive: boolean;
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
  activeUntil: string | null;
  setActiveUntil: (date: string | null) => void;
  isSubscriptionActive: boolean;
  // MistakesHub
  reviewEvents: ReviewEvent[];
  addReviewEvent: (event: Omit<ReviewEvent, "userId" | "ts">) => void;
  getMistakesHubItems: () => string[];
  canAccessMistakesHub: boolean;
  mistakesHubRemaining: number | null;
  startMistakesHubSession: () => void;
  // Lesson progress
  completedLessons: Set<string>;
  completeLesson: (lessonId: string) => void;
  // Adaptive difficulty tracking
  recentQuestionTypes: string[]; // Last 5 question types
  recentAccuracy: number; // Rolling accuracy (0-1) from last 10 questions
  currentStreak: number; // Current correct answer streak
  recordQuestionResult: (questionType: string, isCorrect: boolean) => void;
  // Mistakes Hub (SRS)
  mistakes: MistakeItem[];
  addMistake: (questionId: string, lessonId: string, questionType?: string) => void;
  processReviewResult: (questionId: string, isCorrect: boolean) => void; // Handle SRS transitions
  getDueMistakes: () => MistakeItem[]; // Get items due for review
  clearMistake: (questionId: string) => void; // Manually remove (for migration/cleanup)
  // Badges
  unlockedBadges: Set<string>; // Badge IDs
  checkAndUnlockBadges: () => Promise<string[]>; // Returns newly unlocked badge IDs
  mistakesCleared: number; // Track for badge unlock
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [selectedGenre, setSelectedGenre] = useState("mental");
  const [xp, setXP] = useState(0);
  const [skill, setSkill] = useState(1500); // Default Elo rating
  const [skillConfidence, setSkillConfidence] = useState(100); // Start with low confidence
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  // Plan & Entitlements
  const [planId, setPlanIdState] = useState<PlanId>("free");
  const [activeUntil, setActiveUntilState] = useState<string | null>(null);
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([]);

  const { user } = useAuth();
  const userId = user?.id || "user_local";



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
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [streakHistory, setStreakHistory] = useState<{ date: string; xp: number; lessonsCompleted: number }[]>([]);
  const [freezeCount, setFreezeCount] = useState(2); // Start with 2 free freezes

  // Currency system
  const [gems, setGems] = useState(50); // Start with 50 gems

  // Double XP Boost
  const [doubleXpEndTime, setDoubleXpEndTime] = useState<number | null>(null);

  // Social stats (fetched from Supabase)
  const [friendCount, setFriendCount] = useState(0);
  const [leaderboardRank, setLeaderboardRank] = useState(0);

  // Lesson progress
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  function completeLesson(lessonId: string) {
    setCompletedLessons(prev => new Set(prev).add(lessonId));
  }

  // Adaptive difficulty tracking
  const [recentQuestionTypes, setRecentQuestionTypes] = useState<string[]>([]);
  const [recentAccuracy, setRecentAccuracy] = useState(0.7); // Default 70%
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentResults, setRecentResults] = useState<boolean[]>([]); // Track last 10 results

  function recordQuestionResult(questionType: string, isCorrect: boolean) {
    // Update question type history (keep last 5)
    setRecentQuestionTypes(prev => {
      const updated = [...prev, questionType];
      return updated.slice(-5);
    });

    // Update recent results (keep last 10)
    setRecentResults(prev => {
      const updated = [...prev, isCorrect];
      const last10 = updated.slice(-10);

      // Calculate new accuracy
      const correctCount = last10.filter(r => r).length;
      const newAccuracy = correctCount / last10.length;
      setRecentAccuracy(newAccuracy);

      return last10;
    });

    // Update streak
    setCurrentStreak(prev => isCorrect ? prev + 1 : 0);
  }

  // Mistakes Hub Implementation (SRS)
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);

  // SRS Intervals (in days)
  const SRS_INTERVALS = [0, 1, 3, 7, 14]; // Box 1-5

  function addMistake(questionId: string, lessonId: string, questionType?: string) {
    setMistakes(prev => {
      // Check if already exists
      const existing = prev.find(m => m.id === questionId);
      if (existing) {
        // Reset to Box 1 if re-added
        return prev.map(m => m.id === questionId ? {
          ...m,
          box: 1,
          nextReviewDate: Date.now(),
          interval: 0
        } : m);
      }

      return [...prev, {
        id: questionId,
        lessonId,
        timestamp: Date.now(),
        questionType,
        box: 1,
        nextReviewDate: Date.now(), // Available immediately
        interval: 0
      }];
    });
  }

  function processReviewResult(questionId: string, isCorrect: boolean) {
    setMistakes(prev => {
      return prev.map(m => {
        if (m.id !== questionId) return m;

        if (isCorrect) {
          const newBox = m.box + 1;

          // Graduated (Box 6 = cleared)
          if (newBox > 5) {
            return null; // Will be filtered out
          }

          const newInterval = SRS_INTERVALS[newBox - 1];
          const nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

          return {
            ...m,
            box: newBox,
            interval: newInterval,
            nextReviewDate: nextReview
          };
        } else {
          // Incorrect: Reset to Box 1
          return {
            ...m,
            box: 1,
            interval: 0,
            nextReviewDate: Date.now()
          };
        }
      }).filter(Boolean) as MistakeItem[]; // Remove graduated items
    });
  }

  function getDueMistakes(): MistakeItem[] {
    const now = Date.now();
    return mistakes.filter(m => m.nextReviewDate <= now);
  }

  function clearMistake(questionId: string) {
    setMistakes(prev => prev.filter(m => m.id !== questionId));
  }

  // Badges Implementation
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());
  const [mistakesCleared, setMistakesCleared] = useState(0);

  async function checkAndUnlockBadges(): Promise<string[]> {
    if (!user) return [];

    const stats: BadgeStats = {
      completedLessons: completedLessons.size,
      streak,
      xp,
      mistakesCleared,
      friendCount,
      leaderboardRank,
    };

    const newlyUnlocked: string[] = [];

    for (const badge of BADGES) {
      if (!unlockedBadges.has(badge.id) && badge.unlockCondition(stats)) {
        // Unlock badge
        try {
          const { error } = await supabase
            .from("user_badges")
            .insert({ user_id: user.id, badge_id: badge.id });

          if (!error) {
            setUnlockedBadges(prev => new Set(prev).add(badge.id));
            newlyUnlocked.push(badge.id);
          }
        } catch (err) {
          console.error("Failed to unlock badge:", err);
        }
      }
    }

    return newlyUnlocked;
  }

  // Load user badges from Supabase
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setUnlockedBadges(new Set(data.map(b => b.badge_id)));
        }
      });
  }, [user]);

  // Load mistakes from AsyncStorage on mount
  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(`mistakes_${user.id}`).then((data) => {
      if (data) {
        const loadedMistakes = JSON.parse(data);

        // Migration: Convert old format to new SRS format
        const migratedMistakes = loadedMistakes.map((m: any) => {
          if (m.box === undefined) {
            // Old format detected, migrate to new format
            return {
              ...m,
              box: 1,
              nextReviewDate: Date.now(),
              interval: 0
            };
          }
          return m;
        });

        setMistakes(migratedMistakes);
      }
    });
  }, [user]);

  // Save mistakes to AsyncStorage whenever it changes
  useEffect(() => {
    if (!user) return;
    AsyncStorage.setItem(`mistakes_${user.id}`, JSON.stringify(mistakes));
  }, [mistakes, user]);


  // Daily goal system
  const [dailyGoal, setDailyGoalState] = useState(10); // Regular = 10 XP
  const [dailyXP, setDailyXP] = useState(0);
  const [dailyGoalLastReset, setDailyGoalLastReset] = useState(getTodayDate());

  // Life system
  const MAX_LIVES = 5;
  const [lives, setLives] = useState(MAX_LIVES);
  const [lastLifeLostTime, setLastLifeLostTime] = useState<number | null>(null);

  // Load persisted state on mount (LOCAL FIRST, then Supabase sync in background)
  useEffect(() => {
    if (!user) return;

    const loadState = async () => {
      // STEP 1: Load from local storage FIRST (instant)
      try {
        const [savedXp, savedGems, savedStreak] = await Promise.all([
          AsyncStorage.getItem(`xp_${user.id}`),
          AsyncStorage.getItem(`gems_${user.id}`),
          AsyncStorage.getItem(`streak_${user.id}`),
        ]);

        if (savedXp) setXP(parseInt(savedXp, 10));
        if (savedGems) setGems(parseInt(savedGems, 10));
        if (savedStreak) setStreak(parseInt(savedStreak, 10));

        // Freeze一本化: streaks.tsから読み込み
        const streakData = await getStreakData();
        setFreezeCount(streakData.freezesRemaining);

        if (__DEV__) console.log("Loaded from local storage (instant):", { savedXp, savedGems, savedStreak, freezes: streakData.freezesRemaining });
      } catch (e) {
        if (__DEV__) console.log("Local storage read failed:", e);
      }

      // STEP 2: Sync from Supabase in background (non-blocking)
      // This will update state if Supabase has newer data
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('xp, gems, streak, level, plan_id, active_until')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          if (__DEV__) console.log("Background Supabase sync:", data);
          // Only update if Supabase has different/newer values
          if (data.xp !== undefined) setXP(data.xp);
          if (data.gems !== undefined) setGems(data.gems);
          if (data.streak !== undefined) setStreak(data.streak);
          if (data.plan_id) setPlanIdState(data.plan_id as PlanId);
          if (data.active_until) setActiveUntilState(data.active_until);

          // Fetch social stats (non-blocking)
          supabase
            .from("friendships")
            .select("*", { count: "exact", head: true })
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .then(({ count }) => { if (count !== null) setFriendCount(count); });

          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gt("xp", data.xp ?? 0)
            .then(({ count }) => { if (count !== null) setLeaderboardRank(count + 1); });
        }
      } catch (e) {
        // Supabase failed - that's okay, we already have local data
        if (__DEV__) console.log("Supabase sync failed (using local data):", e);
      }
    };
    loadState();
  }, [user]);

  // Persist state changes
  // Persist state changes to Supabase (and Local Storage as backup)
  useEffect(() => {
    if (!user) return;
    AsyncStorage.setItem(`xp_${user.id}`, xp.toString());

    // Debounced update to Supabase to avoid too many requests
    const timer = setTimeout(() => {
      supabase.from('profiles').update({ xp }).eq('id', user.id).then(({ error }) => {
        if (error) console.error("Failed to sync XP to Supabase", error);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [xp, user]);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.setItem(`gems_${user.id}`, gems.toString());

    const timer = setTimeout(() => {
      supabase.from('profiles').update({ gems }).eq('id', user.id).then(({ error }) => {
        if (error) console.error("Failed to sync Gems to Supabase", error);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [gems, user]);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.setItem(`streak_${user.id}`, streak.toString());

    supabase.from('profiles').update({ streak }).eq('id', user.id).then(({ error }) => {
      if (error) console.error("Failed to sync Streak to Supabase", error);
    });
  }, [streak, user]);

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
      }
    }
  };

  // Update streak for today with Supabase integration
  const updateStreakForToday = async (currentXP?: number) => {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    if (lastActivityDate === today) {
      // Already updated today
      return;
    }

    let newStreak = streak;
    if (lastActivityDate === yesterday) {
      // Continue streak
      newStreak = streak + 1;
    } else if (lastActivityDate === null) {
      // First time
      newStreak = 1;
    } else if (freezeCount > 0) {
      // Use freeze item
      setFreezeCount(freezeCount - 1);
      newStreak = streak + 1;
    } else {
      // Break streak
      newStreak = 1;
    }

    setStreak(newStreak);
    setLastActivityDate(today);

    // Update streak history in Supabase
    if (user) {
      try {
        // Insert or update today's streak history
        await supabase
          .from('streak_history')
          .upsert({
            user_id: user.id,
            date: today,
            lessons_completed: 1,
            xp_earned: 0, // Will be updated when XP is added
          });

        // Update leaderboard
        await supabase
          .from('leaderboard')
          .upsert({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'User',
            total_xp: currentXP ?? xp,
            current_streak: newStreak,
          });
      } catch (error) {
        console.error('Error updating streak in Supabase:', error);
      }
    }
  };

  // Check if Double XP is active
  const isDoubleXpActive = doubleXpEndTime !== null && Date.now() < doubleXpEndTime;

  // Add XP and update daily progress + streak
  const addXp = async (amount: number) => {
    // Apply Double XP boost if active
    const effectiveAmount = isDoubleXpActive ? amount * 2 : amount;
    const newXP = xp + effectiveAmount;
    setXP(newXP);
    setDailyXP((prev) => {
      const newDailyXP = prev + effectiveAmount;
      // Award gems when daily goal is reached
      if (prev < dailyGoal && newDailyXP >= dailyGoal) {
        addGems(5); // 5 gems for completing daily goal
      }
      return newDailyXP;
    });
    updateStreak(); // Keep old streak logic for backward compatibility
    updateStreakForToday(newXP); // Update Supabase streak with latest XP

    // 週次リーグXP加算
    if (user) {
      try {
        const { addWeeklyXp } = await import('./league');
        await addWeeklyXp(user.id, effectiveAmount);
        if (__DEV__) console.log('[League] Weekly XP added:', effectiveAmount);
      } catch (e) {
        console.warn('[League] Failed to add weekly XP:', e);
      }
    }
  };

  // Adaptive Difficulty (Enhanced Elo with IRT principles)
  const updateSkill = (isCorrect: boolean, itemDifficulty = 1500) => {
    // Dynamic K-factor: decreases as user gains experience
    // New users: K = 40 (fast adaptation)
    // Experienced users: K = 24 (stable ratings)
    const baseK = 40;
    const minK = 24;
    const K = Math.max(minK, baseK - (questionsAnswered / 100) * (baseK - minK));

    // Calculate expected score (probability of correct answer)
    const expectedScore = 1 / (1 + Math.pow(10, (itemDifficulty - skill) / 400));
    const actualScore = isCorrect ? 1 : 0;

    // Update skill rating
    const newSkill = skill + K * (actualScore - expectedScore);
    setSkill(Math.round(newSkill));

    // Update confidence: decreases when performance matches expectations
    // Increases when performance surprises (very easy or very hard questions)
    const surprise = Math.abs(actualScore - expectedScore);
    const confidenceChange = surprise > 0.3 ? -5 : 2;
    setSkillConfidence((prev) => Math.max(0, Math.min(100, prev + confidenceChange)));

    // Increment questions answered counter
    setQuestionsAnswered((prev) => prev + 1);
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

  const setGemsDirectly = (amount: number) => {
    setGems(amount);
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
      // Action Streak側のFreezeも増やす（一本化）
      addFreezes(1).catch(e => console.error("Failed to add freeze to streak data", e));
      return true;
    }
    return false;
  };

  const buyDoubleXP = (): boolean => {
    const cost = 20; // 20 gems for 15 minutes of double XP
    if (spendGems(cost)) {
      const DURATION_MS = 15 * 60 * 1000; // 15 minutes
      setDoubleXpEndTime(Date.now() + DURATION_MS);
      return true;
    }
    return false;
  };

  const useFreeze = (): boolean => {
    if (freezeCount > 0) {
      setFreezeCount((prev) => prev - 1);
      // Action Streak側のFreezeも減らす（一本化）
      useFreezeStreak().catch(e => console.error("Failed to use freeze from streak data", e));
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

  const setActiveUntil = (date: string | null) => {
    setActiveUntilState(date);
  };

  // Check if subscription is currently active
  const isSubscriptionActive = (() => {
    if (!activeUntil || planId === "free") return false;
    const expirationDate = new Date(activeUntil);
    const now = new Date();
    return now < expirationDate;
  })();

  const hasProAccess = hasProItemAccess(planId);
  const canAccessMistakesHub = canUseMistakesHub(userId, planId);
  const mistakesHubRemaining = getMistakesHubRemaining(userId, planId);

  // MistakesHub methods
  const addReviewEventFunc = (event: Omit<ReviewEvent, "userId" | "ts">) => {
    const fullEvent: ReviewEvent = {
      ...event,
      userId: userId,
      ts: Date.now(),
    };
    setReviewEvents((prev) => [...prev, fullEvent]);
  };

  const getMistakesHubItemsFunc = (): string[] => {
    return selectMistakesHubItems(reviewEvents);
  };

  const startMistakesHubSessionFunc = () => {
    if (canAccessMistakesHub) {
      consumeMistakesHub(userId);
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
    }, 60000); // Check every minute (restoring the interval behavior correctly)

    return () => clearInterval(interval);
  }, [lives, lastLifeLostTime, MAX_LIVES]);

  // Computed state
  // hasProAccess is already calculated at the top level
  // const hasProAccess = planId === "pro" || planId === "max"; 

  // Value object to provide
  const value: AppState = {
    selectedGenre,
    setSelectedGenre,
    xp,
    addXp,
    skill,
    skillConfidence,
    questionsAnswered,
    updateSkill,
    quests,
    incrementQuest,
    claimQuest,
    streak,
    lastStudyDate,
    lastActivityDate,
    streakHistory,
    updateStreakForToday,
    freezeCount,
    useFreeze,
    gems,
    addGems,
    setGemsDirectly,
    spendGems,
    buyFreeze,
    buyDoubleXP,
    isDoubleXpActive,
    doubleXpEndTime,
    dailyGoal,
    dailyXP,
    setDailyGoal,
    lives,
    maxLives: hasProAccess ? 999 : MAX_LIVES, // Unlimited lives for Pro
    loseLife,
    refillLives,
    lastLifeLostTime,
    planId,
    setPlanId,
    hasProAccess,
    activeUntil,
    setActiveUntil,
    isSubscriptionActive: !!(planId !== "free" && activeUntil && new Date(activeUntil) > new Date()),
    reviewEvents,
    addReviewEvent: addReviewEventFunc,
    getMistakesHubItems: getMistakesHubItemsFunc,
    canAccessMistakesHub,
    mistakesHubRemaining,
    startMistakesHubSession: startMistakesHubSessionFunc,
    // Mistakes Hub (SRS)
    mistakes,
    addMistake,
    processReviewResult,
    getDueMistakes,
    clearMistake,
    // Badges
    unlockedBadges,
    checkAndUnlockBadges,
    mistakesCleared,
    // Lesson progress
    completedLessons,
    completeLesson,
    // Adaptive difficulty tracking
    recentQuestionTypes,
    recentAccuracy,
    currentStreak,
    recordQuestionResult,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
