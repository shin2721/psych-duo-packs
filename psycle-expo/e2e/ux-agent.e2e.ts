/**
 * UX Agent — persistent Detox session for interactive native exploration.
 *
 * Architecture:
 *   CLI writes   /tmp/ux-agent/cmd-{reqId}.json   (atomic: write .tmp then rename)
 *   Agent reads  oldest cmd-*.json, executes, writes result-{reqId}.json
 *   CLI waits    for its own result-{reqId}.json   (no cross-talk)
 *
 * Startup aligns with ui.full_touch.e2e.ts:
 *   beforeAll → resetContentAndSettings + installApp  (deterministic)
 *   it        → launchApp → bootstrap to a stable app entry surface → command loop
 *
 * Env:
 *   UX_AGENT_SKIP_RESET=1  — skip resetContentAndSettings (debug only)
 */

// ALL Detox APIs must come from globals set by testEnvironment (primary context).
// `import { ... } from 'detox'` resolves to DetoxSecondaryContext when
// DETOX_CONFIG_SNAPSHOT_PATH is set (Jest worker), which lacks the installed
// worker → tap/screenshot/openURL throw SecondaryContext errors.
declare const by: Detox.ByFacade;
declare const device: Detox.DetoxDeviceBase;
declare const element: Detox.ElementFacade;
declare const expect: Detox.ExpectFacade;
declare const system: Detox.SystemFacade;
declare const waitFor: Detox.WaitForFacade;
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';

jest.setTimeout(24 * 60 * 60 * 1000);

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CMD_DIR = '/tmp/ux-agent';
const READY_FILE = path.join(CMD_DIR, 'ready');
const SCREENSHOT_DIR = path.join(CMD_DIR, 'screenshots');
const POLL_INTERVAL_MS = 150;
const KEEPALIVE_INTERVAL_MS = 4000;
const USE_DEV_CLIENT_BOOTSTRAP = process.env.E2E_BOOTSTRAP_DEV_CLIENT === '1';
const PSYCLE_SIMULATOR_UDID =
  process.env.UX_AGENT_SIMULATOR_UDID ||
  process.env.PSYCLE_SIMULATOR_UDID ||
  '136DAFE4-586A-4227-8AFB-D9F33F68D32A';
const DEV_SERVER_URL = withDisableOnboarding(resolveDevServerUrl());
const DEV_CLIENT_URL = `psycle://expo-development-client/?url=${encodeURIComponent(DEV_SERVER_URL)}`;
const SINGLE_COMMAND_JSON = process.env.UX_AGENT_SINGLE_COMMAND_JSON || '';
const SINGLE_COMMAND_RESULT_PATH = process.env.UX_AGENT_SINGLE_COMMAND_RESULT_PATH || '';
const FLOW_JSON = process.env.UX_AGENT_FLOW_JSON || '';
const FLOW_RESULT_PATH = process.env.UX_AGENT_FLOW_RESULT_PATH || '';
const FLOW_PROGRESS_PATH = process.env.UX_AGENT_FLOW_PROGRESS_PATH || '';
const IS_ONE_SHOT_MODE = Boolean(SINGLE_COMMAND_JSON || FLOW_JSON);

function getBy(): Detox.ByFacade {
  return (globalThis as any).by;
}

function getElement(): Detox.ElementFacade {
  return (globalThis as any).element;
}

function getWaitFor(): Detox.WaitForFacade {
  return (globalThis as any).waitFor;
}

function getDevice(): Detox.DetoxDeviceBase {
  return (globalThis as any).device;
}

function getExpect(): Detox.ExpectFacade {
  return (globalThis as any).expect;
}

function getSystem(): Detox.SystemFacade {
  return (globalThis as any).system;
}

