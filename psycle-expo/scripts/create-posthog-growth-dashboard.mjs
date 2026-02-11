#!/usr/bin/env node
/**
 * Create Psycle Growth Dashboard on PostHog.
 *
 * Required env vars (or CLI flags):
 * - POSTHOG_PERSONAL_API_KEY (or --token)
 * - POSTHOG_PROJECT_ID (or --project)
 * Optional:
 * - POSTHOG_HOST (default: https://app.posthog.com)
 *
 * Usage:
 *   node scripts/create-posthog-growth-dashboard.mjs --dry-run
 *   node scripts/create-posthog-growth-dashboard.mjs --apply
 *   node scripts/create-posthog-growth-dashboard.mjs --apply --replace
 */

const DEFAULT_HOST = "https://app.posthog.com";
const DEFAULT_DASHBOARD_NAME = "Psycle Growth Dashboard (v1.5)";
const DEFAULT_DASHBOARD_DESCRIPTION =
  "Psycle growth KPI dashboard. Seeded by scripts/create-posthog-growth-dashboard.mjs";
const DASHBOARD_TAG = "psycle-growth-v1.5";

const CARD_DEFS = [
  {
    name: "DAU (session_start UV)",
    description: "Unique active users by session_start per day (30d).",
    fallbackEvent: "session_start",
    hogql: `
SELECT
  toDate(timestamp) AS day,
  uniqIf(distinct_id, event = 'session_start') AS dau
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
  {
    name: "Lesson Completion Rate (UV)",
    description: "lesson_complete_uv / lesson_start_uv (30d).",
    fallbackEvent: "lesson_complete",
    hogql: `
SELECT
  toDate(timestamp) AS day,
  uniqIf(distinct_id, event = 'lesson_start') AS lesson_start_uv,
  uniqIf(distinct_id, event = 'lesson_complete') AS lesson_complete_uv,
  round(lesson_complete_uv / nullIf(lesson_start_uv, 0), 4) AS lesson_completion_rate_uv
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
  {
    name: "Incorrect Per Lesson Start",
    description: "question_incorrect_count / lesson_start_count (30d).",
    fallbackEvent: "question_incorrect",
    hogql: `
SELECT
  toDate(timestamp) AS day,
  countIf(event = 'question_incorrect') AS question_incorrect_count,
  countIf(event = 'lesson_start') AS lesson_start_count,
  round(question_incorrect_count / nullIf(lesson_start_count, 0), 3) AS incorrect_per_lesson_start
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
  {
    name: "Streak Lost Users (daily)",
    description: "Unique users with streak_lost by streakType (30d).",
    fallbackEvent: "streak_lost",
    hogql: `
SELECT
  toDate(timestamp) AS day,
  properties.streakType AS streak_type,
  uniq(distinct_id) AS users_lost
FROM events
WHERE event = 'streak_lost'
  AND timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day, streak_type
ORDER BY day ASC, streak_type ASC
`.trim(),
  },
  {
    name: "Energy Friction (daily)",
    description: "energy_block_rate and energy_shop_intent by day (30d).",
    fallbackEvent: "energy_blocked",
    hogql: `
SELECT
  toDate(timestamp) AS day,
  countIf(event = 'lesson_start') AS lesson_start_count,
  countIf(event = 'energy_blocked') AS energy_blocked_count,
  countIf(event = 'shop_open_from_energy') AS shop_open_from_energy_count,
  round(energy_blocked_count / nullIf(lesson_start_count, 0), 4) AS energy_block_rate,
  round(shop_open_from_energy_count / nullIf(energy_blocked_count, 0), 4) AS energy_shop_intent
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
`.trim(),
  },
  {
    name: "D1 Retention (session_start)",
    description: "D1 retention from session_start cohorts.",
    fallbackEvent: "session_start",
    hogql: `
WITH cohort AS (
  SELECT
    distinct_id,
    min(toDate(timestamp)) AS cohort_day
  FROM events
  WHERE event = 'session_start'
    AND properties.env = 'prod'
    AND timestamp >= now() - INTERVAL 30 DAY
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
  c.cohort_day,
  uniq(c.distinct_id) AS cohort_users,
  uniqIf(c.distinct_id, dateDiff('day', c.cohort_day, r.first_return_day) = 1) AS retained_d1,
  round(retained_d1 / nullIf(cohort_users, 0), 4) AS d1_retention
FROM cohort c
LEFT JOIN revisit r
  ON c.distinct_id = r.distinct_id
  AND c.cohort_day = r.cohort_day
GROUP BY c.cohort_day
ORDER BY c.cohort_day ASC
`.trim(),
  },
  {
    name: "D7 Retention (session_start)",
    description: "D7 retention from session_start cohorts.",
    fallbackEvent: "session_start",
    hogql: `
WITH cohort AS (
  SELECT
    distinct_id,
    min(toDate(timestamp)) AS cohort_day
  FROM events
  WHERE event = 'session_start'
    AND properties.env = 'prod'
    AND timestamp >= now() - INTERVAL 30 DAY
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
  c.cohort_day,
  uniq(c.distinct_id) AS cohort_users,
  uniqIf(c.distinct_id, dateDiff('day', c.cohort_day, r.first_return_day) = 7) AS retained_d7,
  round(retained_d7 / nullIf(cohort_users, 0), 4) AS d7_retention
FROM cohort c
LEFT JOIN revisit r
  ON c.distinct_id = r.distinct_id
  AND c.cohort_day = r.cohort_day
GROUP BY c.cohort_day
ORDER BY c.cohort_day ASC
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
  const withScheme = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `https://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

function buildConfig() {
  const { flags, options } = parseArgs(process.argv.slice(2));
  const dryRun = flags.has("--dry-run") || !flags.has("--apply");

  const host = normalizeHost(options["--host"] || process.env.POSTHOG_HOST || DEFAULT_HOST);
  const token = options["--token"] || process.env.POSTHOG_PERSONAL_API_KEY || "";
  const projectId = options["--project"] || process.env.POSTHOG_PROJECT_ID || "";
  const dashboardName = options["--name"] || DEFAULT_DASHBOARD_NAME;
  const dashboardDescription = options["--description"] || DEFAULT_DASHBOARD_DESCRIPTION;
  const replace = flags.has("--replace");

  return {
    dryRun,
    host,
    token,
    projectId,
    dashboardName,
    dashboardDescription,
    replace,
  };
}

function requiredScopeHint() {
  return [
    "Required PostHog scopes:",
    "- dashboard:read",
    "- dashboard:write",
    "- insight:read",
    "- insight:write",
    "",
    "Required env vars:",
    "- POSTHOG_PERSONAL_API_KEY",
    "- POSTHOG_PROJECT_ID",
    "- POSTHOG_HOST (optional, default https://app.posthog.com)",
  ].join("\n");
}

async function apiRequest(config, method, path, body) {
  const url = `${config.host}${path}`;
  if (config.dryRun) {
    console.log(`DRY-RUN ${method} ${url}`);
    if (body !== undefined) {
      console.log(JSON.stringify(body, null, 2));
    }
    return null;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const isJson = text.trim().startsWith("{") || text.trim().startsWith("[");
  const payload = isJson ? JSON.parse(text) : text;

  if (!res.ok) {
    const error = new Error(
      `HTTP ${res.status} ${res.statusText} for ${method} ${path}`
    );
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function listAll(config, path) {
  if (config.dryRun) {
    await apiRequest(config, "GET", path, undefined);
    return [];
  }
  const out = [];
  let url = path;
  while (url) {
    const payload = await apiRequest(config, "GET", url, undefined);
    if (Array.isArray(payload)) {
      out.push(...payload);
      url = null;
    } else {
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
  }
  return out;
}

async function ensureDashboard(config) {
  const dashboards = await listAll(
    config,
    `/api/projects/${config.projectId}/dashboards/?limit=200`
  );

  const existing = dashboards.find((d) => d.name === config.dashboardName);
  if (existing && !config.replace) {
    console.log(`Using existing dashboard: ${existing.name} (id=${existing.id})`);
    return existing;
  }

  if (existing && config.replace) {
    console.log(`Deleting existing dashboard: ${existing.name} (id=${existing.id})`);
    await apiRequest(
      config,
      "DELETE",
      `/api/projects/${config.projectId}/dashboards/${existing.id}/`,
      undefined
    );
  }

  const created = await apiRequest(
    config,
    "POST",
    `/api/projects/${config.projectId}/dashboards/`,
    {
      name: config.dashboardName,
      description: config.dashboardDescription,
      tags: [DASHBOARD_TAG],
    }
  );

  if (config.dryRun) {
    return { id: "DRY_RUN_DASHBOARD_ID", name: config.dashboardName };
  }
  console.log(`Created dashboard: ${created.name} (id=${created.id})`);
  return created;
}

function buildHogQLInsightPayload(card, dashboardId) {
  return {
    name: card.name,
    description: card.description,
    dashboards: [dashboardId],
    tags: [DASHBOARD_TAG],
    query: {
      kind: "InsightVizNode",
      source: {
        kind: "HogQLQuery",
        query: card.hogql,
        version: 1,
      },
      version: 1,
    },
  };
}

function buildFallbackTrendPayload(card, dashboardId) {
  return {
    name: card.name,
    description: `${card.description} [fallback trend payload]`,
    dashboards: [dashboardId],
    tags: [DASHBOARD_TAG],
    query: {
      kind: "InsightVizNode",
      source: {
        kind: "TrendsQuery",
        series: [
          {
            kind: "EventsNode",
            name: card.fallbackEvent,
            event: card.fallbackEvent,
            math: "total",
            version: 1,
          },
        ],
        interval: "day",
        version: 1,
      },
      version: 1,
    },
  };
}

async function ensureInsight(config, dashboard, card) {
  const insights = await listAll(
    config,
    `/api/projects/${config.projectId}/insights/?limit=200`
  );

  const existing = insights.find((i) => i.name === card.name);
  if (existing && !config.replace) {
    const dashboards = Array.isArray(existing.dashboards) ? existing.dashboards : [];
    if (!dashboards.includes(dashboard.id)) {
      await apiRequest(
        config,
        "PATCH",
        `/api/projects/${config.projectId}/insights/${existing.id}/`,
        { dashboards: [...dashboards, dashboard.id] }
      );
      console.log(`Attached existing insight to dashboard: ${card.name}`);
    } else {
      console.log(`Insight already exists and attached: ${card.name}`);
    }
    return { mode: "existing" };
  }

  if (existing && config.replace) {
    await apiRequest(
      config,
      "DELETE",
      `/api/projects/${config.projectId}/insights/${existing.id}/`,
      undefined
    );
    console.log(`Deleted existing insight: ${card.name}`);
  }

  const primaryPayload = buildHogQLInsightPayload(card, dashboard.id);
  try {
    await apiRequest(
      config,
      "POST",
      `/api/projects/${config.projectId}/insights/`,
      primaryPayload
    );
    console.log(`Created insight (HogQL): ${card.name}`);
    return { mode: "hogql" };
  } catch (error) {
    if (config.dryRun) {
      console.log(`Dry-run skipped fallback check for: ${card.name}`);
      return { mode: "dry-run" };
    }
    console.warn(`HogQL insight failed for "${card.name}", trying fallback trend payload.`);
    console.warn(error.payload || error.message);
    const fallbackPayload = buildFallbackTrendPayload(card, dashboard.id);
    await apiRequest(
      config,
      "POST",
      `/api/projects/${config.projectId}/insights/`,
      fallbackPayload
    );
    console.log(`Created insight (fallback trend): ${card.name}`);
    return { mode: "fallback" };
  }
}

async function main() {
  const config = buildConfig();

  console.log("PostHog Growth Dashboard Seeder");
  console.log(`  Mode: ${config.dryRun ? "DRY-RUN" : "APPLY"}`);
  console.log(`  Host: ${config.host}`);
  console.log(`  Project: ${config.projectId || "(missing)"}`);
  console.log(`  Dashboard: ${config.dashboardName}`);
  console.log("");

  if (!config.dryRun && (!config.token || !config.projectId)) {
    console.error("Missing required credentials.");
    console.error(requiredScopeHint());
    process.exit(1);
  }

  if (config.dryRun && (!config.token || !config.projectId)) {
    console.log("Credentials missing, continuing in dry-run mode.");
    console.log(requiredScopeHint());
    console.log("");
  }

  const dashboard = await ensureDashboard(config);

  let createdHogql = 0;
  let createdFallback = 0;
  let reused = 0;

  for (const card of CARD_DEFS) {
    const result = await ensureInsight(config, dashboard, card);
    if (result.mode === "hogql") createdHogql++;
    else if (result.mode === "fallback") createdFallback++;
    else if (result.mode === "existing") reused++;
  }

  console.log("");
  console.log("Summary");
  console.log(`  Cards target: ${CARD_DEFS.length}`);
  console.log(`  Created (HogQL): ${createdHogql}`);
  console.log(`  Created (fallback trend): ${createdFallback}`);
  console.log(`  Reused existing: ${reused}`);

  if (config.dryRun) {
    console.log("");
    console.log("Dry-run complete. No changes were sent to PostHog.");
  } else {
    console.log("");
    console.log(`Done. Open: ${config.host}/project/${config.projectId}/dashboard/${dashboard.id}`);
  }
}

main().catch((error) => {
  console.error("Failed to seed PostHog dashboard.");
  console.error(error.message || error);
  if (error.payload) {
    console.error("API payload:");
    console.error(JSON.stringify(error.payload, null, 2));
  }
  process.exit(1);
});
