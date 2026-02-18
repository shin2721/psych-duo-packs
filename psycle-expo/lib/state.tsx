import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";
import { BADGES, BadgeStats } from "./badges";
import entitlements from "../config/entitlements.json";
import {
  getStreakData,
  addFreezes,
  useFreeze as useFreezeStreak
} from "../lib/streaks";
import { applyXpBoost } from "./questsV2";
import {
  canUseMistakesHub,
  consumeMistakesHub,
  getMistakesHubRemaining,
  hasProItemAccess,
} from "../src/featureGate";
import { selectMistakesHubItems } from "../src/features/mistakesHub";
import { Analytics } from "./analytics";

type PlanId = "free" | "pro" | "max";
type XpSource = "lesson" | "question" | "journal" | "quest" | "system";

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
  addXp: (amount: number, source?: XpSource) => Promise<void>;
  skill: number; // Elo rating (default 1500)
  skillConfidence: number; // Confidence in skill rating (0-100)
  questionsAnswered: number; // Total questions answered
  updateSkill: (isCorrect: boolean, itemDifficulty?: number) => void;
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
  grantFreezes: (amount: number) => Promise<void>;
  awardBadgeById: (badgeId: string) => Promise<boolean>;
  // Daily goal system
  dailyGoal: number;
  dailyXP: number;
  setDailyGoal: (xp: number) => void;
  // Energy system
  energy: number;
  maxEnergy: number;
  consumeEnergy: (amount?: number) => boolean;
  addEnergy: (amount: number) => void;
  tryTriggerStreakEnergyBonus: (correctStreak: number) => boolean;
  energyRefillMinutes: number;
  dailyEnergyBonusRemaining: number;
  lastEnergyUpdateTime: number | null;
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

interface PersistedAppSnapshot {
  version: 1;
  selectedGenre: string;
  skill: number;
  skillConfidence: number;
  questionsAnswered: number;
  completedLessons: string[];
  dailyGoal: number;
  dailyXP: number;
  dailyGoalLastReset: string;
  lastStudyDate: string | null;
  lastActivityDate: string | null;
  streakHistory: { date: string; xp: number; lessonsCompleted: number }[];
  reviewEvents: ReviewEvent[];
  recentQuestionTypes: string[];
  recentAccuracy: number;
  currentStreak: number;
  recentResults: boolean[];
  mistakesCleared: number;
  planId: PlanId;
  activeUntil: string | null;
}