/* ------------------------------------------------------------------ */
/*  Helpers (ported from ui.full_touch.e2e.ts)                         */
/* ------------------------------------------------------------------ */

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function isVisibleById(id: string, timeout = 1200): Promise<boolean> {
  try {
    await getWaitFor()(getElement()(getBy().id(id))).toBeVisible().withTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

async function isVisibleByText(text: string, timeout = 900): Promise<boolean> {
  try {
    await getWaitFor()(getElement()(getBy().text(text))).toBeVisible().withTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

async function isVisibleByLabel(label: string, timeout = 900): Promise<boolean> {
  try {
    await getWaitFor()(getElement()(getBy().label(label))).toBeVisible().withTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

async function tapFirstVisibleText(texts: string[], timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const t of texts) {
      if (await isVisibleByText(t, 700)) {
        await getElement()(getBy().text(t)).tap();
        return true;
      }
      if (await isVisibleByLabel(t, 700)) {
        await getElement()(getBy().label(t)).tap();
        return true;
      }
    }
    await sleep(250);
  }
  return false;
}

async function tapFirstVisibleSystemLabel(labels: string[], timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const label of labels) {
      try {
        await getExpect()(getSystem().element(getBy().system.label(label))).toExist();
        await getSystem().element(getBy().system.label(label)).tap();
        return true;
      } catch {
        // Keep polling until the timeout expires.
      }
    }
    await sleep(250);
  }
  return false;
}

async function waitForAnyVisibleText(texts: string[], timeoutMs: number): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const text of texts) {
      if (await isVisibleByText(text, 700) || await isVisibleByLabel(text, 700)) {
        return text;
      }
    }
    await sleep(300);
  }
  throw new Error(`Timed out waiting for text: ${texts.join(', ')}`);
}

async function dismissBlockingSystemAlerts(): Promise<void> {
  const texts = [
    '許可しない', '許可', 'OK', '閉じる', '今はしない', '後で',
    "Don't Allow", 'Allow', 'Not Now', 'Later', 'Close',
  ];
  for (let i = 0; i < 3; i++) {
    if (await tapFirstVisibleSystemLabel(texts, 1200)) {
      await sleep(300);
      continue;
    }
    if (!(await tapFirstVisibleText(texts, 1200))) return;
    await sleep(300);
  }
}

async function bootstrapDevClientToApp(): Promise<void> {
  console.log(`[ux-agent] bootstrap start url=${DEV_CLIENT_URL}`);
  const settleStart = Date.now();
  while (Date.now() - settleStart < 15000) {
    if (
      await isAnyVisibleById(
        ['onboarding-start', 'onboarding-interests-title', 'auth-guest-login', 'tab-course'],
        900,
      )
    ) {
      console.log('[ux-agent] bootstrap skipped: app UI already visible');
      return;
    }
    await sleep(500);
  }

  let sawLauncherSurface = false;
  try {
    const launcherSurface = await waitForAnyVisibleText(
      ['Continue', '続行', '続ける', 'No development servers found', 'Enter URL manually'],
      10000,
    );
    sawLauncherSurface = true;
    console.log(`[ux-agent] launcher surface=${launcherSurface}`);
  } catch {
    console.log('[ux-agent] launcher surface wait timed out');
    if (!IS_ONE_SHOT_MODE) {
      return;
    }
  }

  if (await tapFirstVisibleText(['Continue', '続行', '続ける'], 5000)) {
    console.log('[ux-agent] dismissed dev-menu onboarding');
  }
  await sleep(500);
  if (!sawLauncherSurface && !IS_ONE_SHOT_MODE) {
    return;
  }

  console.log('[ux-agent] sending simctl openurl');
  try {
    execFileSync('xcrun', ['simctl', 'openurl', PSYCLE_SIMULATOR_UDID, DEV_CLIENT_URL], {
      stdio: 'ignore',
    });
  } catch (error) {
    console.log('[ux-agent] simctl openurl failed; falling back to device.openURL');
    await getDevice().openURL({ url: DEV_CLIENT_URL });
  }
  if (await tapFirstVisibleSystemLabel(['開く', 'Open'], 10000)) {
    console.log('[ux-agent] confirmed system open alert');
  }
  if (await tapFirstVisibleText(['開く', 'Open'], 10000)) {
    console.log('[ux-agent] confirmed app-level open prompt');
  }

  const start = Date.now();
  while (Date.now() - start < 15000) {
    if (
      await isAnyVisibleById(
        ['onboarding-start', 'onboarding-interests-title', 'auth-guest-login', 'tab-course'],
        900,
      )
    ) {
      console.log('[ux-agent] app UI visible after bootstrap');
      return;
    }

    await tapFirstVisibleText(['Continue', '続行', '続ける', 'Close', '閉じる'], 1200);
    await sleep(500);
  }
  console.log('[ux-agent] bootstrap finished without visible app IDs');
}

async function isAnyVisibleById(ids: string[], timeout = 1000): Promise<boolean> {
  for (const id of ids) {
    if (await isVisibleById(id, timeout)) {
      return true;
    }
  }
  return false;
}

