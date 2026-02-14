#!/usr/bin/env node
/**
 * Create or update Psycle Growth Dashboard on PostHog.
 *
 * Required env vars (or CLI flags):
 * - POSTHOG_PERSONAL_API_KEY (or --token)
 * - POSTHOG_PROJECT_ID (or --project)
 *
 * Optional:
 * - POSTHOG_HOST (default: https://app.posthog.com)
 *
 * Usage:
 *   node scripts/create-posthog-growth-dashboard.mjs --dry-run
 *   node scripts/create-posthog-growth-dashboard.mjs --apply
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const DEFAULT_HOST = "https://app.posthog.com";
const DEFAULT_DASHBOARD_NAME = "Psycle Growth Dashboard (v1.13)";
const DEFAULT_DASHBOARD_DESCRIPTION =
  "Psycle growth KPI dashboard. Managed by scripts/create-posthog-growth-dashboard.mjs";
const DASHBOARD_TAG = "psycle-growth-v1.13";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
  const dryRun = flags.has("--dry-run") || !flags.has("--apply");
  const host = normalizeHost(options["--host"] || process.env.POSTHOG_HOST || DEFAULT_HOST);
  const token = options["--token"] || process.env.POSTHOG_PERSONAL_API_KEY || "";
  const projectId = options["--project"] || process.env.POSTHOG_PROJECT_ID || "";
  const dashboardName = options["--name"] || DEFAULT_DASHBOARD_NAME;
  const dashboardDescription = options["--description"] || DEFAULT_DASHBOARD_DESCRIPTION;

  return {
    dryRun,
    host,
    token,
    projectId,
    dashboardName,
    dashboardDescription,
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
    "",
    "If this is your first setup, run:",
    "- npm run analytics:posthog:setup",
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
    const error = new Error(`HTTP ${res.status} ${res.statusText} for ${method} ${path}`);
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
      continue;
    }
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

function eventNode(event, math = "total", extra = {}) {
  return {
    kind: "EventsNode",
    event,
    name: event,
    math,
    ...extra,
  };
}

function eventPropertyFilter(key, values) {
  return {
    key,
    type: "event",
    operator: "exact",
    value: values,
  };
}

function prodFilterList(extra = []) {
  return [eventPropertyFilter("env", ["prod"]), ...extra];
}

function trendsQuery(series, options = {}) {
  return {
    kind: "InsightVizNode",
    source: {
      kind: "TrendsQuery",
      series,
      interval: options.interval || "day",
      dateRange: {
        date_from: options.dateFrom || "-30d",
        explicitDate: false,
      },
      properties: options.properties || prodFilterList(),
      trendsFilter: {
        display: options.display || "ActionsLineGraph",
        showLegend: true,
        yAxisScaleType: "linear",
        showValuesOnSeries: false,
        smoothingIntervals: 1,
        showPercentStackView: false,
        aggregationAxisFormat: "numeric",
        showAlertThresholdLines: false,
      },
      breakdownFilter: options.breakdown
        ? {
            breakdown: options.breakdown,
            breakdown_type: "event",
          }
        : {
            breakdown_type: "event",
          },
      filterTestAccounts: false,
      version: 2,
    },
    version: 1,
  };
}

function retentionQuery(totalIntervals) {
  return {
    kind: "InsightVizNode",
    source: {
      kind: "RetentionQuery",
      dateRange: {
        date_from: "-30d",
        explicitDate: false,
      },
      properties: prodFilterList(),
      retentionFilter: {
        period: "Day",
        targetEntity: {
          id: "session_start",
          type: "events",
        },
        retentionType: "retention_first_time",
        totalIntervals,
        returningEntity: {
          id: "session_start",
          type: "events",
        },
      },
      filterTestAccounts: false,
      version: 2,
    },
    version: 1,
  };
}

const CARD_DEFS = [
  {
    name: "DAU (session_start UV)",
    description: "Daily active users by session_start (UV/dau).",
    query: trendsQuery([eventNode("session_start", "dau")]),
  },
  {
    name: "Lesson Start vs Complete (UV)",
    description: "Daily UV for lesson_start and lesson_complete to derive completion rate.",
    query: trendsQuery([
      eventNode("lesson_start", "dau"),
      eventNode("lesson_complete", "dau"),
    ]),
  },
  {
    name: "Lesson Complete Users vs DAU (UV)",
    description: "Daily UV for lesson_complete and session_start to derive lesson complete user rate.",
    query: trendsQuery([
      eventNode("lesson_complete", "dau"),
      eventNode("session_start", "dau"),
    ]),
  },
  {
    name: "Intervention Funnel (daily)",
    description: "Daily counts for intervention_shown exposure events.",
    query: trendsQuery([
      eventNode("intervention_shown", "total"),
    ]),
  },
  {
    name: "Recovery Mission (daily)",
    description: "Daily counts for recovery_mission_shown and recovery_mission_claimed.",
    query: trendsQuery([
      eventNode("recovery_mission_shown", "total"),
      eventNode("recovery_mission_claimed", "total"),
    ]),
  },
  {
    name: "Streak Guard (daily)",
    description: "Daily counts for streak_guard_shown, streak_guard_clicked, and streak_guard_saved.",
    query: trendsQuery([
      eventNode("streak_guard_shown", "total"),
      eventNode("streak_guard_clicked", "total"),
      eventNode("streak_guard_saved", "total"),
    ]),
  },
  {
    name: "League Boundary (daily)",
    description: "Daily counts for league_boundary_shown and league_boundary_clicked.",
    query: trendsQuery([
      eventNode("league_boundary_shown", "total"),
      eventNode("league_boundary_clicked", "total"),
    ]),
  },
  {
    name: "Action Journal (daily)",
    description: "Daily journal totals, not_tried totals, and UV for user-rate KPI.",
    query: trendsQuery([
      eventNode("action_journal_submitted", "total"),
      eventNode("action_journal_submitted", "total", {
        name: "action_journal_submitted_not_tried",
        properties: [eventPropertyFilter("result", ["not_tried"])],
      }),
      eventNode("action_journal_submitted", "dau", {
        name: "action_journal_submitted_uv",
      }),
    ]),
  },
  {
    name: "Completed Sessions (daily)",
    description: "Daily total lesson_complete count to track completed sessions per day.",
    query: trendsQuery([eventNode("lesson_complete", "total")]),
  },
  {
    name: "Incorrect vs Lesson Start (daily)",
    description: "Daily counts for question_incorrect and lesson_start to derive error pressure.",
    query: trendsQuery([
      eventNode("question_incorrect", "total"),
      eventNode("lesson_start", "total"),
    ]),
  },
  {
    name: "Streak Lost Users (daily)",
    description: "Unique users with streak_lost by streakType.",
    query: trendsQuery([eventNode("streak_lost", "dau")], {
      breakdown: "streakType",
    }),
  },
  {
    name: "Energy Friction (daily)",
    description: "Daily lesson_start, energy_blocked, and shop_open_from_energy counts.",
    query: trendsQuery([
      eventNode("lesson_start", "total"),
      eventNode("energy_blocked", "total"),
      eventNode("shop_open_from_energy", "total"),
    ]),
  },
  {
    name: "D1 Retention (session_start)",
    description: "Day-1 retention cohorts from session_start.",
    query: retentionQuery(2),
  },
  {
    name: "D7 Retention (session_start)",
    description: "Day-7 retention cohorts from session_start.",
    query: retentionQuery(8),
  },
  {
    name: "Checkout Starts (daily)",
    description: "Daily checkout_start events.",
    query: trendsQuery([eventNode("checkout_start", "total")]),
  },
  {
    name: "Paid Plan Changes (daily)",
    description: "Daily plan_changed events where toPlan is pro/max.",
    query: trendsQuery([eventNode("plan_changed", "total")], {
      properties: prodFilterList([eventPropertyFilter("toPlan", ["pro", "max"])]),
    }),
  },
];

async function ensureDashboard(config) {
  const dashboards = await listAll(config, `/api/projects/${config.projectId}/dashboards/?limit=200`);
  const existing = dashboards.find((d) => d.name === config.dashboardName);
  if (existing) {
    console.log(`Using existing dashboard: ${existing.name} (id=${existing.id})`);
    return existing;
  }

  const created = await apiRequest(config, "POST", `/api/projects/${config.projectId}/dashboards/`, {
    name: config.dashboardName,
    description: config.dashboardDescription,
    tags: [DASHBOARD_TAG],
  });

  if (config.dryRun) {
    return { id: "DRY_RUN_DASHBOARD_ID", name: config.dashboardName };
  }
  console.log(`Created dashboard: ${created.name} (id=${created.id})`);
  return created;
}

function buildInsightPayload(card, dashboardId, dashboards = [dashboardId]) {
  return {
    name: card.name,
    description: card.description,
    dashboards,
    tags: [DASHBOARD_TAG],
    query: card.query,
    deleted: false,
  };
}

function arrayUnique(values) {
  return [...new Set(values)];
}

async function ensureInsight(config, dashboard, card, insightsByName) {
  const existing = insightsByName.get(card.name);

  if (existing) {
    const existingDashboards = Array.isArray(existing.dashboards) ? existing.dashboards : [];
    const dashboards = arrayUnique([...existingDashboards, dashboard.id]);
    const payload = buildInsightPayload(card, dashboard.id, dashboards);
    await apiRequest(
      config,
      "PATCH",
      `/api/projects/${config.projectId}/insights/${existing.id}/`,
      payload
    );
    console.log(`Updated insight: ${card.name} (id=${existing.id})`);
    return { mode: "updated" };
  }

  await apiRequest(config, "POST", `/api/projects/${config.projectId}/insights/`, buildInsightPayload(card, dashboard.id));
  console.log(`Created insight: ${card.name}`);
  return { mode: "created" };
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
  const insights = await listAll(config, `/api/projects/${config.projectId}/insights/?limit=500`);
  const insightsByName = new Map(insights.map((i) => [i.name, i]));

  let created = 0;
  let updated = 0;

  for (const card of CARD_DEFS) {
    const result = await ensureInsight(config, dashboard, card, insightsByName);
    if (result.mode === "created") created++;
    if (result.mode === "updated") updated++;
  }

  console.log("");
  console.log("Summary");
  console.log(`  Cards target: ${CARD_DEFS.length}`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);

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