function getAppSnapshotKey(userId: string): string {
  return `app_state_snapshot_v1_${userId}`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const LESSON_BADGE_THRESHOLDS = [1, 5, 10, 50, 100];
  const STREAK_BADGE_THRESHOLDS = [3, 7, 30];
  const XP_BADGE_THRESHOLDS = [1000, 5000];
  const MISTAKE_CLEARED_BADGE_THRESHOLD = 10;

  const crossedThreshold = (prev: number, next: number, thresholds: number[]): boolean =>
    thresholds.some((threshold) => prev < threshold && next >= threshold);

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
  const [isStateHydrated, setIsStateHydrated] = useState(false);
  // Streak system
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [streakHistory, setStreakHistory] = useState<{ date: string; xp: number; lessonsCompleted: number }[]>([]);
  const [freezeCount, setFreezeCount] = useState(2); // Start with 2 free freezes

  // Currency system
  const [gems, setGems] = useState(50); // Start with 50 gems

  // Social stats (fetched from Supabase)
  const [friendCount, setFriendCount] = useState(0);
  const [leaderboardRank, setLeaderboardRank] = useState(0);

  // Lesson progress
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  function completeLesson(lessonId: string) {
    if (completedLessons.has(lessonId)) return;

    const previousCompletedCount = completedLessons.size;
    const nextCompletedCount = previousCompletedCount + 1;

    setCompletedLessons((prev) => {
      const next = new Set(prev);
      next.add(lessonId);
      return next;
    });

    if (crossedThreshold(previousCompletedCount, nextCompletedCount, LESSON_BADGE_THRESHOLDS)) {
      triggerBadgeCheck();
    }
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
    const targetMistake = mistakes.find((m) => m.id === questionId);
    const willGraduate = Boolean(targetMistake && isCorrect && targetMistake.box >= 5);
    const previousCleared = mistakesCleared;

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

    if (willGraduate) {
      const nextCleared = previousCleared + 1;
      setMistakesCleared(nextCleared);
      if (previousCleared < MISTAKE_CLEARED_BADGE_THRESHOLD && nextCleared >= MISTAKE_CLEARED_BADGE_THRESHOLD) {
        triggerBadgeCheck();
      }
    }
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
  const badgeCheckInFlightRef = useRef(false);

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

    const eligibleBadges = BADGES.filter(
      (badge) => !unlockedBadges.has(badge.id) && badge.unlockCondition(stats)
    );
    if (eligibleBadges.length === 0) return [];

    const newlyUnlocked: string[] = [];

    for (const badge of eligibleBadges) {
      try {
        const { error } = await supabase
          .from("user_badges")
          .upsert(
            { user_id: user.id, badge_id: badge.id, unlocked_at: new Date().toISOString() },
            { onConflict: "user_id,badge_id", ignoreDuplicates: true }
          );

        if (!error) {
          setUnlockedBadges((prev) => new Set(prev).add(badge.id));
          newlyUnlocked.push(badge.id);
        }
      } catch (err) {
        console.error("Failed to unlock badge:", err);
      }
    }

    return newlyUnlocked;
  }

  function triggerBadgeCheck() {
    if (!user) return;
    if (badgeCheckInFlightRef.current) return;

    badgeCheckInFlightRef.current = true;
    void checkAndUnlockBadges()
      .catch((error) => {
        console.error("Badge check failed:", error);
      })
      .finally(() => {
        badgeCheckInFlightRef.current = false;
      });
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

  useEffect(() => {
    if (!user) return;
    if (friendCount < 1 && !(leaderboardRank > 0 && leaderboardRank <= 10)) return;

    const timer = setTimeout(() => {
      triggerBadgeCheck();
    }, 300);

    return () => clearTimeout(timer);
  }, [user, friendCount, leaderboardRank]);

  // Save mistakes to AsyncStorage whenever it changes
  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`mistakes_${user.id}`, JSON.stringify(mistakes));
  }, [mistakes, user, isStateHydrated]);


  // Daily goal system
  const [dailyGoal, setDailyGoalState] = useState(10); // Regular = 10 XP
  const [dailyXP, setDailyXP] = useState(0);
  const [dailyGoalLastReset, setDailyGoalLastReset] = useState(getTodayDate());

  // Energy system
  const FREE_MAX_ENERGY = Math.max(1, Number(entitlements.plans.free.energy.daily_cap ?? 3));
  // paid plans are currently uncapped (`daily_cap: null`) in entitlements, so keep a large sentinel.
  const SUBSCRIBER_MAX_ENERGY = 999;
  const ENERGY_REFILL_MS = Math.max(1, Number(entitlements.defaults.energy_refill_minutes ?? 60)) * 60 * 1000;
  const ENERGY_STREAK_BONUS_EVERY = Math.max(1, Number(entitlements.defaults.energy_streak_bonus_every ?? 5));
  const ENERGY_STREAK_BONUS_CHANCE = Number(entitlements.defaults.energy_streak_bonus_chance ?? 0.1);
  const ENERGY_STREAK_BONUS_DAILY_CAP = Math.max(0, Number(entitlements.defaults.energy_streak_bonus_daily_cap ?? 1));
  const [energy, setEnergy] = useState(FREE_MAX_ENERGY);
  const [lastEnergyUpdateTime, setLastEnergyUpdateTime] = useState<number | null>(null);
  const [dailyEnergyBonusDate, setDailyEnergyBonusDate] = useState(getTodayDate());
  const [dailyEnergyBonusCount, setDailyEnergyBonusCount] = useState(0);

  // Load persisted state on mount (LOCAL FIRST, then Supabase sync in background)
  useEffect(() => {
    if (!user) {
      setIsStateHydrated(false);
      return;
    }
    let cancelled = false;
    let badgeCheckTimer: ReturnType<typeof setTimeout> | null = null;
    setIsStateHydrated(false);

    const loadState = async () => {
      // STEP 1: Load from local storage FIRST (instant)
      try {
        const [
          savedXp,
          savedGems,
          savedStreak,
          savedEnergy,
          savedEnergyUpdateTime,
          savedEnergyBonusDate,
          savedEnergyBonusCount,
          savedSnapshot,
          savedMistakes,
        ] = await Promise.all([
          AsyncStorage.getItem(`xp_${user.id}`),
          AsyncStorage.getItem(`gems_${user.id}`),
          AsyncStorage.getItem(`streak_${user.id}`),
          AsyncStorage.getItem(`energy_${user.id}`),
          AsyncStorage.getItem(`energy_update_time_${user.id}`),
          AsyncStorage.getItem(`energy_bonus_date_${user.id}`),
          AsyncStorage.getItem(`energy_bonus_count_${user.id}`),
          AsyncStorage.getItem(getAppSnapshotKey(user.id)),
          AsyncStorage.getItem(`mistakes_${user.id}`),
        ]);
        if (cancelled) return;

        if (savedXp) setXP(parseInt(savedXp, 10));
        if (savedGems) setGems(parseInt(savedGems, 10));
        if (savedStreak) setStreak(parseInt(savedStreak, 10));
        if (savedEnergy) {
          const parsedEnergy = parseInt(savedEnergy, 10);
          if (!Number.isNaN(parsedEnergy)) setEnergy(parsedEnergy);
        }
        if (savedEnergyUpdateTime) {
          const parsedEnergyUpdateTime = parseInt(savedEnergyUpdateTime, 10);
          if (!Number.isNaN(parsedEnergyUpdateTime)) setLastEnergyUpdateTime(parsedEnergyUpdateTime);
        }
        if (savedEnergyBonusDate) {
          setDailyEnergyBonusDate(savedEnergyBonusDate);
        }
        if (savedEnergyBonusCount) {
          const parsedEnergyBonusCount = parseInt(savedEnergyBonusCount, 10);
          if (!Number.isNaN(parsedEnergyBonusCount)) setDailyEnergyBonusCount(parsedEnergyBonusCount);
        }

        if (savedSnapshot) {
          try {
            const snapshot = JSON.parse(savedSnapshot) as Partial<PersistedAppSnapshot>;

            if (typeof snapshot.selectedGenre === "string" && snapshot.selectedGenre.length > 0) {
              setSelectedGenre(snapshot.selectedGenre);
            }
            if (typeof snapshot.skill === "number" && Number.isFinite(snapshot.skill)) {
              setSkill(snapshot.skill);
            }
            if (typeof snapshot.skillConfidence === "number" && Number.isFinite(snapshot.skillConfidence)) {
              setSkillConfidence(snapshot.skillConfidence);
            }
            if (typeof snapshot.questionsAnswered === "number" && Number.isFinite(snapshot.questionsAnswered)) {
              setQuestionsAnswered(snapshot.questionsAnswered);
            }
            if (Array.isArray(snapshot.completedLessons)) {
              setCompletedLessons(
                new Set(snapshot.completedLessons.filter((lessonId): lessonId is string => typeof lessonId === "string"))
              );
            }
            if (typeof snapshot.dailyGoal === "number" && Number.isFinite(snapshot.dailyGoal)) {
              setDailyGoalState(snapshot.dailyGoal);
            }
            if (typeof snapshot.dailyXP === "number" && Number.isFinite(snapshot.dailyXP)) {
              setDailyXP(snapshot.dailyXP);
            }
            if (typeof snapshot.dailyGoalLastReset === "string" && snapshot.dailyGoalLastReset.length > 0) {
              setDailyGoalLastReset(snapshot.dailyGoalLastReset);
            }
            if (snapshot.lastStudyDate === null || typeof snapshot.lastStudyDate === "string") {
              setLastStudyDate(snapshot.lastStudyDate ?? null);
            }
            if (snapshot.lastActivityDate === null || typeof snapshot.lastActivityDate === "string") {
              setLastActivityDate(snapshot.lastActivityDate ?? null);
            }
            if (Array.isArray(snapshot.streakHistory)) {
              const history = snapshot.streakHistory.filter((item): item is { date: string; xp: number; lessonsCompleted: number } => (
                Boolean(item) &&
                typeof item.date === "string" &&
                typeof item.xp === "number" &&
                typeof item.lessonsCompleted === "number"
              ));
              setStreakHistory(history.slice(-30));
            }
            if (Array.isArray(snapshot.reviewEvents)) {
              const events = snapshot.reviewEvents.filter((event): event is ReviewEvent => (
                Boolean(event) &&
                typeof event.userId === "string" &&
                typeof event.itemId === "string" &&
                typeof event.ts === "number" &&
                (event.result === "correct" || event.result === "incorrect")
              ));
              setReviewEvents(events);
            }
            if (Array.isArray(snapshot.recentQuestionTypes)) {
              setRecentQuestionTypes(
                snapshot.recentQuestionTypes
                  .filter((questionType): questionType is string => typeof questionType === "string")
                  .slice(-5)
              );
            }
            if (typeof snapshot.recentAccuracy === "number" && Number.isFinite(snapshot.recentAccuracy)) {
              setRecentAccuracy(snapshot.recentAccuracy);
            }
            if (typeof snapshot.currentStreak === "number" && Number.isFinite(snapshot.currentStreak)) {
              setCurrentStreak(snapshot.currentStreak);
            }
            if (Array.isArray(snapshot.recentResults)) {
              setRecentResults(snapshot.recentResults.filter((value): value is boolean => typeof value === "boolean").slice(-10));
            }
            if (typeof snapshot.mistakesCleared === "number" && Number.isFinite(snapshot.mistakesCleared)) {
              setMistakesCleared(snapshot.mistakesCleared);
            }
            if (snapshot.planId === "free" || snapshot.planId === "pro" || snapshot.planId === "max") {
              setPlanIdState(snapshot.planId);
            }
            if (snapshot.activeUntil === null || typeof snapshot.activeUntil === "string") {
              setActiveUntilState(snapshot.activeUntil ?? null);
            }
          } catch (snapshotError) {
            if (__DEV__) console.log("App snapshot parse failed:", snapshotError);
          }
        }

        if (savedMistakes) {
          try {
            const loadedMistakes = JSON.parse(savedMistakes);
            if (Array.isArray(loadedMistakes)) {
              // Migration: Convert old format to new SRS format
              const migratedMistakes = loadedMistakes.map((m: any) => {
                if (m?.box === undefined) {
                  return {
                    ...m,
                    box: 1,
                    nextReviewDate: Date.now(),
                    interval: 0,
                  };
                }
                return m;
              });
              setMistakes(migratedMistakes);
            }
          } catch (mistakesError) {
            if (__DEV__) console.log("Mistakes parse failed:", mistakesError);
          }
        }

        // Freeze一本化: streaks.tsから読み込み
        const streakData = await getStreakData();
        if (cancelled) return;
        setFreezeCount(streakData.freezesRemaining);

        if (__DEV__) console.log("Loaded from local storage (instant):", {
          savedXp,
          savedGems,
          savedStreak,
          savedEnergy,
          savedEnergyUpdateTime,
          savedEnergyBonusDate,
          savedEnergyBonusCount,
          freezes: streakData.freezesRemaining,
        });
      } catch (e) {
        if (__DEV__) console.log("Local storage read failed:", e);
      }

      // STEP 2: Sync from Supabase in background (non-blocking)
      // This will update state if Supabase has newer data
      try {
        if (cancelled) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('xp, gems, streak, level, plan_id, active_until')
          .eq('id', user.id)
          .single();
        if (cancelled) return;

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
      } finally {
        if (!cancelled) {
          setIsStateHydrated(true);
        }
      }

      badgeCheckTimer = setTimeout(() => {
        if (!cancelled) {
          triggerBadgeCheck();
        }
      }, 500);
    };
    loadState();
    return () => {
      cancelled = true;
      if (badgeCheckTimer) {
        clearTimeout(badgeCheckTimer);
      }
    };
  }, [user]);

  // Persist state changes
  // Persist state changes to Supabase (and Local Storage as backup)
  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`xp_${user.id}`, xp.toString());

    // Debounced update to Supabase to avoid too many requests
    const timer = setTimeout(() => {
      supabase.from('profiles').update({ xp }).eq('id', user.id).then(({ error }) => {
        if (error) console.error("Failed to sync XP to Supabase", error);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [xp, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`gems_${user.id}`, gems.toString());

    const timer = setTimeout(() => {
      supabase.from('profiles').update({ gems }).eq('id', user.id).then(({ error }) => {
        if (error) console.error("Failed to sync Gems to Supabase", error);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [gems, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`streak_${user.id}`, streak.toString());

    supabase.from('profiles').update({ streak }).eq('id', user.id).then(({ error }) => {
      if (error) console.error("Failed to sync Streak to Supabase", error);
    });
  }, [streak, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`energy_${user.id}`, energy.toString());
  }, [energy, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    if (lastEnergyUpdateTime === null) {
      AsyncStorage.removeItem(`energy_update_time_${user.id}`).catch(() => { });
      return;
    }
    AsyncStorage.setItem(`energy_update_time_${user.id}`, lastEnergyUpdateTime.toString());
  }, [lastEnergyUpdateTime, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`energy_bonus_date_${user.id}`, dailyEnergyBonusDate);
  }, [dailyEnergyBonusDate, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;
    AsyncStorage.setItem(`energy_bonus_count_${user.id}`, dailyEnergyBonusCount.toString());
  }, [dailyEnergyBonusCount, user, isStateHydrated]);

  useEffect(() => {
    if (!user || !isStateHydrated) return;

    const snapshot: PersistedAppSnapshot = {
      version: 1,
      selectedGenre,
      skill,
      skillConfidence,
      questionsAnswered,
      completedLessons: Array.from(completedLessons),
      dailyGoal,
      dailyXP,
      dailyGoalLastReset,
      lastStudyDate,
      lastActivityDate,
      streakHistory,
      reviewEvents,
      recentQuestionTypes,
      recentAccuracy,
      currentStreak,
      recentResults,
      mistakesCleared,
      planId,
      activeUntil,
    };

    AsyncStorage.setItem(getAppSnapshotKey(user.id), JSON.stringify(snapshot)).catch((error) => {
      if (__DEV__) console.log("Failed to persist app snapshot:", error);
    });
  }, [
    user,
    isStateHydrated,
    selectedGenre,
    skill,
    skillConfidence,
    questionsAnswered,
    completedLessons,
    dailyGoal,
    dailyXP,
    dailyGoalLastReset,
    lastStudyDate,
    lastActivityDate,
    streakHistory,
    reviewEvents,
    recentQuestionTypes,
    recentAccuracy,
    currentStreak,
    recentResults,
    mistakesCleared,
    planId,
    activeUntil,
  ]);

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

  // Convert YYYY-MM-DD into UTC day number for stable date diffs.
  function dateKeyToUtcDay(dateStr: string): number {
    const [y, m, d] = dateStr.split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / (1000 * 60 * 60 * 24));
  }

  // Check and reset daily progress
  useEffect(() => {
    const today = getTodayDate();
    if (dailyGoalLastReset !== today) {
      setDailyXP(0);
      setDailyGoalLastReset(today);
    }
  }, [dailyGoalLastReset]);

  useEffect(() => {
    const resetBonusIfNeeded = () => {
      const today = getTodayDate();
      if (dailyEnergyBonusDate !== today) {
        setDailyEnergyBonusDate(today);
        setDailyEnergyBonusCount(0);
      }
    };

    resetBonusIfNeeded();
    const interval = setInterval(resetBonusIfNeeded, 60000);
    return () => clearInterval(interval);
  }, [dailyEnergyBonusDate]);

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
      const missedDays = Math.max(1, dateKeyToUtcDay(today) - dateKeyToUtcDay(lastActivityDate) - 1);
      setFreezeCount(freezeCount - 1);
      newStreak = streak + 1;
      Analytics.track("streak_saved_with_freeze", {
        streakType: "study",
        previousStreak: streak,
        nextStreak: newStreak,
        missedDays,
        freezeRemainingBefore: freezeCount,
        freezeRemainingAfter: freezeCount - 1,
      });
    } else {
      // Break streak
      const missedDays = Math.max(1, dateKeyToUtcDay(today) - dateKeyToUtcDay(lastActivityDate) - 1);
      if (streak > 0) {
        Analytics.track("streak_lost", {
          streakType: "study",
          previousStreak: streak,
          missedDays,
          freezeAvailable: freezeCount,
        });
      }
      newStreak = 1;
    }

    setStreak(newStreak);
    setLastActivityDate(today);

    if (crossedThreshold(streak, newStreak, STREAK_BADGE_THRESHOLDS)) {
      triggerBadgeCheck();
    }

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
          }, {
            onConflict: 'user_id',
          });
      } catch (error) {
        console.error('Error updating streak in Supabase:', error);
      }
    }
  };

  // Add XP and update daily progress + streak
  const addXp = async (amount: number, source: XpSource = "system") => {
    const normalized = Math.max(0, Math.floor(amount));
    if (normalized <= 0) return;

    let effectiveAmount = normalized;
    if (source === "lesson" || source === "question") {
      const boosted = await applyXpBoost(normalized, source);
      effectiveAmount = boosted.effectiveXp;
    }

    const previousXP = xp;
    const newXP = previousXP + effectiveAmount;
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

    if (crossedThreshold(previousXP, newXP, XP_BADGE_THRESHOLDS)) {
      triggerBadgeCheck();
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

  const grantFreezes = async (amount: number): Promise<void> => {
    const normalized = Math.max(0, Math.floor(amount));
    if (normalized <= 0) return;
    await addFreezes(normalized);
    const latest = await getStreakData();
    setFreezeCount(latest.freezesRemaining);
  };

  const awardBadgeById = async (badgeId: string): Promise<boolean> => {
    if (!badgeId) return false;
    if (unlockedBadges.has(badgeId)) return false;

    setUnlockedBadges((prev) => new Set(prev).add(badgeId));

    if (!user) return true;

    try {
      const { error } = await supabase
        .from("user_badges")
        .insert({ user_id: user.id, badge_id: badgeId });

      if (error) {
        console.error("Failed to persist awarded badge:", error);
      }
    } catch (err) {
      console.error("Failed to persist awarded badge:", err);
    }

    return true;
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

  // Energy system methods
  const consumeEnergy = (amount = 1): boolean => {
    if (isSubscriptionActive) return true;
    const normalized = Math.max(0, Math.floor(amount));
    if (normalized === 0) return true;
    if (energy < normalized) return false;

    const nextEnergy = Math.max(0, energy - normalized);
    setEnergy(nextEnergy);
    if (nextEnergy < FREE_MAX_ENERGY && lastEnergyUpdateTime === null) {
      setLastEnergyUpdateTime(Date.now());
    }
    return true;
  };

  const addEnergy = (amount: number) => {
    if (isSubscriptionActive) return;
    const normalized = Math.max(0, Math.floor(amount));
    if (normalized === 0) return;

    const nextEnergy = Math.min(FREE_MAX_ENERGY, energy + normalized);
    setEnergy(nextEnergy);
    if (nextEnergy >= FREE_MAX_ENERGY) {
      setLastEnergyUpdateTime(null);
    } else if (lastEnergyUpdateTime === null) {
      setLastEnergyUpdateTime(Date.now());
    }
  };

  const tryTriggerStreakEnergyBonus = (correctStreak: number): boolean => {
    if (isSubscriptionActive) return false;
    if (correctStreak <= 0 || correctStreak % ENERGY_STREAK_BONUS_EVERY !== 0) return false;

    const today = getTodayDate();
    const currentBonusCount = dailyEnergyBonusDate === today ? dailyEnergyBonusCount : 0;
    if (currentBonusCount >= ENERGY_STREAK_BONUS_DAILY_CAP) return false;

    const roll = Math.random();
    if (roll >= ENERGY_STREAK_BONUS_CHANCE) return false;

    const prevEnergy = energy;
    const nextEnergy = Math.min(FREE_MAX_ENERGY, prevEnergy + 1);
    addEnergy(1);
    setDailyEnergyBonusDate(today);
    setDailyEnergyBonusCount(currentBonusCount + 1);
    Analytics.track("energy_bonus_hit", {
      correctStreak,
      energyBefore: prevEnergy,
      energyAfter: nextEnergy,
      dailyBonusCount: currentBonusCount + 1,
      dailyBonusCap: ENERGY_STREAK_BONUS_DAILY_CAP,
    });
    return true;
  };

  // Plan & Entitlements methods
  const setPlanId = (plan: PlanId) => {
    Analytics.track("plan_changed", {
      fromPlan: planId,
      toPlan: plan,
      source: "state",
    });
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
  const maxEnergy = isSubscriptionActive ? SUBSCRIBER_MAX_ENERGY : FREE_MAX_ENERGY;
  const energyRefillMinutes = Math.floor(ENERGY_REFILL_MS / 60000);
  const dailyEnergyBonusRemaining = (() => {
    if (isSubscriptionActive) return ENERGY_STREAK_BONUS_DAILY_CAP;
    const today = getTodayDate();
    const usedCount = dailyEnergyBonusDate === today ? dailyEnergyBonusCount : 0;
    return Math.max(0, ENERGY_STREAK_BONUS_DAILY_CAP - usedCount);
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

  // Auto-recover energy over time (60 minutes per +1)
  useEffect(() => {
    if (isSubscriptionActive) {
      if (energy !== SUBSCRIBER_MAX_ENERGY) setEnergy(SUBSCRIBER_MAX_ENERGY);
      if (lastEnergyUpdateTime !== null) setLastEnergyUpdateTime(null);
      return;
    }

    if (energy > FREE_MAX_ENERGY) {
      setEnergy(FREE_MAX_ENERGY);
      return;
    }

    const recoverEnergy = () => {
      if (lastEnergyUpdateTime === null) return;
      if (energy >= FREE_MAX_ENERGY) {
        setLastEnergyUpdateTime(null);
        return;
      }

      const elapsed = Date.now() - lastEnergyUpdateTime;
      const recovered = Math.floor(elapsed / ENERGY_REFILL_MS);
      if (recovered <= 0) return;

      const nextEnergy = Math.min(FREE_MAX_ENERGY, energy + recovered);
      setEnergy(nextEnergy);
      if (nextEnergy >= FREE_MAX_ENERGY) {
        setLastEnergyUpdateTime(null);
      } else {
        setLastEnergyUpdateTime(lastEnergyUpdateTime + recovered * ENERGY_REFILL_MS);
      }
    };

    recoverEnergy();
    const interval = setInterval(recoverEnergy, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [energy, isSubscriptionActive, lastEnergyUpdateTime]);

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
    grantFreezes,
    awardBadgeById,
    dailyGoal,
    dailyXP,
    setDailyGoal,
    energy,
    maxEnergy,
    consumeEnergy,
    addEnergy,
    tryTriggerStreakEnergyBonus,
    energyRefillMinutes,
    dailyEnergyBonusRemaining,
    lastEnergyUpdateTime,
    planId,
    setPlanId,
    hasProAccess,
    activeUntil,
    setActiveUntil,
    isSubscriptionActive,
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