function resolveDevServerUrl(): string {
  if (process.env.E2E_DEV_SERVER_URL) {
    return process.env.E2E_DEV_SERVER_URL;
  }

  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return `http://${entry.address}:8082`;
      }
    }
  }

  return 'http://127.0.0.1:8082';
}

function withDisableOnboarding(urlString: string): string {
  const url = new URL(urlString);
  url.searchParams.set('disableOnboarding', '1');
  return url.toString();
}

async function waitForAnyVisibleById(ids: string[], timeoutMs: number): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const id of ids) {
      if (await isVisibleById(id, 800)) return id;
    }
    await sleep(400);
  }
  throw new Error(`Timed out waiting for: ${ids.join(', ')}`);
}

async function waitForEntrySurface(timeoutMs: number): Promise<'onboarding-start' | 'onboarding-interests-title' | 'auth-guest-login' | 'tab-course'> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isVisibleById('onboarding-start', 700) || await isVisibleByText('はじめる', 700) || await isVisibleByText('Start', 700)) {
      return 'onboarding-start';
    }
    if (await isVisibleById('onboarding-interests-title', 700)) {
      return 'onboarding-interests-title';
    }
    if (await isVisibleById('auth-guest-login', 700)) {
      return 'auth-guest-login';
    }
    if (await isVisibleById('tab-course', 700) || await isVisibleByText('学ぶ', 700) || await isVisibleByText('Learn', 700)) {
      return 'tab-course';
    }
    await sleep(350);
  }
  throw new Error('Timed out waiting for app entry surface');
}

async function probeEntrySurface(timeoutMs: number): Promise<'onboarding-start' | 'onboarding-interests-title' | 'auth-guest-login' | 'tab-course' | 'unknown'> {
  try {
    return await waitForEntrySurface(timeoutMs);
  } catch {
    return 'unknown';
  }
}

async function finishOnboardingInterests(genreId: string, timeoutMs = 20000): Promise<void> {
  await getWaitFor()(getElement()(getBy().id('onboarding-interests-title'))).toBeVisible().withTimeout(10000);
  await getElement()(getBy().id(genreId)).tap();
  await getWaitFor()(getElement()(getBy().id('onboarding-finish'))).toBeVisible().withTimeout(10000);

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await getElement()(getBy().id('onboarding-finish')).tap();
    await sleep(300);
    if (!(await isVisibleById('onboarding-interests-title', 900))) {
      await sleep(600);
      return;
    }
  }
  throw new Error('Timed out completing onboarding');
}

/* ------------------------------------------------------------------ */
/*  File-based IPC  (per-request files, no single-file contention)     */
/* ------------------------------------------------------------------ */

