#!/usr/bin/env node
/**
 * Generate KPI report JSON from PostHog data.
 *
 * Required env vars (or CLI flags):
 * - POSTHOG_PERSONAL_API_KEY (or --token)
 * - POSTHOG_PROJECT_ID (or --project)
 * Optional:
 * - POSTHOG_HOST (default: https://app.posthog.com)
 *
 * Usage:
 *   node scripts/generate-posthog-kpi-report.mjs --json
 */

const DEFAULT_HOST = "https://app.posthog.com";

const METRICS = [
  {
    id: "dau",
    name: "DAU",
    direction: "higher_better",
    unit: "users",
    action: "DAU減少のため、初回導線と再訪プッシュ配信を同時に強化する。",
    hogql: `
SELECT
  toString(toDate(timestamp)) AS day,
  uniqIf(distinct_id, event = 'session_start') AS value
FROM events
WHERE timestamp >= now() - INTERVAL 21 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
  {
    id: "lesson_completion_rate_uv",
    name: "Lesson Completion Rate (UV)",
    direction: "higher_better",
    unit: "ratio",
    action: "完了率低下に対し、レッスン途中離脱ポイントを特定して問題難易度を調整する。",
    hogql: `
SELECT
  toString(toDate(timestamp)) AS day,
  round(
    uniqIf(distinct_id, event = 'lesson_complete')
    / nullIf(uniqIf(distinct_id, event = 'lesson_start'), 0),
    6
  ) AS value
FROM events
WHERE timestamp >= now() - INTERVAL 21 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
  {
    id: "incorrect_per_lesson_start",
    name: "Incorrect Per Lesson Start",
    direction: "lower_better",
    unit: "ratio",
    action: "誤答率悪化のため、誤答上位トピックにヒント表示と復習問題を追加する。",
    hogql: `
SELECT
  toString(toDate(timestamp)) AS day,
  round(
    countIf(event = 'question_incorrect')
    / nullIf(countIf(event = 'lesson_start'), 0),
    6
  ) AS value
FROM events
WHERE timestamp >= now() - INTERVAL 21 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
  {
    id: "energy_block_rate",
    name: "Energy Block Rate",
    direction: "lower_better",
    unit: "ratio",
    action: "Energy Block増加に対し、回復導線と報酬タイミングのABテストを優先する。",
    hogql: `
SELECT
  toString(toDate(timestamp)) AS day,
  round(
    countIf(event = 'energy_blocked')
    / nullIf(countIf(event = 'lesson_start'), 0),
    6
  ) AS value
FROM events
WHERE timestamp >= now() - INTERVAL 21 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
  {
    id: "d1_retention",
    name: "D1 Retention",
    direction: "higher_better",
    unit: "ratio",
    action: "D1維持率改善のため、初日オンボーディング後24時間以内の再訪施策を実装する。",
    hogql: `
WITH cohort AS (
  SELECT
    distinct_id,
    min(toDate(timestamp)) AS cohort_day
  FROM events
  WHERE event = 'session_start'
    AND properties.env = 'prod'
    AND timestamp >= now() - INTERVAL 35 DAY
  GROUP BY distinct_id
),
revisit AS (
  SELECT
    e.distinct_id,
    c.cohort_day,
    min(toDate(e.timestamp)) AS first_return_day
  FROM events e
  JOIN cohort c ON c.distinct_id = e.distinct_id
  WHERE e.event = 'session_start'
    AND e.properties.env = 'prod'
    AND toDate(e.timestamp) > c.cohort_day
  GROUP BY e.distinct_id, c.cohort_day
)
SELECT
  toString(c.cohort_day) AS day,
  round(
    uniqIf(c.distinct_id, dateDiff('day', c.cohort_day, r.first_return_day) = 1)
    / nullIf(uniq(c.distinct_id), 0),
    6
  ) AS value
FROM cohort c
LEFT JOIN revisit r
  ON c.distinct_id = r.distinct_id
  AND c.cohort_day = r.cohort_day
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
  {
    id: "d7_retention",
    name: "D7 Retention",
    direction: "higher_better",
    unit: "ratio",
    action: "D7維持率が弱いため、7日目到達前の進捗リマインドと報酬を最適化する。",
    hogql: `
WITH cohort AS (
  SELECT
    distinct_id,
    min(toDate(timestamp)) AS cohort_day
  FROM events
  WHERE event = 'session_start'
    AND properties.env = 'prod'
    AND timestamp >= now() - INTERVAL 35 DAY
  GROUP BY distinct_id
),
revisit AS (
  SELECT
    e.distinct_id,
    c.cohort_day,
    min(toDate(e.timestamp)) AS first_return_day
  FROM events e
  JOIN cohort c ON c.distinct_id = e.distinct_id
  WHERE e.event = 'session_start'
    AND e.properties.env = 'prod'
    AND toDate(e.timestamp) > c.cohort_day
  GROUP BY e.distinct_id, c.cohort_day
)
SELECT
  toString(c.cohort_day) AS day,
  round(
    uniqIf(c.distinct_id, dateDiff('day', c.cohort_day, r.first_return_day) = 7)
    / nullIf(uniq(c.distinct_id), 0),
    6
  ) AS value
FROM cohort c
LEFT JOIN revisit r
  ON c.distinct_id = r.distinct_id
  AND c.cohort_day = r.cohort_day
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
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
    json: flags.has("--json"),
    host: normalizeHost(options["--host"] || process.env.POSTHOG_HOST || DEFAULT_HOST),
    token: options["--token"] || process.env.POSTHOG_PERSONAL_API_KEY || "",
    projectId: options["--project"] || process.env.POSTHOG_PROJECT_ID || "",
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
  let payload = text;
  if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
    payload = JSON.parse(text);
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText} for ${method} ${path}`);
    err.payload = payload;
    throw err;
  }
  return payload;
}

async function runHogQL(config, query) {
  const payload = await apiRequest(
    config,
    "POST",
    `/api/projects/${config.projectId}/query/`,
    {
      query: {
        kind: "HogQLQuery",
        query,
      },
      refresh: "blocking",
    }
  );
  const columns = payload.columns || payload.types?.map((t) => t.name) || [];
  const rows = Array.isArray(payload.results) ? payload.results : [];
  if (!rows.length) return [];

  const dayIdx = columns.indexOf("day");
  const valueIdx = columns.indexOf("value");

  if (Array.isArray(rows[0])) {
    if (dayIdx < 0 || valueIdx < 0) return [];
    return rows
      .map((row) => ({
        day: String(row[dayIdx]),
        value: row[valueIdx] == null ? null : Number(row[valueIdx]),
      }))
      .filter((r) => Number.isFinite(r.value));
  }

  return rows
    .map((row) => ({
      day: String(row.day),
      value: row.value == null ? null : Number(row.value),
    }))
    .filter((r) => Number.isFinite(r.value));
}

function formatDayUtc(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDay(day, delta) {
  const dt = new Date(`${day}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + delta);
  return formatDayUtc(dt);
}

function average(series, daySet) {
  const values = series.filter((p) => daySet.has(p.day)).map((p) => p.value);
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function pctChange(next, prev) {
  if (next == null || prev == null || prev === 0) return null;
  return (next - prev) / Math.abs(prev);
}

function round(value, digits = 4) {
  if (value == null || !Number.isFinite(value)) return null;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function toDaySet(startDay, endDay) {
  const out = new Set();
  let cursor = startDay;
  while (cursor <= endDay) {
    out.add(cursor);
    cursor = shiftDay(cursor, 1);
  }
  return out;
}

function buildReport(metricSeries) {
  const todayUtc = formatDayUtc(new Date());
  const desiredYesterday = shiftDay(todayUtc, -1);
  const allDays = metricSeries.flatMap((m) => m.series.map((p) => p.day));
  const latestAvailable = allDays.length ? [...allDays].sort().at(-1) : desiredYesterday;
  const referenceDay = allDays.includes(desiredYesterday) ? desiredYesterday : latestAvailable;

  const last7Start = shiftDay(referenceDay, -6);
  const prev7Start = shiftDay(referenceDay, -13);
  const prev7End = shiftDay(referenceDay, -7);
  const last7Set = toDaySet(last7Start, referenceDay);
  const prev7Set = toDaySet(prev7Start, prev7End);

  const metrics = metricSeries.map((m) => {
    const byDay = new Map(m.series.map((p) => [p.day, p.value]));
    const snapshot = byDay.get(referenceDay) ?? null;
    const last7Avg = average(m.series, last7Set);
    const prev7Avg = average(m.series, prev7Set);
    const change = pctChange(last7Avg, prev7Avg);
    const worsened20 =
      change == null
        ? false
        : m.direction === "higher_better"
          ? change <= -0.2
          : change >= 0.2;
    return {
      id: m.id,
      name: m.name,
      unit: m.unit,
      direction: m.direction,
      snapshot: round(snapshot, 6),
      last7Avg: round(last7Avg, 6),
      prev7Avg: round(prev7Avg, 6),
      changePct: round(change, 6),
      worsened20,
      action: m.action,
    };
  });

  const anomalies = metrics
    .filter((m) => m.worsened20)
    .sort((a, b) => Math.abs(b.changePct || 0) - Math.abs(a.changePct || 0))
    .map((m) => ({
      metric: m.name,
      changePct: m.changePct,
      reason: m.direction === "higher_better" ? "20%以上の悪化(低下)" : "20%以上の悪化(上昇)",
    }));

  const prioritizedActions = (anomalies.length ? anomalies : metrics)
    .slice()
    .sort((a, b) => Math.abs(b.changePct || 0) - Math.abs(a.changePct || 0))
    .slice(0, 3)
    .map((m, idx) => {
      const metric = metrics.find((x) => x.name === (m.metric || m.name)) || m;
      return {
        priority: idx + 1,
        metric: metric.name,
        action: metric.action,
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    referenceDay,
    window: {
      last7: { start: last7Start, end: referenceDay },
      previous7: { start: prev7Start, end: prev7End },
    },
    metrics,
    anomalies,
    prioritizedActions,
  };
}

function printText(report) {
  console.log(`Reference day: ${report.referenceDay}`);
  for (const m of report.metrics) {
    console.log(
      `${m.name}: snapshot=${m.snapshot} last7=${m.last7Avg} prev7=${m.prev7Avg} change=${m.changePct}`
    );
  }
}

async function main() {
  const config = buildConfig();
  if (!config.token || !config.projectId) {
    console.error("Missing required credentials: POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID");
    process.exit(1);
  }

  const metricSeries = [];
  for (const metric of METRICS) {
    const series = await runHogQL(config, metric.hogql);
    metricSeries.push({ ...metric, series });
  }

  const report = buildReport(metricSeries);
  if (config.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printText(report);
  }
}

main().catch((error) => {
  console.error("Failed to generate PostHog KPI report.");
  console.error(error.message || error);
  if (error.payload) {
    console.error(JSON.stringify(error.payload, null, 2));
  }
  process.exit(1);
});
