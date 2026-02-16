#!/usr/bin/env node
/**
 * Generate Psycle KPI report from PostHog dashboard insights.
 *
 * Required env vars (or CLI flags):
 * - POSTHOG_PERSONAL_API_KEY (or --token)
 * - POSTHOG_PROJECT_ID (or --project)
 *
 * Optional:
 * - POSTHOG_HOST (default: https://app.posthog.com)
 * - POSTHOG_DASHBOARD_ID (or --dashboard-id)
 * - --json (print JSON only)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const DEFAULT_HOST = "https://app.posthog.com";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GAMIFICATION_CONFIG_PATH = path.resolve(__dirname, "../config/gamification.json");
const PROJECT_ROOT = path.resolve(__dirname, "..");

function loadLocalEnv() {
  const envFiles = [
    ".env.posthog.local",
    ".env.local",
    ".env",
  ];

  for (const file of envFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    dotenv.config({ path: fullPath, override: false, quiet: true });
  }
}

const DEFAULT_TUNING_TARGETS = {
  anomaly_worsening_threshold: 0.2,
  lesson_completion_rate_uv_7d_min: 0.55,
  energy_block_rate_7d_max: 0.25,
  energy_shop_intent_7d_min: 0.08,
  lesson_complete_user_rate_7d_min: 0.45,
  recovery_mission_claim_rate_7d_min: 0.2,
  streak_guard_save_rate_7d_min: 0.35,
  league_boundary_click_rate_7d_min: 0.12,
  league_sprint_click_rate_7d_min: 0.15,
  streak_visibility_click_rate_7d_min: 0.25,
  journal_top2_pick_share_7d_min: 0.55,
  streak_guard_evening_save_rate_7d_min: 0.3,
  journal_post_user_rate_7d_min: 0.18,
  journal_not_tried_share_7d_max: 0.5,
  daily_quest_3of3_rate_7d_min: 0.22,
  xp_boost_activation_rate_7d_min: 0.55,
  xp_boost_bonus_xp_per_user_7d_min: 20,
  d1_retention_rate_7d_min: 0.25,
  d7_retention_rate_7d_min: 0.08,
  paid_plan_changes_per_checkout_7d_min: 0.18,
  completed_sessions_per_day_7d_min: 1.2,
};

const DASHBOARD_NAMES = [
  "Psycle Growth Dashboard (v1.18)",
  "Psycle Growth Dashboard (v1.17)",
  "Psycle Growth Dashboard (v1.16)",
  "Psycle Growth Dashboard (v1.15)",
  "Psycle Growth Dashboard (v1.14)",
  "Psycle Growth Dashboard (v1.13)",
  "Psycle Growth Dashboard (v1.12)",
  "Psycle Growth Dashboard (v1.11)",
  "Psycle Growth Dashboard (v1.10)",
  "Psycle Growth Dashboard (v1.9)",
  "Psycle Growth Dashboard (v1.8)",
  "Psycle Growth Dashboard (v1.7)",
  "Psycle Growth Dashboard (v1.6)",
  "Psycle Growth Dashboard (v1.5)",
];

const REQUIRED_INSIGHTS = [
  "DAU (session_start UV)",
  "Lesson Start vs Complete (UV)",
  "Lesson Complete Users vs DAU (UV)",
  "Intervention Funnel (daily)",
  "Recovery Mission (daily)",
  "Streak Guard (daily)",
  "League Boundary (daily)",
  "Action Journal (daily)",
  "Incorrect vs Lesson Start (daily)",
  "Streak Lost Users (daily)",
  "Energy Friction (daily)",
  "D1 Retention (session_start)",
  "D7 Retention (session_start)",
  "Checkout Starts (daily)",
  "Paid Plan Changes (daily)",
];

const OPTIONAL_INSIGHTS = [
  "Completed Sessions (daily)",
  "Streak Visibility (daily)",
  "Streak Guard by Daypart (daily)",
  "Action Journal Quality (daily)",
  "League Sprint (daily)",
  "Quest Progress (daily)",
  "XP Boost (daily)",
];

const PRIMARY_KPI_KEYS = [
  "d7_retention_rate_7d",
  "paid_plan_changes_per_checkout_7d",
  "lesson_complete_user_rate_7d",
  "journal_post_user_rate_7d",
];

function parseArgs(argv) {
  const flags = new Set();
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    if (token.includes("=")) {
      const [k, v] = token.split("=");
      if (v !== undefined && v !== "") options[k] = v;
      else flags.add(k);
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      options[token] = next;
      i++;
      continue;
    }
    flags.add(token);
  }
  return { flags, options };
}

function normalizeHost(input) {
  const raw = (input || DEFAULT_HOST).trim();
  if (!raw) return DEFAULT_HOST;
  const withScheme =
    raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

function buildConfig() {
  loadLocalEnv();
  const { flags, options } = parseArgs(process.argv.slice(2));
  const dashboardIdFromCli = options["--dashboard-id"] || "";
  const dashboardIdFromEnv = process.env.POSTHOG_DASHBOARD_ID || "";
  const dashboardId = dashboardIdFromCli || dashboardIdFromEnv;
  return {
    host: normalizeHost(options["--host"] || process.env.POSTHOG_HOST || DEFAULT_HOST),
    token: options["--token"] || process.env.POSTHOG_PERSONAL_API_KEY || "",
    projectId: options["--project"] || process.env.POSTHOG_PROJECT_ID || "",
    dashboardId,
    dashboardIdFromEnv: !dashboardIdFromCli && Boolean(dashboardIdFromEnv),
    jsonOnly: flags.has("--json"),
  };
}

function loadTuningTargets() {
  try {
    const raw = fs.readFileSync(GAMIFICATION_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_TUNING_TARGETS,
      ...(parsed?.tuning_targets || {}),
    };
  } catch {
    return { ...DEFAULT_TUNING_TARGETS };
  }
}

async function apiRequest(config, method, path, body) {
  const res = await fetch(`${config.host}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const payload = text.trim().startsWith("{") || text.trim().startsWith("[") ? JSON.parse(text) : text;
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status} ${res.statusText} for ${method} ${path}`);
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function listAll(config, path) {
  const out = [];
  let url = path;
  while (url) {
    const payload = await apiRequest(config, "GET", url, undefined);
    out.push(...(payload.results || []));
    const next = payload.next;
    if (!next) {
      url = null;
    } else if (next.startsWith(config.host)) {
      url = next.slice(config.host.length);
    } else {
      const parsed = new URL(next);
      url = `${parsed.pathname}${parsed.search}`;
    }
  }
  return out;
}

function toDayString(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dayToUtcNumber(day) {
  const [y, m, d] = day.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / (1000 * 60 * 60 * 24));
}

function utcNumberToDay(n) {
  const d = new Date(n * 24 * 60 * 60 * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function offsetDay(day, diff) {
  return utcNumberToDay(dayToUtcNumber(day) + diff);
}

function sumWindow(map, startDay, endDay) {
  const start = dayToUtcNumber(startDay);
  const end = dayToUtcNumber(endDay);
  let total = 0;
  for (let d = start; d <= end; d++) {
    const key = utcNumberToDay(d);
    total += Number(map.get(key) || 0);
  }
  return total;
}

function safeRate(numerator, denominator) {
  if (!denominator) return null;
  return numerator / denominator;
}

function pctChange(current, previous) {
  if (current == null || previous == null || previous === 0) return null;
  return (current - previous) / previous;
}

function formatNum(v, digits = 2) {
  if (v == null || Number.isNaN(v)) return "n/a";
  return Number(v).toFixed(digits);
}

function formatPct(v, digits = 2) {
  if (v == null || Number.isNaN(v)) return "n/a";
  return `${Number(v * 100).toFixed(digits)}%`;
}

function parseTrendInsight(insight) {
  const result = Array.isArray(insight.result) ? insight.result : [];
  const seriesMap = new Map();
  const combined = new Map();

  result.forEach((series, idx) => {
    const days = Array.isArray(series.days) ? series.days : [];
    const values = Array.isArray(series.data) ? series.data : [];
    const label =
      series.label ||
      series.action?.name ||
      series.action?.event ||
      series.breakdown_value ||
      `series_${idx}`;

    const byDay = new Map();
    days.forEach((rawDay, i) => {
      const day = toDayString(rawDay);
      if (!day) return;
      const value = Number(values[i] || 0);
      byDay.set(day, value);
      combined.set(day, Number(combined.get(day) || 0) + value);
    });
    seriesMap.set(label, byDay);
  });

  return { seriesMap, combined };
}

function pickSeries(seriesMap, tokens) {
  const loweredTokens = tokens.map((t) => t.toLowerCase());
  for (const [label, map] of seriesMap.entries()) {
    const lower = String(label).toLowerCase();
    if (loweredTokens.some((t) => lower.includes(t))) return map;
  }
  return new Map();
}

function pickSeriesAllTokens(seriesMap, tokens) {
  const loweredTokens = tokens.map((t) => t.toLowerCase());
  for (const [label, map] of seriesMap.entries()) {
    const lower = String(label).toLowerCase();
    if (loweredTokens.every((t) => lower.includes(t))) return map;
  }
  return new Map();
}

function retentionRateForWindow(insight, dayIndex, startDay, endDay) {
  const rows = Array.isArray(insight.result) ? insight.result : [];
  let cohorts = 0;
  let retained = 0;
  const start = dayToUtcNumber(startDay);
  const end = dayToUtcNumber(endDay);

  for (const row of rows) {
    const cohortDay = toDayString(row.date);
    if (!cohortDay) continue;
    const cohortUtc = dayToUtcNumber(cohortDay);
    if (cohortUtc < start || cohortUtc > end) continue;

    const values = Array.isArray(row.values) ? row.values : [];
    const day0 = Number(values[0]?.count || 0);
    const dayN = Number(values[dayIndex]?.count || 0);
    cohorts += day0;
    retained += dayN;
  }

  return safeRate(retained, cohorts);
}

function buildAnomalies(metrics, worseningThreshold) {
  const checks = [
    {
      key: "lesson_completion_rate_uv_7d",
      higherIsBetter: true,
      label: "Lesson Completion Rate",
    },
    {
      key: "incorrect_per_lesson_start_7d",
      higherIsBetter: false,
      label: "Incorrect Per Lesson Start",
    },
    {
      key: "energy_block_rate_7d",
      higherIsBetter: false,
      label: "Energy Block Rate",
    },
    {
      key: "energy_shop_intent_7d",
      higherIsBetter: true,
      label: "Energy Shop Intent",
    },
    {
      key: "d1_retention_rate_7d",
      higherIsBetter: true,
      label: "D1 Retention",
    },
    {
      key: "d7_retention_rate_7d",
      higherIsBetter: true,
      label: "D7 Retention",
    },
    {
      key: "lesson_complete_user_rate_7d",
      higherIsBetter: true,
      label: "Lesson Complete User Rate",
    },
    {
      key: "journal_post_user_rate_7d",
      higherIsBetter: true,
      label: "Journal Post User Rate",
    },
    {
      key: "journal_not_tried_share_7d",
      higherIsBetter: false,
      label: "Journal Not Tried Share",
    },
    {
      key: "journal_top2_pick_share_7d",
      higherIsBetter: true,
      label: "Journal Top2 Pick Share",
    },
    {
      key: "streak_visibility_click_rate_7d",
      higherIsBetter: true,
      label: "Streak Visibility Click Rate",
    },
    {
      key: "recovery_mission_claim_rate_7d",
      higherIsBetter: true,
      label: "Recovery Mission Claim Rate",
    },
    {
      key: "streak_guard_save_rate_7d",
      higherIsBetter: true,
      label: "Streak Guard Save Rate",
    },
    {
      key: "league_boundary_click_rate_7d",
      higherIsBetter: true,
      label: "League Boundary Click Rate",
    },
    {
      key: "league_sprint_click_rate_7d",
      higherIsBetter: true,
      label: "League Sprint Click Rate",
    },
    {
      key: "streak_guard_evening_save_rate_7d",
      higherIsBetter: true,
      label: "Streak Guard Evening Save Rate",
    },
    {
      key: "paid_plan_changes_per_checkout_7d",
      higherIsBetter: true,
      label: "Paid Plan Conversion",
    },
  ];

  const anomalies = [];
  for (const c of checks) {
    const current = metrics[c.key];
    const previous = metrics[`${c.key}_prev`];
    if (current == null || previous == null || previous === 0) continue;
    const delta = pctChange(current, previous);
    if (delta == null) continue;
    const worsened = c.higherIsBetter ? delta <= -worseningThreshold : delta >= worseningThreshold;
    if (worsened) {
      anomalies.push({
        metric: c.label,
        current,
        previous,
        delta,
      });
    }
  }
  return anomalies;
}

function buildTargetBreaches(metrics, targets) {
  const checks = [
    {
      key: "lesson_completion_rate_uv_7d",
      label: "Lesson Completion Rate 7d",
      target: targets.lesson_completion_rate_uv_7d_min,
      mode: "min",
    },
    {
      key: "energy_block_rate_7d",
      label: "Energy Block Rate 7d",
      target: targets.energy_block_rate_7d_max,
      mode: "max",
    },
    {
      key: "energy_shop_intent_7d",
      label: "Energy Shop Intent 7d",
      target: targets.energy_shop_intent_7d_min,
      mode: "min",
    },
    {
      key: "lesson_complete_user_rate_7d",
      label: "Lesson Complete User Rate 7d",
      target: targets.lesson_complete_user_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "recovery_mission_claim_rate_7d",
      label: "Recovery Mission Claim Rate 7d",
      target: targets.recovery_mission_claim_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "streak_guard_save_rate_7d",
      label: "Streak Guard Save Rate 7d",
      target: targets.streak_guard_save_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "streak_guard_evening_save_rate_7d",
      label: "Streak Guard Evening Save Rate 7d",
      target: targets.streak_guard_evening_save_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "league_boundary_click_rate_7d",
      label: "League Boundary Click Rate 7d",
      target: targets.league_boundary_click_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "league_sprint_click_rate_7d",
      label: "League Sprint Click Rate 7d",
      target: targets.league_sprint_click_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "streak_visibility_click_rate_7d",
      label: "Streak Visibility Click Rate 7d",
      target: targets.streak_visibility_click_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "journal_post_user_rate_7d",
      label: "Journal Post User Rate 7d",
      target: targets.journal_post_user_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "journal_top2_pick_share_7d",
      label: "Journal Top2 Pick Share 7d",
      target: targets.journal_top2_pick_share_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "journal_not_tried_share_7d",
      label: "Journal Not Tried Share 7d",
      target: targets.journal_not_tried_share_7d_max,
      mode: "max",
      unit: "ratio",
    },
    {
      key: "daily_quest_3of3_rate_7d",
      label: "Daily Quest 3/3 Rate 7d",
      target: targets.daily_quest_3of3_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "xp_boost_activation_rate_7d",
      label: "XP Boost Activation Rate 7d",
      target: targets.xp_boost_activation_rate_7d_min,
      mode: "min",
      unit: "ratio",
    },
    {
      key: "xp_boost_bonus_xp_per_user_7d",
      label: "XP Boost Bonus XP/User 7d",
      target: targets.xp_boost_bonus_xp_per_user_7d_min,
      mode: "min",
      unit: "number",
    },
    {
      key: "d1_retention_rate_7d",
      label: "D1 Retention 7d",
      target: targets.d1_retention_rate_7d_min,
      mode: "min",
    },
    {
      key: "d7_retention_rate_7d",
      label: "D7 Retention 7d",
      target: targets.d7_retention_rate_7d_min,
      mode: "min",
    },
    {
      key: "paid_plan_changes_per_checkout_7d",
      label: "Paid Plan Conversion 7d",
      target: targets.paid_plan_changes_per_checkout_7d_min,
      mode: "min",
      unit: "ratio",
    },
  ];

  const breaches = [];
  for (const c of checks) {
    const current = metrics[c.key];
    if (current == null || c.target == null) continue;
    const breached = c.mode === "min" ? current < c.target : current > c.target;
    if (breached) {
      breaches.push({
        metric: c.label,
        current,
        target: c.target,
        mode: c.mode,
        unit: c.unit || "ratio",
      });
    }
  }
  return breaches;
}

function buildRecommendedActions(anomalies, breaches) {
  const actions = [];
  const flagged = new Set([
    ...anomalies.map((a) => a.metric),
    ...breaches.map((b) => b.metric),
  ]);

  if (flagged.has("Lesson Completion Rate") || flagged.has("Lesson Completion Rate 7d") || flagged.has("Incorrect Per Lesson Start")) {
    actions.push("レッスン冒頭10問を易化し、誤答時ヒントを必ず表示する。");
  }
  if (
    flagged.has("Energy Block Rate")
    || flagged.has("Energy Block Rate 7d")
    || flagged.has("Energy Shop Intent")
    || flagged.has("Energy Shop Intent 7d")
  ) {
    actions.push("focus.recovery_rate_per_hour を +0.25 刻みで調整し、energy_blocked→shop_open_from_energy 導線文言をA/Bする。");
  }
  if (flagged.has("Lesson Complete User Rate") || flagged.has("Lesson Complete User Rate 7d")) {
    actions.push("lesson_start→lesson_complete を改善するため、レッスン前半10問の難易度を緩和し、誤答時ヒントを必ず表示する。");
  }
  if (flagged.has("Journal Post User Rate") || flagged.has("Journal Post User Rate 7d")) {
    actions.push("questsタブ上部の日記カードを最上段固定し、投稿完了後の再編集導線を明示して投稿率を上げる。");
  }
  if (flagged.has("Journal Not Tried Share") || flagged.has("Journal Not Tried Share 7d")) {
    actions.push("not_tried比率を下げるため、直近5レッスン由来候補を優先表示し、genre_fallback候補を1件追加する。");
  }
  if (flagged.has("Journal Top2 Pick Share") || flagged.has("Journal Top2 Pick Share 7d")) {
    actions.push("日記候補の先頭2件を強化するため、positive_historyの更新頻度を上げ、成功ラベルを先頭固定する。");
  }
  if (flagged.has("Daily Quest 3/3 Rate 7d")) {
    actions.push("日次クエスト3/3達成率を上げるため、questsタブ上部に残りタスク数と翌日2xXP報酬を固定表示する。");
  }
  if (flagged.has("XP Boost Activation Rate 7d") || flagged.has("XP Boost Bonus XP/User 7d")) {
    actions.push("翌日2xXPチケットの有効日に、初回レッスン開始前にブースト開始予告を表示して起動率を改善する。");
  }
  if (flagged.has("Streak Visibility Click Rate") || flagged.has("Streak Visibility Click Rate 7d")) {
    actions.push("連続記録ステータスカードのCTA文言を短くし、course/quests両面で同一表現に統一してクリック率を改善する。");
  }
  if (flagged.has("Recovery Mission Claim Rate") || flagged.has("Recovery Mission Claim Rate 7d")) {
    actions.push("離脱翌日の復帰導線を強化するため、コース先頭に復帰ミッションバナーを固定表示し、CTA押下で即レッスン開始に遷移する。");
  }
  if (flagged.has("Streak Guard Save Rate") || flagged.has("Streak Guard Save Rate 7d")) {
    actions.push("欠勤直前ユーザー向けに失速防止カードを固定表示し、CTA押下から実行完了までの導線を1タップ短縮する。");
  }
  if (flagged.has("Streak Guard Evening Save Rate") || flagged.has("Streak Guard Evening Save Rate 7d")) {
    actions.push("夜帯の失速防止コピーを短文化し、streak_guard_shownのevening比率とsave率を同時に確認する。");
  }
  if (flagged.has("League Boundary Click Rate") || flagged.has("League Boundary Click Rate 7d")) {
    actions.push("リーグ境界カードの訴求文を改善し、昇格/降格ラインまでの必要XPを明確に表示してCTAタップ率を上げる。");
  }
  if (flagged.has("League Sprint Click Rate") || flagged.has("League Sprint Click Rate 7d")) {
    actions.push("日曜終盤のリーグスパート文言を短文化し、残り時間と必要XPを先頭に表示してCTAタップ率を改善する。");
  }
  if (flagged.has("Paid Plan Conversion 7d")) {
    actions.push("shop_open_from_energy→checkout_start の遷移率を改善するため、購読価値訴求を1画面目に集約する。");
  }
  if (flagged.has("D1 Retention") || flagged.has("D1 Retention 7d") || flagged.has("D7 Retention") || flagged.has("D7 Retention 7d")) {
    actions.push("初回〜3日目の復帰導線（連続日数フィードバック・カレンダー再訪導線）を強化する。");
  }
  if (actions.length === 0) {
    actions.push("主要KPIの悪化は閾値未満。今週はイベント欠損監視とサンプル数増加を優先する。");
    actions.push("checkout_start と plan_changed の件数推移を監視して、課金導線のボトルネックを特定する。");
    actions.push("7日比較を維持し、次の悪化指標が出た時点で単一施策のみ実行する。");
  }

  return actions.slice(0, 3);
}

async function resolveDashboard(config) {
  if (config.dashboardId) {
    return apiRequest(config, "GET", `/api/projects/${config.projectId}/dashboards/${config.dashboardId}/`, undefined);
  }
  const dashboards = await listAll(config, `/api/projects/${config.projectId}/dashboards/?limit=200`);
  const namedCandidates = DASHBOARD_NAMES.flatMap((name) =>
    dashboards.filter((d) => d.name === name)
  );
  if (namedCandidates.length === 0) {
    throw new Error(
      `Dashboard not found. Tried names: ${DASHBOARD_NAMES.join(", ")}. Pass --dashboard-id if needed.`
    );
  }

  const allInsights = await listAll(config, `/api/projects/${config.projectId}/insights/?limit=500`);
  const requiredSet = new Set(REQUIRED_INSIGHTS);
  const coverageByDashboard = new Map();

  for (const insight of allInsights) {
    if (!requiredSet.has(insight.name)) continue;
    const linkedDashboards = Array.isArray(insight.dashboards) ? insight.dashboards : [];
    for (const dashboardId of linkedDashboards) {
      const key = String(dashboardId);
      if (!coverageByDashboard.has(key)) {
        coverageByDashboard.set(key, new Set());
      }
      coverageByDashboard.get(key).add(insight.name);
    }
  }

  const sortedCandidates = namedCandidates
    .map((d) => {
      const covered = coverageByDashboard.get(String(d.id));
      return {
        dashboard: d,
        score: covered ? covered.size : 0,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(b.dashboard.id || 0) - Number(a.dashboard.id || 0);
    });

  const selected = sortedCandidates[0]?.dashboard;
  if (!selected?.id) {
    throw new Error(
      `Dashboard not found. Tried names: ${DASHBOARD_NAMES.join(", ")}. Pass --dashboard-id if needed.`
    );
  }
  return apiRequest(config, "GET", `/api/projects/${config.projectId}/dashboards/${selected.id}/`, undefined);
}

async function collectInsightMap(config, dashboard) {
  const tiles = Array.isArray(dashboard.tiles) ? dashboard.tiles : [];
  const insightByName = new Map();
  for (const tile of tiles) {
    if (tile?.insight?.name && tile?.insight?.id) {
      insightByName.set(tile.insight.name, tile.insight.id);
    }
  }

  const missingFromTiles = REQUIRED_INSIGHTS.filter((name) => !insightByName.has(name));
  if (missingFromTiles.length > 0) {
    const allInsights = await listAll(config, `/api/projects/${config.projectId}/insights/?limit=500`);
    const dashboardIdKey = String(dashboard.id);
    for (const insight of allInsights) {
      if (!REQUIRED_INSIGHTS.includes(insight.name) && !OPTIONAL_INSIGHTS.includes(insight.name)) continue;
      const dashboards = Array.isArray(insight.dashboards) ? insight.dashboards : [];
      const dashboardKeys = dashboards.map((d) => String(d));
      if (dashboardKeys.includes(dashboardIdKey)) {
        insightByName.set(insight.name, insight.id);
      }
    }
  }

  return insightByName;
}

async function main() {
  const config = buildConfig();
  const tuningTargets = loadTuningTargets();
  if (!config.token || !config.projectId) {
    throw new Error(
      "Missing required credentials (POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID). Run: npm run analytics:posthog:setup"
    );
  }

  let dashboard = await resolveDashboard(config);
  let insightByName = await collectInsightMap(config, dashboard);
  let missing = REQUIRED_INSIGHTS.filter((name) => !insightByName.has(name));

  // If stale dashboard id came from env, auto-fallback to latest named dashboard.
  if (missing.length > 0 && config.dashboardIdFromEnv) {
    const fallbackDashboard = await resolveDashboard({ ...config, dashboardId: "" });
    const fallbackInsights = await collectInsightMap(config, fallbackDashboard);
    const fallbackMissing = REQUIRED_INSIGHTS.filter((name) => !fallbackInsights.has(name));
    if (fallbackMissing.length < missing.length) {
      dashboard = fallbackDashboard;
      insightByName = fallbackInsights;
      missing = fallbackMissing;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required insights: ${missing.join(", ")}`
    );
  }

  const insights = {};
  for (const name of REQUIRED_INSIGHTS) {
    const id = insightByName.get(name);
    insights[name] = await apiRequest(
      config,
      "GET",
      `/api/projects/${config.projectId}/insights/${id}/?refresh=blocking`,
      undefined
    );
  }
  for (const name of OPTIONAL_INSIGHTS) {
    const id = insightByName.get(name);
    if (!id) continue;
    insights[name] = await apiRequest(
      config,
      "GET",
      `/api/projects/${config.projectId}/insights/${id}/?refresh=blocking`,
      undefined
    );
  }

  const dauTrend = parseTrendInsight(insights["DAU (session_start UV)"]);
  const days = [...dauTrend.combined.keys()].sort();
  if (days.length < 14) {
    throw new Error("Not enough daily points (need at least 14 days).");
  }

  const latestDay = days[days.length - 1];
  const anchorDay = offsetDay(latestDay, -1); // use yesterday as stable day
  const currentStart = offsetDay(anchorDay, -6);
  const previousStart = offsetDay(anchorDay, -13);
  const previousEnd = offsetDay(anchorDay, -7);

  const lessonTrend = parseTrendInsight(insights["Lesson Start vs Complete (UV)"]);
  const lessonStartUV = pickSeries(lessonTrend.seriesMap, ["lesson_start"]);
  const lessonCompleteUV = pickSeries(lessonTrend.seriesMap, ["lesson_complete"]);
  const lessonCompleteUserTrend = parseTrendInsight(insights["Lesson Complete Users vs DAU (UV)"]);
  const lessonCompleteUsersUV = pickSeries(lessonCompleteUserTrend.seriesMap, ["lesson_complete"]);
  const lessonCompleteSessionStartUV = pickSeries(lessonCompleteUserTrend.seriesMap, ["session_start"]);
  const interventionFunnelTrend = parseTrendInsight(insights["Intervention Funnel (daily)"]);
  const interventionShown = pickSeries(interventionFunnelTrend.seriesMap, ["intervention_shown"]);
  const recoveryMissionTrend = parseTrendInsight(insights["Recovery Mission (daily)"]);
  const recoveryMissionShown = pickSeries(recoveryMissionTrend.seriesMap, ["recovery_mission_shown"]);
  const recoveryMissionClaimed = pickSeries(recoveryMissionTrend.seriesMap, ["recovery_mission_claimed"]);
  const streakGuardTrend = parseTrendInsight(insights["Streak Guard (daily)"]);
  const streakGuardShown = pickSeries(streakGuardTrend.seriesMap, ["streak_guard_shown"]);
  const streakGuardClicked = pickSeries(streakGuardTrend.seriesMap, ["streak_guard_clicked"]);
  const streakGuardSaved = pickSeries(streakGuardTrend.seriesMap, ["streak_guard_saved"]);
  const streakVisibilityTrend = insights["Streak Visibility (daily)"]
    ? parseTrendInsight(insights["Streak Visibility (daily)"])
    : { seriesMap: new Map(), combined: new Map() };
  const streakVisibilityShown = pickSeries(streakVisibilityTrend.seriesMap, ["streak_visibility_shown"]);
  const streakVisibilityClicked = pickSeries(streakVisibilityTrend.seriesMap, ["streak_visibility_clicked"]);
  const streakGuardByDaypartTrend = insights["Streak Guard by Daypart (daily)"]
    ? parseTrendInsight(insights["Streak Guard by Daypart (daily)"])
    : { seriesMap: new Map(), combined: new Map() };
  const streakGuardShownEvening = pickSeriesAllTokens(streakGuardByDaypartTrend.seriesMap, ["streak_guard_shown", "evening"]);
  const streakGuardSavedEvening = pickSeriesAllTokens(streakGuardByDaypartTrend.seriesMap, ["streak_guard_saved", "evening"]);
  const leagueBoundaryTrend = parseTrendInsight(insights["League Boundary (daily)"]);
  const leagueBoundaryShown = pickSeries(leagueBoundaryTrend.seriesMap, ["league_boundary_shown"]);
  const leagueBoundaryClicked = pickSeries(leagueBoundaryTrend.seriesMap, ["league_boundary_clicked"]);
  const leagueSprintTrend = insights["League Sprint (daily)"]
    ? parseTrendInsight(insights["League Sprint (daily)"])
    : { seriesMap: new Map(), combined: new Map() };
  const leagueSprintShown = pickSeries(leagueSprintTrend.seriesMap, ["league_sprint_shown"]);
  const leagueSprintClicked = pickSeries(leagueSprintTrend.seriesMap, ["league_sprint_clicked"]);
  const actionJournalTrend = parseTrendInsight(insights["Action Journal (daily)"]);
  const actionJournalSubmittedTotal = pickSeries(actionJournalTrend.seriesMap, ["action_journal_submitted"]);
  const actionJournalSubmittedNotTried = pickSeries(actionJournalTrend.seriesMap, ["not_tried"]);
  const actionJournalSubmittedUv = pickSeries(actionJournalTrend.seriesMap, ["_uv"]);
  const actionJournalQualityTrend = insights["Action Journal Quality (daily)"]
    ? parseTrendInsight(insights["Action Journal Quality (daily)"])
    : { seriesMap: new Map(), combined: new Map() };
  const actionJournalTop2 = pickSeries(actionJournalQualityTrend.seriesMap, ["top2"]);
  const questProgressTrend = insights["Quest Progress (daily)"]
    ? parseTrendInsight(insights["Quest Progress (daily)"])
    : { seriesMap: new Map(), combined: new Map() };
  const questRewardClaimed = pickSeries(questProgressTrend.seriesMap, ["quest_reward_claimed"]);
  const questBundleCompletedDaily = pickSeriesAllTokens(questProgressTrend.seriesMap, ["quest_bundle_completed", "daily"]);
  const xpBoostTrend = insights["XP Boost (daily)"]
    ? parseTrendInsight(insights["XP Boost (daily)"])
    : { seriesMap: new Map(), combined: new Map() };
  const xpBoostTicketGranted = pickSeries(xpBoostTrend.seriesMap, ["xp_boost_ticket_granted"]);
  const xpBoostStarted = pickSeries(xpBoostTrend.seriesMap, ["xp_boost_started"]);
  const xpBoostApplied = pickSeries(xpBoostTrend.seriesMap, ["xp_boost_applied"]);
  const xpBoostExpired = pickSeries(xpBoostTrend.seriesMap, ["xp_boost_expired"]);
  const xpBoostBonusSum = pickSeries(xpBoostTrend.seriesMap, ["bonus_sum"]);

  const incorrectTrend = parseTrendInsight(insights["Incorrect vs Lesson Start (daily)"]);
  const incorrectCount = pickSeries(incorrectTrend.seriesMap, ["question_incorrect"]);
  const incorrectLessonStart = pickSeries(incorrectTrend.seriesMap, ["lesson_start"]);

  const energyTrend = parseTrendInsight(insights["Energy Friction (daily)"]);
  const energyLessonStart = pickSeries(energyTrend.seriesMap, ["lesson_start"]);
  const energyBlocked = pickSeries(energyTrend.seriesMap, ["energy_blocked"]);
  const energyShopOpened = pickSeries(energyTrend.seriesMap, ["shop_open_from_energy"]);

  const streakLostTrend = parseTrendInsight(insights["Streak Lost Users (daily)"]);
  const checkoutStartTrend = parseTrendInsight(insights["Checkout Starts (daily)"]);
  const paidPlanChangedTrend = parseTrendInsight(insights["Paid Plan Changes (daily)"]);
  const completedSessionsTrend = insights["Completed Sessions (daily)"]
    ? parseTrendInsight(insights["Completed Sessions (daily)"])
    : null;
  const completedSessionsSeries = completedSessionsTrend ? completedSessionsTrend.combined : lessonCompleteUV;
  const completedSessionsSource = completedSessionsTrend
    ? "lesson_complete_total"
    : "lesson_complete_uv_fallback";

  const d1Insight = insights["D1 Retention (session_start)"];
  const d7Insight = insights["D7 Retention (session_start)"];

  const metrics = {
    anchor_day: anchorDay,
    window_current_start: currentStart,
    window_current_end: anchorDay,
    window_previous_start: previousStart,
    window_previous_end: previousEnd,

    dau_yesterday: Number(dauTrend.combined.get(anchorDay) || 0),
    dau_7d_avg: safeRate(sumWindow(dauTrend.combined, currentStart, anchorDay), 7),
    dau_7d_avg_prev: safeRate(sumWindow(dauTrend.combined, previousStart, previousEnd), 7),

    lesson_completion_rate_uv_yesterday: safeRate(
      Number(lessonCompleteUV.get(anchorDay) || 0),
      Number(lessonStartUV.get(anchorDay) || 0)
    ),
    lesson_completion_rate_uv_7d: safeRate(
      sumWindow(lessonCompleteUV, currentStart, anchorDay),
      sumWindow(lessonStartUV, currentStart, anchorDay)
    ),
    lesson_completion_rate_uv_7d_prev: safeRate(
      sumWindow(lessonCompleteUV, previousStart, previousEnd),
      sumWindow(lessonStartUV, previousStart, previousEnd)
    ),
    lesson_complete_user_rate_yesterday: safeRate(
      Number(lessonCompleteUsersUV.get(anchorDay) || 0),
      Number(lessonCompleteSessionStartUV.get(anchorDay) || 0)
    ),
    lesson_complete_user_rate_7d: safeRate(
      sumWindow(lessonCompleteUsersUV, currentStart, anchorDay),
      sumWindow(lessonCompleteSessionStartUV, currentStart, anchorDay)
    ),
    lesson_complete_user_rate_7d_prev: safeRate(
      sumWindow(lessonCompleteUsersUV, previousStart, previousEnd),
      sumWindow(lessonCompleteSessionStartUV, previousStart, previousEnd)
    ),
    intervention_shown_7d: sumWindow(interventionShown, currentStart, anchorDay),
    intervention_shown_7d_prev: sumWindow(interventionShown, previousStart, previousEnd),
    action_journal_submitted_7d: sumWindow(actionJournalSubmittedTotal, currentStart, anchorDay),
    action_journal_submitted_7d_prev: sumWindow(actionJournalSubmittedTotal, previousStart, previousEnd),
    action_journal_not_tried_7d: sumWindow(actionJournalSubmittedNotTried, currentStart, anchorDay),
    action_journal_not_tried_7d_prev: sumWindow(actionJournalSubmittedNotTried, previousStart, previousEnd),
    action_journal_top2_7d: sumWindow(actionJournalTop2, currentStart, anchorDay),
    action_journal_top2_7d_prev: sumWindow(actionJournalTop2, previousStart, previousEnd),
    action_journal_submitted_uv_7d: sumWindow(actionJournalSubmittedUv, currentStart, anchorDay),
    action_journal_submitted_uv_7d_prev: sumWindow(actionJournalSubmittedUv, previousStart, previousEnd),
    journal_post_user_rate_7d: safeRate(
      sumWindow(actionJournalSubmittedUv, currentStart, anchorDay),
      sumWindow(dauTrend.combined, currentStart, anchorDay)
    ),
    journal_post_user_rate_7d_prev: safeRate(
      sumWindow(actionJournalSubmittedUv, previousStart, previousEnd),
      sumWindow(dauTrend.combined, previousStart, previousEnd)
    ),
    journal_not_tried_share_7d: safeRate(
      sumWindow(actionJournalSubmittedNotTried, currentStart, anchorDay),
      sumWindow(actionJournalSubmittedTotal, currentStart, anchorDay)
    ),
    journal_not_tried_share_7d_prev: safeRate(
      sumWindow(actionJournalSubmittedNotTried, previousStart, previousEnd),
      sumWindow(actionJournalSubmittedTotal, previousStart, previousEnd)
    ),
    journal_top2_pick_share_7d: safeRate(
      sumWindow(actionJournalTop2, currentStart, anchorDay),
      sumWindow(actionJournalSubmittedTotal, currentStart, anchorDay)
    ),
    journal_top2_pick_share_7d_prev: safeRate(
      sumWindow(actionJournalTop2, previousStart, previousEnd),
      sumWindow(actionJournalSubmittedTotal, previousStart, previousEnd)
    ),
    quest_reward_claimed_7d: sumWindow(questRewardClaimed, currentStart, anchorDay),
    quest_reward_claimed_7d_prev: sumWindow(questRewardClaimed, previousStart, previousEnd),
    daily_quest_3of3_7d: sumWindow(questBundleCompletedDaily, currentStart, anchorDay),
    daily_quest_3of3_7d_prev: sumWindow(questBundleCompletedDaily, previousStart, previousEnd),
    daily_quest_3of3_rate_7d: safeRate(
      sumWindow(questBundleCompletedDaily, currentStart, anchorDay),
      sumWindow(dauTrend.combined, currentStart, anchorDay)
    ),
    daily_quest_3of3_rate_7d_prev: safeRate(
      sumWindow(questBundleCompletedDaily, previousStart, previousEnd),
      sumWindow(dauTrend.combined, previousStart, previousEnd)
    ),
    xp_boost_ticket_granted_7d: sumWindow(xpBoostTicketGranted, currentStart, anchorDay),
    xp_boost_ticket_granted_7d_prev: sumWindow(xpBoostTicketGranted, previousStart, previousEnd),
    xp_boost_started_7d: sumWindow(xpBoostStarted, currentStart, anchorDay),
    xp_boost_started_7d_prev: sumWindow(xpBoostStarted, previousStart, previousEnd),
    xp_boost_applied_7d: sumWindow(xpBoostApplied, currentStart, anchorDay),
    xp_boost_applied_7d_prev: sumWindow(xpBoostApplied, previousStart, previousEnd),
    xp_boost_expired_7d: sumWindow(xpBoostExpired, currentStart, anchorDay),
    xp_boost_expired_7d_prev: sumWindow(xpBoostExpired, previousStart, previousEnd),
    xp_boost_bonus_xp_7d: sumWindow(xpBoostBonusSum, currentStart, anchorDay),
    xp_boost_bonus_xp_7d_prev: sumWindow(xpBoostBonusSum, previousStart, previousEnd),
    xp_boost_activation_rate_7d: safeRate(
      sumWindow(xpBoostStarted, currentStart, anchorDay),
      sumWindow(xpBoostTicketGranted, currentStart, anchorDay)
    ),
    xp_boost_activation_rate_7d_prev: safeRate(
      sumWindow(xpBoostStarted, previousStart, previousEnd),
      sumWindow(xpBoostTicketGranted, previousStart, previousEnd)
    ),
    xp_boost_bonus_xp_per_user_7d: safeRate(
      sumWindow(xpBoostBonusSum, currentStart, anchorDay),
      sumWindow(xpBoostStarted, currentStart, anchorDay)
    ),
    xp_boost_bonus_xp_per_user_7d_prev: safeRate(
      sumWindow(xpBoostBonusSum, previousStart, previousEnd),
      sumWindow(xpBoostStarted, previousStart, previousEnd)
    ),
    recovery_mission_shown_7d: sumWindow(recoveryMissionShown, currentStart, anchorDay),
    recovery_mission_shown_7d_prev: sumWindow(recoveryMissionShown, previousStart, previousEnd),
    recovery_mission_claimed_7d: sumWindow(recoveryMissionClaimed, currentStart, anchorDay),
    recovery_mission_claimed_7d_prev: sumWindow(recoveryMissionClaimed, previousStart, previousEnd),
    recovery_mission_claim_rate_7d: safeRate(
      sumWindow(recoveryMissionClaimed, currentStart, anchorDay),
      sumWindow(recoveryMissionShown, currentStart, anchorDay)
    ),
    recovery_mission_claim_rate_7d_prev: safeRate(
      sumWindow(recoveryMissionClaimed, previousStart, previousEnd),
      sumWindow(recoveryMissionShown, previousStart, previousEnd)
    ),
    streak_guard_shown_7d: sumWindow(streakGuardShown, currentStart, anchorDay),
    streak_guard_shown_7d_prev: sumWindow(streakGuardShown, previousStart, previousEnd),
    streak_guard_clicked_7d: sumWindow(streakGuardClicked, currentStart, anchorDay),
    streak_guard_clicked_7d_prev: sumWindow(streakGuardClicked, previousStart, previousEnd),
    streak_guard_saved_7d: sumWindow(streakGuardSaved, currentStart, anchorDay),
    streak_guard_saved_7d_prev: sumWindow(streakGuardSaved, previousStart, previousEnd),
    streak_guard_click_rate_7d: safeRate(
      sumWindow(streakGuardClicked, currentStart, anchorDay),
      sumWindow(streakGuardShown, currentStart, anchorDay)
    ),
    streak_guard_click_rate_7d_prev: safeRate(
      sumWindow(streakGuardClicked, previousStart, previousEnd),
      sumWindow(streakGuardShown, previousStart, previousEnd)
    ),
    streak_guard_save_rate_7d: safeRate(
      sumWindow(streakGuardSaved, currentStart, anchorDay),
      sumWindow(streakGuardShown, currentStart, anchorDay)
    ),
    streak_guard_save_rate_7d_prev: safeRate(
      sumWindow(streakGuardSaved, previousStart, previousEnd),
      sumWindow(streakGuardShown, previousStart, previousEnd)
    ),
    streak_guard_evening_shown_7d: sumWindow(streakGuardShownEvening, currentStart, anchorDay),
    streak_guard_evening_shown_7d_prev: sumWindow(streakGuardShownEvening, previousStart, previousEnd),
    streak_guard_evening_saved_7d: sumWindow(streakGuardSavedEvening, currentStart, anchorDay),
    streak_guard_evening_saved_7d_prev: sumWindow(streakGuardSavedEvening, previousStart, previousEnd),
    streak_guard_evening_save_rate_7d: safeRate(
      sumWindow(streakGuardSavedEvening, currentStart, anchorDay),
      sumWindow(streakGuardShownEvening, currentStart, anchorDay)
    ),
    streak_guard_evening_save_rate_7d_prev: safeRate(
      sumWindow(streakGuardSavedEvening, previousStart, previousEnd),
      sumWindow(streakGuardShownEvening, previousStart, previousEnd)
    ),
    streak_visibility_shown_7d: sumWindow(streakVisibilityShown, currentStart, anchorDay),
    streak_visibility_shown_7d_prev: sumWindow(streakVisibilityShown, previousStart, previousEnd),
    streak_visibility_clicked_7d: sumWindow(streakVisibilityClicked, currentStart, anchorDay),
    streak_visibility_clicked_7d_prev: sumWindow(streakVisibilityClicked, previousStart, previousEnd),
    streak_visibility_click_rate_7d: safeRate(
      sumWindow(streakVisibilityClicked, currentStart, anchorDay),
      sumWindow(streakVisibilityShown, currentStart, anchorDay)
    ),
    streak_visibility_click_rate_7d_prev: safeRate(
      sumWindow(streakVisibilityClicked, previousStart, previousEnd),
      sumWindow(streakVisibilityShown, previousStart, previousEnd)
    ),
    league_boundary_shown_7d: sumWindow(leagueBoundaryShown, currentStart, anchorDay),
    league_boundary_shown_7d_prev: sumWindow(leagueBoundaryShown, previousStart, previousEnd),
    league_boundary_clicked_7d: sumWindow(leagueBoundaryClicked, currentStart, anchorDay),
    league_boundary_clicked_7d_prev: sumWindow(leagueBoundaryClicked, previousStart, previousEnd),
    league_boundary_click_rate_7d: safeRate(
      sumWindow(leagueBoundaryClicked, currentStart, anchorDay),
      sumWindow(leagueBoundaryShown, currentStart, anchorDay)
    ),
    league_boundary_click_rate_7d_prev: safeRate(
      sumWindow(leagueBoundaryClicked, previousStart, previousEnd),
      sumWindow(leagueBoundaryShown, previousStart, previousEnd)
    ),
    league_sprint_shown_7d: sumWindow(leagueSprintShown, currentStart, anchorDay),
    league_sprint_shown_7d_prev: sumWindow(leagueSprintShown, previousStart, previousEnd),
    league_sprint_clicked_7d: sumWindow(leagueSprintClicked, currentStart, anchorDay),
    league_sprint_clicked_7d_prev: sumWindow(leagueSprintClicked, previousStart, previousEnd),
    league_sprint_click_rate_7d: safeRate(
      sumWindow(leagueSprintClicked, currentStart, anchorDay),
      sumWindow(leagueSprintShown, currentStart, anchorDay)
    ),
    league_sprint_click_rate_7d_prev: safeRate(
      sumWindow(leagueSprintClicked, previousStart, previousEnd),
      sumWindow(leagueSprintShown, previousStart, previousEnd)
    ),

    incorrect_per_lesson_start_yesterday: safeRate(
      Number(incorrectCount.get(anchorDay) || 0),
      Number(incorrectLessonStart.get(anchorDay) || 0)
    ),
    incorrect_per_lesson_start_7d: safeRate(
      sumWindow(incorrectCount, currentStart, anchorDay),
      sumWindow(incorrectLessonStart, currentStart, anchorDay)
    ),
    incorrect_per_lesson_start_7d_prev: safeRate(
      sumWindow(incorrectCount, previousStart, previousEnd),
      sumWindow(incorrectLessonStart, previousStart, previousEnd)
    ),

    energy_block_rate_yesterday: safeRate(
      Number(energyBlocked.get(anchorDay) || 0),
      Number(energyLessonStart.get(anchorDay) || 0)
    ),
    energy_block_rate_7d: safeRate(
      sumWindow(energyBlocked, currentStart, anchorDay),
      sumWindow(energyLessonStart, currentStart, anchorDay)
    ),
    energy_block_rate_7d_prev: safeRate(
      sumWindow(energyBlocked, previousStart, previousEnd),
      sumWindow(energyLessonStart, previousStart, previousEnd)
    ),

    energy_shop_intent_yesterday: safeRate(
      Number(energyShopOpened.get(anchorDay) || 0),
      Number(energyBlocked.get(anchorDay) || 0)
    ),
    energy_shop_intent_7d: safeRate(
      sumWindow(energyShopOpened, currentStart, anchorDay),
      sumWindow(energyBlocked, currentStart, anchorDay)
    ),
    energy_shop_intent_7d_prev: safeRate(
      sumWindow(energyShopOpened, previousStart, previousEnd),
      sumWindow(energyBlocked, previousStart, previousEnd)
    ),

    streak_lost_users_7d: sumWindow(streakLostTrend.combined, currentStart, anchorDay),
    streak_lost_users_7d_prev: sumWindow(streakLostTrend.combined, previousStart, previousEnd),

    d1_retention_rate_7d: retentionRateForWindow(d1Insight, 1, currentStart, anchorDay),
    d1_retention_rate_7d_prev: retentionRateForWindow(d1Insight, 1, previousStart, previousEnd),
    d7_retention_rate_7d: retentionRateForWindow(d7Insight, 7, currentStart, anchorDay),
    d7_retention_rate_7d_prev: retentionRateForWindow(d7Insight, 7, previousStart, previousEnd),

    checkout_start_7d: sumWindow(checkoutStartTrend.combined, currentStart, anchorDay),
    checkout_start_7d_prev: sumWindow(checkoutStartTrend.combined, previousStart, previousEnd),
    paid_plan_changes_7d: sumWindow(paidPlanChangedTrend.combined, currentStart, anchorDay),
    paid_plan_changes_7d_prev: sumWindow(paidPlanChangedTrend.combined, previousStart, previousEnd),
    paid_plan_changes_per_checkout_7d: safeRate(
      sumWindow(paidPlanChangedTrend.combined, currentStart, anchorDay),
      sumWindow(checkoutStartTrend.combined, currentStart, anchorDay)
    ),
    paid_plan_changes_per_checkout_7d_prev: safeRate(
      sumWindow(paidPlanChangedTrend.combined, previousStart, previousEnd),
      sumWindow(checkoutStartTrend.combined, previousStart, previousEnd)
    ),

    completed_sessions_source: completedSessionsSource,
    completed_sessions_yesterday: Number(completedSessionsSeries.get(anchorDay) || 0),
    completed_sessions_per_day_7d: safeRate(
      sumWindow(completedSessionsSeries, currentStart, anchorDay),
      7
    ),
    completed_sessions_per_day_7d_prev: safeRate(
      sumWindow(completedSessionsSeries, previousStart, previousEnd),
      7
    ),
  };

  const anomalies = buildAnomalies(metrics, tuningTargets.anomaly_worsening_threshold);
  const targetBreaches = buildTargetBreaches(metrics, tuningTargets);
  const actions = buildRecommendedActions(anomalies, targetBreaches);
  const primaryKpis = {
    d7_retention_rate_7d: metrics.d7_retention_rate_7d,
    d7_retention_rate_7d_prev: metrics.d7_retention_rate_7d_prev,
    paid_plan_changes_per_checkout_7d: metrics.paid_plan_changes_per_checkout_7d,
    paid_plan_changes_per_checkout_7d_prev: metrics.paid_plan_changes_per_checkout_7d_prev,
    lesson_complete_user_rate_7d: metrics.lesson_complete_user_rate_7d,
    lesson_complete_user_rate_7d_prev: metrics.lesson_complete_user_rate_7d_prev,
    journal_post_user_rate_7d: metrics.journal_post_user_rate_7d,
    journal_post_user_rate_7d_prev: metrics.journal_post_user_rate_7d_prev,
  };

  const output = {
    dashboard_id: dashboard.id,
    dashboard_name: dashboard.name,
    primary_kpi_keys: PRIMARY_KPI_KEYS,
    primary_kpis: primaryKpis,
    metrics,
    tuning_targets: tuningTargets,
    anomalies,
    target_breaches: targetBreaches,
    recommended_actions: actions,
  };

  if (config.jsonOnly) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(`Psycle KPI Report (${anchorDay})`);
  console.log(`Dashboard: ${dashboard.name} (id=${dashboard.id})`);
  console.log(`Window: ${currentStart}..${anchorDay} vs ${previousStart}..${previousEnd}`);
  console.log("");
  console.log("Primary KPIs");
  console.log(
    `- D7 Retention 7d: ${formatPct(metrics.d7_retention_rate_7d, 2)} (prev ${formatPct(metrics.d7_retention_rate_7d_prev, 2)})`
  );
  console.log(
    `- Paid Plan Conversion 7d: ${formatPct(metrics.paid_plan_changes_per_checkout_7d, 2)} (prev ${formatPct(metrics.paid_plan_changes_per_checkout_7d_prev, 2)})`
  );
  console.log(
    `- Lesson Complete User Rate 7d: ${formatPct(metrics.lesson_complete_user_rate_7d, 2)} (prev ${formatPct(metrics.lesson_complete_user_rate_7d_prev, 2)})`
  );
  console.log(
    `- Journal Post User Rate 7d: ${formatPct(metrics.journal_post_user_rate_7d, 2)} (prev ${formatPct(metrics.journal_post_user_rate_7d_prev, 2)})`
  );
  console.log("");
  console.log(`DAU(yesterday): ${formatNum(metrics.dau_yesterday, 0)}`);
  console.log(
    `Lesson Completion Rate 7d: ${formatPct(metrics.lesson_completion_rate_uv_7d, 2)} (prev ${formatPct(metrics.lesson_completion_rate_uv_7d_prev, 2)})`
  );
  console.log(
    `Lesson Complete User Rate 7d: ${formatPct(metrics.lesson_complete_user_rate_7d, 2)} (prev ${formatPct(metrics.lesson_complete_user_rate_7d_prev, 2)})`
  );
  console.log(
    `Journal Post User Rate 7d: ${formatPct(metrics.journal_post_user_rate_7d, 2)} (prev ${formatPct(metrics.journal_post_user_rate_7d_prev, 2)})`
  );
  console.log(
    `Journal Not Tried Share 7d: ${formatPct(metrics.journal_not_tried_share_7d, 2)} (prev ${formatPct(metrics.journal_not_tried_share_7d_prev, 2)})`
  );
  console.log(
    `Journal Top2 Pick Share 7d: ${formatPct(metrics.journal_top2_pick_share_7d, 2)} (prev ${formatPct(metrics.journal_top2_pick_share_7d_prev, 2)})`
  );
  console.log(
    `Action Journal 7d: total=${formatNum(metrics.action_journal_submitted_7d, 0)} not_tried=${formatNum(metrics.action_journal_not_tried_7d, 0)} top2=${formatNum(metrics.action_journal_top2_7d, 0)} uv=${formatNum(metrics.action_journal_submitted_uv_7d, 0)}`
  );
  console.log(
    `Daily Quest 3/3 Rate 7d: ${formatPct(metrics.daily_quest_3of3_rate_7d, 2)} (prev ${formatPct(metrics.daily_quest_3of3_rate_7d_prev, 2)})`
  );
  console.log(
    `Quest Progress 7d: claimed=${formatNum(metrics.quest_reward_claimed_7d, 0)} daily3of3=${formatNum(metrics.daily_quest_3of3_7d, 0)}`
  );
  console.log(
    `XP Boost Activation Rate 7d: ${formatPct(metrics.xp_boost_activation_rate_7d, 2)} (prev ${formatPct(metrics.xp_boost_activation_rate_7d_prev, 2)})`
  );
  console.log(
    `XP Boost Bonus XP/User 7d: ${formatNum(metrics.xp_boost_bonus_xp_per_user_7d, 2)} (prev ${formatNum(metrics.xp_boost_bonus_xp_per_user_7d_prev, 2)})`
  );
  console.log(
    `XP Boost 7d: granted=${formatNum(metrics.xp_boost_ticket_granted_7d, 0)} started=${formatNum(metrics.xp_boost_started_7d, 0)} applied=${formatNum(metrics.xp_boost_applied_7d, 0)} expired=${formatNum(metrics.xp_boost_expired_7d, 0)} bonusXp=${formatNum(metrics.xp_boost_bonus_xp_7d, 0)}`
  );
  console.log(
    `Intervention Exposure 7d: shown=${formatNum(metrics.intervention_shown_7d, 0)}`
  );
  console.log(
    `Recovery Mission Claim Rate 7d: ${formatPct(metrics.recovery_mission_claim_rate_7d, 2)} (prev ${formatPct(metrics.recovery_mission_claim_rate_7d_prev, 2)})`
  );
  console.log(
    `Recovery Mission 7d: shown=${formatNum(metrics.recovery_mission_shown_7d, 0)} claimed=${formatNum(metrics.recovery_mission_claimed_7d, 0)}`
  );
  console.log(
    `Streak Guard Click Rate 7d: ${formatPct(metrics.streak_guard_click_rate_7d, 2)} (prev ${formatPct(metrics.streak_guard_click_rate_7d_prev, 2)})`
  );
  console.log(
    `Streak Guard Save Rate 7d: ${formatPct(metrics.streak_guard_save_rate_7d, 2)} (prev ${formatPct(metrics.streak_guard_save_rate_7d_prev, 2)})`
  );
  console.log(
    `Streak Guard Evening Save Rate 7d: ${formatPct(metrics.streak_guard_evening_save_rate_7d, 2)} (prev ${formatPct(metrics.streak_guard_evening_save_rate_7d_prev, 2)})`
  );
  console.log(
    `Streak Guard 7d: shown=${formatNum(metrics.streak_guard_shown_7d, 0)} clicked=${formatNum(metrics.streak_guard_clicked_7d, 0)} saved=${formatNum(metrics.streak_guard_saved_7d, 0)}`
  );
  console.log(
    `Streak Visibility Click Rate 7d: ${formatPct(metrics.streak_visibility_click_rate_7d, 2)} (prev ${formatPct(metrics.streak_visibility_click_rate_7d_prev, 2)})`
  );
  console.log(
    `Streak Visibility 7d: shown=${formatNum(metrics.streak_visibility_shown_7d, 0)} clicked=${formatNum(metrics.streak_visibility_clicked_7d, 0)}`
  );
  console.log(
    `League Boundary Click Rate 7d: ${formatPct(metrics.league_boundary_click_rate_7d, 2)} (prev ${formatPct(metrics.league_boundary_click_rate_7d_prev, 2)})`
  );
  console.log(
    `League Boundary 7d: shown=${formatNum(metrics.league_boundary_shown_7d, 0)} clicked=${formatNum(metrics.league_boundary_clicked_7d, 0)}`
  );
  console.log(
    `League Sprint Click Rate 7d: ${formatPct(metrics.league_sprint_click_rate_7d, 2)} (prev ${formatPct(metrics.league_sprint_click_rate_7d_prev, 2)})`
  );
  console.log(
    `League Sprint 7d: shown=${formatNum(metrics.league_sprint_shown_7d, 0)} clicked=${formatNum(metrics.league_sprint_clicked_7d, 0)}`
  );
  console.log(
    `Incorrect/Start 7d: ${formatNum(metrics.incorrect_per_lesson_start_7d, 3)} (prev ${formatNum(metrics.incorrect_per_lesson_start_7d_prev, 3)})`
  );
  console.log(
    `Energy Block Rate 7d: ${formatPct(metrics.energy_block_rate_7d, 2)} (prev ${formatPct(metrics.energy_block_rate_7d_prev, 2)})`
  );
  console.log(
    `Energy Shop Intent 7d: ${formatPct(metrics.energy_shop_intent_7d, 2)} (prev ${formatPct(metrics.energy_shop_intent_7d_prev, 2)})`
  );
  console.log(
    `D1 Retention 7d: ${formatPct(metrics.d1_retention_rate_7d, 2)} (prev ${formatPct(metrics.d1_retention_rate_7d_prev, 2)})`
  );
  console.log(
    `D7 Retention 7d: ${formatPct(metrics.d7_retention_rate_7d, 2)} (prev ${formatPct(metrics.d7_retention_rate_7d_prev, 2)})`
  );
  console.log(
    `Checkout Starts 7d: ${formatNum(metrics.checkout_start_7d, 0)} (prev ${formatNum(metrics.checkout_start_7d_prev, 0)})`
  );
  console.log(
    `Paid Plan Changes 7d: ${formatNum(metrics.paid_plan_changes_7d, 0)} (prev ${formatNum(metrics.paid_plan_changes_7d_prev, 0)})`
  );
  console.log(
    `Paid Plan Conversion 7d: ${formatPct(metrics.paid_plan_changes_per_checkout_7d, 2)} (prev ${formatPct(metrics.paid_plan_changes_per_checkout_7d_prev, 2)})`
  );
  console.log(
    `Lesson Complete User Rate(yesterday): ${formatPct(metrics.lesson_complete_user_rate_yesterday, 2)}`
  );
  console.log(
    `Completed Sessions(yesterday): ${formatNum(metrics.completed_sessions_yesterday, 0)} [source=${metrics.completed_sessions_source}]`
  );
  console.log("");
  if (anomalies.length === 0) {
    console.log(`Anomalies (>=${formatNum(tuningTargets.anomaly_worsening_threshold * 100, 0)}% worsening): none`);
  } else {
    console.log(`Anomalies (>=${formatNum(tuningTargets.anomaly_worsening_threshold * 100, 0)}% worsening):`);
    anomalies.forEach((a) => {
      const deltaPct = formatNum(a.delta * 100, 1);
      console.log(`- ${a.metric}: ${formatNum(a.current, 4)} vs ${formatNum(a.previous, 4)} (${deltaPct}%)`);
    });
  }
  console.log("");
  if (targetBreaches.length === 0) {
    console.log("Target Breaches: none");
  } else {
    console.log("Target Breaches:");
    targetBreaches.forEach((b) => {
      const isRatio = b.unit === "ratio";
      const currentText = isRatio ? `${formatNum(b.current * 100, 2)}%` : formatNum(b.current, 2);
      const targetText = isRatio ? `${formatNum(b.target * 100, 2)}%` : formatNum(b.target, 2);
      const sign = b.mode === "min" ? "<" : ">";
      console.log(`- ${b.metric}: ${currentText} ${sign} target ${targetText}`);
    });
  }
  console.log("");
  console.log("Recommended Actions:");
  actions.forEach((a, i) => {
    console.log(`${i + 1}. ${a}`);
  });
}

main().catch((error) => {
  console.error("Failed to generate KPI report.");
  console.error(error.message || error);
  if (error.payload) {
    console.error("API payload:");
    console.error(JSON.stringify(error.payload, null, 2));
  }
  process.exit(1);
});