/** Pick the oldest cmd-{reqId}.json from CMD_DIR and return its parsed body. */
async function waitForCommand(): Promise<any> {
  while (true) {
    const entries = fs.readdirSync(CMD_DIR)
      .filter((f) => f.startsWith('cmd-') && f.endsWith('.json'))
      .sort(); // lexicographic ≈ chronological (timestamp prefix)

    if (entries.length > 0) {
      const file = path.join(CMD_DIR, entries[0]);
      try {
        const raw = fs.readFileSync(file, 'utf-8');
        fs.unlinkSync(file);
        return JSON.parse(raw);
      } catch {
        // File disappeared between readdir and read — another poll iteration.
      }
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

/** Write the result to result-{reqId}.json so the matching CLI caller picks it up. */
function writeResult(reqId: string, result: any): void {
  const tmpFile = path.join(CMD_DIR, `.tmp-result-${reqId}.json`);
  const resultFile = path.join(CMD_DIR, `result-${reqId}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(result, null, 2));
  fs.renameSync(tmpFile, resultFile); // atomic on same filesystem
}

/* ------------------------------------------------------------------ */
/*  Command dispatcher                                                 */
/* ------------------------------------------------------------------ */

async function dispatch(cmd: any): Promise<any> {
  switch (cmd.action) {
    /* ---- tap ---- */
    case 'tap': {
      await getElement()(getBy().id(cmd.id)).tap();
      return { ok: true, action: 'tap', id: cmd.id };
    }

    case 'tap-text': {
      await getElement()(getBy().text(cmd.text)).atIndex(cmd.index ?? 0).tap();
      return { ok: true, action: 'tap-text', text: cmd.text };
    }

    case 'tap-label': {
      await getElement()(getBy().label(cmd.label)).atIndex(cmd.index ?? 0).tap();
      return { ok: true, action: 'tap-label', label: cmd.label };
    }

    /* ---- swipe / scroll ---- */
    case 'swipe': {
      const dir = cmd.direction || 'up';
      const speed = cmd.speed || 'slow';
      const pct = cmd.percent || 0.5;
      await getElement()(getBy().id(cmd.id)).swipe(dir, speed, pct);
      return { ok: true, action: 'swipe', id: cmd.id, direction: dir };
    }

    case 'scroll': {
      const dir = cmd.direction || 'down';
      const amount = cmd.amount || 300;
      await getElement()(getBy().id(cmd.id)).scroll(amount, dir);
      return { ok: true, action: 'scroll', id: cmd.id, direction: dir, amount };
    }

    case 'scroll-to': {
      const maxSwipes = cmd.maxSwipes || 8;
      const dir = cmd.direction || 'up';
      for (let i = 0; i < maxSwipes; i++) {
        if (await isVisibleById(cmd.target, 800)) {
          return { ok: true, action: 'scroll-to', target: cmd.target, found: true, swipes: i };
        }
        await getElement()(getBy().id(cmd.id)).swipe(dir, 'fast', 0.7);
        await sleep(250);
      }
      return { ok: true, action: 'scroll-to', target: cmd.target, found: false, swipes: maxSwipes };
    }

    /* ---- text input ---- */
    case 'type': {
      await getElement()(getBy().id(cmd.id)).typeText(cmd.text);
      return { ok: true, action: 'type', id: cmd.id };
    }

    case 'replace-text': {
      await getElement()(getBy().id(cmd.id)).replaceText(cmd.text);
      return { ok: true, action: 'replace-text', id: cmd.id };
    }

    case 'clear': {
      await getElement()(getBy().id(cmd.id)).clearText();
      return { ok: true, action: 'clear', id: cmd.id };
    }

    /* ---- screenshot ---- */
    case 'screenshot': {
      const name = cmd.name || `ux-${Date.now()}`;
      const raw = await getDevice().takeScreenshot(name);
      const dest = path.join(SCREENSHOT_DIR, `${name}.png`);
      fs.copyFileSync(raw, dest);
      return { ok: true, action: 'screenshot', path: dest };
    }

    /* ---- visibility / existence ---- */
    case 'visible': {
      const v = await isVisibleById(cmd.id, cmd.timeout || 2000);
      return { ok: true, action: 'visible', id: cmd.id, visible: v };
    }

    case 'visible-text': {
      const v = await isVisibleByText(cmd.text, cmd.timeout || 2000);
      return { ok: true, action: 'visible-text', text: cmd.text, visible: v };
    }

    case 'wait-for': {
      const timeout = cmd.timeout || 10000;
      try {
        await getWaitFor()(getElement()(getBy().id(cmd.id))).toBeVisible().withTimeout(timeout);
        return { ok: true, action: 'wait-for', id: cmd.id, found: true };
      } catch {
        return { ok: true, action: 'wait-for', id: cmd.id, found: false };
      }
    }

    /* ---- dump: check a batch of testIDs ---- */
    case 'dump-ids': {
      const ids: string[] = cmd.ids || [];
      const results: Record<string, boolean> = {};
      for (const id of ids) {
        results[id] = await isVisibleById(id, 600);
      }
      return { ok: true, action: 'dump-ids', results };
    }

    /* ---- deep link ---- */
    case 'open-url': {
      await getDevice().openURL({ url: cmd.url });
      await sleep(800);
      return { ok: true, action: 'open-url', url: cmd.url };
    }

    /* ---- app lifecycle ---- */
    case 'relaunch': {
      await getDevice().launchApp({ newInstance: true });
      await getDevice().disableSynchronization();
      return { ok: true, action: 'relaunch' };
    }

    case 'dismiss-alerts': {
      await dismissBlockingSystemAlerts();
      return { ok: true, action: 'dismiss-alerts' };
    }

    case 'sleep': {
      const duration = Number(cmd.ms || 500);
      await sleep(duration);
      return { ok: true, action: 'sleep', ms: duration };
    }

    /* ---- quit ---- */
    case 'quit': {
      return { ok: true, action: 'quit' };
    }

    default:
      return { ok: false, error: `Unknown action: ${cmd.action}` };
  }
}

/* ------------------------------------------------------------------ */
/*  Test entry point                                                   */
/* ------------------------------------------------------------------ */

jest.setTimeout(1800000); // 30 min

describe('UX Agent', () => {
  beforeAll(async () => {
    // ---- Deterministic clean state (aligned with ui.full_touch.e2e.ts) ----
    if (process.env.UX_AGENT_SKIP_RESET !== '1') {
      await getDevice().resetContentAndSettings();
      await getDevice().installApp();
    }

    // ---- Ensure IPC directories ----
    fs.mkdirSync(CMD_DIR, { recursive: true });
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    // Sweep any stale IPC files
    for (const f of fs.readdirSync(CMD_DIR)) {
      if (f.startsWith('cmd-') || f.startsWith('result-') || f.startsWith('.tmp-') || f === 'ready') {
        fs.unlinkSync(path.join(CMD_DIR, f));
      }
    }
  });

  it('agent loop', async () => {
    /* ---- Launch & auto-onboard ---- */
    await getDevice().launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
      ...(USE_DEV_CLIENT_BOOTSTRAP ? { url: DEV_CLIENT_URL } : {}),
    });
    console.log('[ux-agent] launchApp completed');
    await getDevice().disableSynchronization();
    console.log('[ux-agent] synchronization disabled');
    if (USE_DEV_CLIENT_BOOTSTRAP) {
      await sleep(1000);
      await bootstrapDevClientToApp();
    }

    // Persistent agent launch should enter the command loop quickly so the
    // launcher wrapper can finish dev-client bootstrap via IPC commands.
    const entryProbeTimeoutMs = IS_ONE_SHOT_MODE ? 90000 : 8000;
    const entry = USE_DEV_CLIENT_BOOTSTRAP
      ? 'unknown'
      : await probeEntrySurface(entryProbeTimeoutMs);
    console.log(`[ux-agent] entry surface=${entry}`);

    /* ---- Enter command loop as soon as startup has stabilized enough for IPC ---- */
    const wsAlive = true;

    /* ---- Signal ready (include ws status) ---- */
    fs.writeFileSync(READY_FILE, JSON.stringify({ ts: Date.now(), status: 'ready', wsAlive, entry }));

    if (SINGLE_COMMAND_JSON) {
      const singleCommand = JSON.parse(SINGLE_COMMAND_JSON);
      const reqId: string = singleCommand.reqId || 'single';
      try {
        const result = await dispatch(singleCommand);
        if (SINGLE_COMMAND_RESULT_PATH) {
          fs.writeFileSync(SINGLE_COMMAND_RESULT_PATH, JSON.stringify(result, null, 2));
        } else {
          writeResult(reqId, result);
        }
      } catch (err: any) {
        const failure = { ok: false, action: singleCommand.action, error: err.message };
        if (SINGLE_COMMAND_RESULT_PATH) {
          fs.writeFileSync(SINGLE_COMMAND_RESULT_PATH, JSON.stringify(failure, null, 2));
        } else {
          writeResult(reqId, failure);
        }
      }
      return;
    }

    if (FLOW_JSON) {
      const flowCommands = JSON.parse(FLOW_JSON) as any[];
      const flowResults: any[] = [];
      for (let index = 0; index < flowCommands.length; index += 1) {
        const flowCommand = flowCommands[index];
        if (FLOW_PROGRESS_PATH) {
          fs.writeFileSync(
            FLOW_PROGRESS_PATH,
            JSON.stringify({ index, action: flowCommand.action, command: flowCommand }, null, 2),
          );
        }
        try {
          const result = await dispatch(flowCommand);
          flowResults.push(result);
        } catch (err: any) {
          flowResults.push({ ok: false, action: flowCommand.action, error: err.message });
          break;
        }
      }
      const payload = { ok: flowResults.every((item) => item.ok !== false), entry, results: flowResults };
      if (FLOW_RESULT_PATH) {
        fs.writeFileSync(FLOW_RESULT_PATH, JSON.stringify(payload, null, 2));
      }
      return;
    }

    /* ---- Command loop ---- */
    console.log('[ux-agent] command loop ready');
    while (true) {
      console.log('[ux-agent] waiting for command');
      const cmd = await waitForCommand();
      const reqId: string = cmd.reqId || 'unknown';
      console.log(`[ux-agent] received command action=${cmd.action} reqId=${reqId}`);

      try {
        const result = await dispatch(cmd);
        writeResult(reqId, result);
        if (cmd.action === 'quit') return;
      } catch (err: any) {
        writeResult(reqId, { ok: false, action: cmd.action, error: err.message });
      }
    }
  });
});
