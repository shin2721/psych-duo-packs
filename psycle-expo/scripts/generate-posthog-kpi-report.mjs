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

const DEFAULT_HOST = "https://app.posthog.com";
const DASHBOARD_NAMES = [
  "Psycle Growth Dashboard (v1.6)",
  "Psycle Growth Dashboard (v1.5)",
];

const REQUIRED_INSIGHTS = [
  "DAU (session_start UV)",
  "Lesson Start vs Complete (UV)",
  "Incorrect vs Lesson Start (daily)",
  "Streak Lost Users (daily)",
  "Energy Friction (daily)",
  "D1 Retention (session_start)",
  "D7 Retention (session_start)",
  "Checkout Starts (daily)",
  "Paid Plan Changes (daily)",
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
  const { flags, options } = parseArgs(process.argv.slice(2));
  return {
    host: normalizeHost(options["--host"] || process.env.POSTHOG_HOST || DEFAULT_HOST),
    token: options["--token"] || process.env.POSTHOG_PERSONAL_API_KEY || "",
    projectId: options["--project"] || process.env.POSTHOG_PROJECT_ID || "",
    dashboardId: options["--dashboard-id"] || process.env.POSTHOG_DASHBOARD_ID || "",
    jsonOnly: flags.has("--json"),
  };
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

function buildAnomalies(metrics) {
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
  ];

  const anomalies = [];
  for (const c of checks) {
    const current = metrics[c.key];
    const previous = metrics[`${c.key}_prev`];
    if (current == null || previous == null || previous === 0) continue;
    const delta = pctChange(current, previous);
    if (delta == null) continue;
    const worsened = c.higherIsBetter ? delta <= -0.2 : delta >= 0.2;
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

function buildRecommendedActions(anomalies) {
  const actions = [];
  const has = (name) => anomalies.some((a) => a.metric === name);

  if (has("Lesson Completion Rate") || has("Incorrect Per Lesson Start")) {
    actions.push("レッスン冒頭10問を易化し、誤答時ヒントを必ず表示する。");
  }
  if (has("Energy Block Rate") || has("Energy Shop Intent")) {
    actions.push("無料プランの回復速度またはボーナス回復確率を微調整し、エネルギー不足時CTA文言をA/Bする。");
  }
  if (has("D1 Retention") || has("D7 Retention")) {
    actions.push("初回〜3日目の復帰導線（1問クイック再開導線）を追加して通知タイミングを最適化する。");
  }
  if (actions.length === 0) {
    actions.push("主要KPIの悪化は20%未満。今週はイベント欠損監視とサンプル数増加を優先する。");
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
  for (const name of DASHBOARD_NAMES) {
    const found = dashboards.find((d) => d.name === name);
    if (found) {
      return apiRequest(config, "GET", `/api/projects/${config.projectId}/dashboards/${found.id}/`, undefined);
    }
  }
  throw new Error(
    `Dashboard not found. Tried names: ${DASHBOARD_NAMES.join(", ")}. Pass --dashboard-id if needed.`
  );
}

async function main() {
  const config = buildConfig();
  if (!config.token || !config.projectId) {
    throw new Error("Missing required credentials (POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID).");
  }

  const dashboard = await resolveDashboard(config);
  const tiles = Array.isArray(dashboard.tiles) ? dashboard.tiles : [];
  const insightByName = new Map();
  for (const tile of tiles) {
    if (tile?.insight?.name && tile?.insight?.id) {
      insightByName.set(tile.insight.name, tile.insight.id);
    }
  }

  // Fallback: tile反映が遅い場合はinsights一覧からdashboard紐付けで補完する。
  if (insightByName.size < REQUIRED_INSIGHTS.length) {
    const allInsights = await listAll(config, `/api/projects/${config.projectId}/insights/?limit=500`);
    for (const insight of allInsights) {
      if (!REQUIRED_INSIGHTS.includes(insight.name)) continue;
      const dashboards = Array.isArray(insight.dashboards) ? insight.dashboards : [];
      if (dashboards.includes(dashboard.id)) {
        insightByName.set(insight.name, insight.id);
      }
    }
  }

  const missing = REQUIRED_INSIGHTS.filter((name) => !insightByName.has(name));
  if (missing.length > 0) {
    throw new Error(`Missing required insights: ${missing.join(", ")}`);
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
  };

  const anomalies = buildAnomalies(metrics);
  const actions = buildRecommendedActions(anomalies);

  const output = {
    dashboard_id: dashboard.id,
    dashboard_name: dashboard.name,
    metrics,
    anomalies,
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
  console.log(`DAU(yesterday): ${formatNum(metrics.dau_yesterday, 0)}`);
  console.log(
    `Lesson Completion Rate 7d: ${formatNum(metrics.lesson_completion_rate_uv_7d * 100, 2)}% (prev ${formatNum(metrics.lesson_completion_rate_uv_7d_prev * 100, 2)}%)`
  );
  console.log(
    `Incorrect/Start 7d: ${formatNum(metrics.incorrect_per_lesson_start_7d, 3)} (prev ${formatNum(metrics.incorrect_per_lesson_start_7d_prev, 3)})`
  );
  console.log(
    `Energy Block Rate 7d: ${formatNum(metrics.energy_block_rate_7d * 100, 2)}% (prev ${formatNum(metrics.energy_block_rate_7d_prev * 100, 2)}%)`
  );
  console.log(
    `Energy Shop Intent 7d: ${formatNum(metrics.energy_shop_intent_7d * 100, 2)}% (prev ${formatNum(metrics.energy_shop_intent_7d_prev * 100, 2)}%)`
  );
  console.log(
    `D1 Retention 7d: ${formatNum(metrics.d1_retention_rate_7d * 100, 2)}% (prev ${formatNum(metrics.d1_retention_rate_7d_prev * 100, 2)}%)`
  );
  console.log(
    `D7 Retention 7d: ${formatNum(metrics.d7_retention_rate_7d * 100, 2)}% (prev ${formatNum(metrics.d7_retention_rate_7d_prev * 100, 2)}%)`
  );
  console.log(
    `Checkout Starts 7d: ${formatNum(metrics.checkout_start_7d, 0)} (prev ${formatNum(metrics.checkout_start_7d_prev, 0)})`
  );
  console.log(
    `Paid Plan Changes 7d: ${formatNum(metrics.paid_plan_changes_7d, 0)} (prev ${formatNum(metrics.paid_plan_changes_7d_prev, 0)})`
  );
  console.log("");
  if (anomalies.length === 0) {
    console.log("Anomalies (>=20% worsening): none");
  } else {
    console.log("Anomalies (>=20% worsening):");
    anomalies.forEach((a) => {
      const deltaPct = formatNum(a.delta * 100, 1);
      console.log(`- ${a.metric}: ${formatNum(a.current, 4)} vs ${formatNum(a.previous, 4)} (${deltaPct}%)`);
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
