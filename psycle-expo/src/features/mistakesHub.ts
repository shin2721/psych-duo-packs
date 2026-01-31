// src/features/mistakesHub.ts
import entitlements from "../../config/entitlements.json";

interface ReviewEvent {
  userId: string;
  itemId: string;
  ts: number; // Unix timestamp (ms)
  result: "correct" | "incorrect";
  latencyMs?: number;
  dueAt?: number; // Unix timestamp (ms)
  tags?: string[];
  beta?: number; // 難易度
  p?: number; // 想起確率
}

interface ScoredItem {
  itemId: string;
  score: number;
  tags: string[];
  beta: number;
  p: number;
  ts: number;
}

const PAST_DAYS_WINDOW = entitlements.defaults.past_days_window;
const LONG_THINK_THRESHOLD = entitlements.defaults.long_think_threshold_seconds * 1000;
const MISTAKES_HUB_SIZE = entitlements.defaults.mistakes_hub_size;
const OPTIMAL_P_MIN = entitlements.defaults.optimal_p_min;
const OPTIMAL_P_MAX = entitlements.defaults.optimal_p_max;

/**
 * 直近のミスから個別化復習用の10問を選定
 *
 * スコアリング基準：
 * - 誤答：+3点
 * - 長考（>25秒）：+2点
 * - SRS期限超過：+2点（最大1週間で頭打ち）
 * - 直近度ボーナス：exp(-日数/10)
 * - 難易度ペナルティ：|p - 0.625|（目標帯0.55-0.7から外れるほど減点）
 *
 * タグ配分：results=3, methods=3, background=2, discussion=2
 *
 * @param {ReviewEvent[]} events - 全復習イベント
 * @returns {string[]} 選定された問題ID（最大10問）
 */
export function selectMistakesHubItems(events: ReviewEvent[]): string[] {
  const now = Date.now();
  const cutoffTs = now - PAST_DAYS_WINDOW * 24 * 60 * 60 * 1000;

  // 過去30日のイベントに絞る
  const recentEvents = events.filter((e) => e.ts >= cutoffTs);

  if (recentEvents.length === 0) {
    return [];
  }

  // 問題ごとにスコア集計
  const itemMap = new Map<string, ScoredItem>();

  for (const event of recentEvents) {
    const existing = itemMap.get(event.itemId);

    // スコア要素を計算
    const incorrectScore = event.result === "incorrect" ? 3 : 0;
    const longThinkScore = event.latencyMs && event.latencyMs > LONG_THINK_THRESHOLD ? 2 : 0;

    let overdueScore = 0;
    if (event.dueAt && event.ts > event.dueAt) {
      const overdueDays = (event.ts - event.dueAt) / (24 * 60 * 60 * 1000);
      overdueScore = 2 * Math.min(overdueDays / 7, 1); // 1週間で頭打ち
    }

    // 直近度ボーナス（10日で減衰）
    const daysAgo = (now - event.ts) / (24 * 60 * 60 * 1000);
    const recencyBonus = Math.exp(-daysAgo / 10);

    // 難易度ペナルティ（目標帯0.55-0.7の中心0.625から外れるほど減点）
    const p = event.p ?? 0.5;
    const targetP = (OPTIMAL_P_MIN + OPTIMAL_P_MAX) / 2; // 0.625
    const difficultyPenalty = Math.abs(p - targetP);

    const eventScore = incorrectScore + longThinkScore + overdueScore + recencyBonus - difficultyPenalty;

    if (!existing) {
      itemMap.set(event.itemId, {
        itemId: event.itemId,
        score: eventScore,
        tags: event.tags ?? [],
        beta: event.beta ?? 0,
        p: event.p ?? 0.5,
        ts: event.ts,
      });
    } else {
      // スコア累積、最新データで更新
      existing.score += eventScore;
      if (event.ts > existing.ts) {
        existing.ts = event.ts;
        existing.tags = event.tags ?? existing.tags;
        existing.beta = event.beta ?? existing.beta;
        existing.p = event.p ?? existing.p;
      }
    }
  }

  // スコア降順でソート
  const scoredItems = Array.from(itemMap.values()).sort((a, b) => b.score - a.score);

  // タグ配分目標：results=3, methods=3, background=2, discussion=2
  const targetDistribution = {
    results: 3,
    methods: 3,
    background: 2,
    discussion: 2,
  };

  // タグバランスを保ちつつ選定
  const selected: string[] = [];
  const tagCounts = { results: 0, methods: 0, background: 0, discussion: 0 };

  // 第1パス：高スコア優先でタグ上限を守る
  for (const item of scoredItems) {
    if (selected.length >= MISTAKES_HUB_SIZE) {
      break;
    }

    const primaryTag = findPrimaryTag(item.tags);

    if (primaryTag && tagCounts[primaryTag] < targetDistribution[primaryTag]) {
      selected.push(item.itemId);
      tagCounts[primaryTag]++;
    }
  }

  // 第2パス：残り枠を埋める
  for (const item of scoredItems) {
    if (selected.length >= MISTAKES_HUB_SIZE) {
      break;
    }

    if (!selected.includes(item.itemId)) {
      selected.push(item.itemId);
    }
  }

  return selected;
}

/**
 * 問題のタグから優先タグを決定（results > methods > background > discussion）
 * @param {string[]} tags - 問題のタグ配列
 * @returns {keyof typeof targetDistribution | null} 優先タグまたはnull
 */
function findPrimaryTag(tags: string[]): "results" | "methods" | "background" | "discussion" | null {
  const priority = ["results", "methods", "background", "discussion"] as const;

  for (const tag of priority) {
    if (tags.includes(tag)) {
      return tag;
    }
  }

  return null;
}

/**
 * 単一問題のスコアを計算
 * @param {ReviewEvent[]} itemEvents - 該当問題の全イベント
 * @returns {number} 総スコア
 */
export function calculateItemScore(itemEvents: ReviewEvent[]): number {
  const now = Date.now();
  let totalScore = 0;

  for (const event of itemEvents) {
    const incorrectScore = event.result === "incorrect" ? 3 : 0;
    const longThinkScore = event.latencyMs && event.latencyMs > LONG_THINK_THRESHOLD ? 2 : 0;

    let overdueScore = 0;
    if (event.dueAt && event.ts > event.dueAt) {
      const overdueDays = (event.ts - event.dueAt) / (24 * 60 * 60 * 1000);
      overdueScore = 2 * Math.min(overdueDays / 7, 1);
    }

    const daysAgo = (now - event.ts) / (24 * 60 * 60 * 1000);
    const recencyBonus = Math.exp(-daysAgo / 10);

    const p = event.p ?? 0.5;
    const targetP = (OPTIMAL_P_MIN + OPTIMAL_P_MAX) / 2;
    const difficultyPenalty = Math.abs(p - targetP);

    totalScore += incorrectScore + longThinkScore + overdueScore + recencyBonus - difficultyPenalty;
  }

  return totalScore;
}

/**
 * 過去N日間のイベントに絞り込み
 * @param {ReviewEvent[]} events - 全イベント
 * @param {number} [days=PAST_DAYS_WINDOW] - 日数（デフォルト30日）
 * @returns {ReviewEvent[]} 絞り込まれたイベント
 */
export function filterRecentEvents(events: ReviewEvent[], days: number = PAST_DAYS_WINDOW): ReviewEvent[] {
  const cutoffTs = Date.now() - days * 24 * 60 * 60 * 1000;
  return events.filter((e) => e.ts >= cutoffTs);
}
