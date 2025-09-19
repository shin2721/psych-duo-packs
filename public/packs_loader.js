// Lightweight loader for psych-duo packs (GitHub Pages / Local both)
async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  // GitHub Pagesで先頭に付くことがあるUTF-8 BOMを除去してからparse
  const clean = text.replace(/^\uFEFF/, '');
  try { return JSON.parse(clean); }
  catch (e) {
    throw new Error(`JSON parse error for ${url}\n---- body ----\n${clean.substring(0, 500)}`);
  }
}

function normalizeBase(base) {
  // 許可: https://<user>.github.io/<repo>/ のみ
  let u;
  try { u = new URL(base); } catch { throw new Error('Invalid URL'); }
  if (u.protocol !== 'https:') throw new Error('Use https://');
  if (!u.hostname.endsWith('.github.io')) throw new Error('Use GitHub Pages URL (*.github.io)');
  const parts = u.pathname.replace(/\/+$/,'').split('/').filter(Boolean);
  if (parts.length !== 1) throw new Error('Base must look like https://<user>.github.io/<repo>/');
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.href;
}

function normalizeLocalBase(base) {
  // ローカルはサーバーrootからの絶対パス前提（/manifest.json, /packs/...）
  let u;
  try { u = new URL(base, location.origin); } catch { u = new URL('/', location.origin); }
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.href;
}

export async function loadFromGitHub(base) {
  const baseHref = normalizeBase(base);
  const manifestUrl = new URL('manifest.json', baseHref).href + `?ts=${Date.now()}`;
  const manifest = await fetchJSON(manifestUrl);

  // pack.path を「ベースURL」から解決（←ここが肝）
  const packUrls = (manifest.packs || []).map(p => {
    const path = String(p.path || '').replace(/^\/+/, '');
    return new URL(path, baseHref).href + `?ts=${Date.now()}`;
  });

  const packs = await Promise.all(packUrls.map(fetchJSON));
  return { manifest, packs };
}

export async function loadFromLocalRoot() {
  const baseHref = normalizeLocalBase('/');
  const manifestUrl = new URL('manifest.json', baseHref).href + `?ts=${Date.now()}`;
  const manifest = await fetchJSON(manifestUrl);

  const packUrls = (manifest.packs || []).map(p => {
    const path = String(p.path || '').replace(/^\/+/, '');
    return new URL(path, baseHref).href + `?ts=${Date.now()}`;
  });

  const packs = await Promise.all(packUrls.map(fetchJSON));
  return { manifest, packs };
}

// UI helpers for demo pages
export async function runLocalDemo(outEl) {
  try {
    const { manifest, packs } = await loadFromLocalRoot();
    renderSample(outEl, manifest, packs);
  } catch (e) { showError(outEl, e); }
}

export async function runGitHubDemo(base, outEl) {
  try {
    const { manifest, packs } = await loadFromGitHub(base);
    renderSample(outEl, manifest, packs);
  } catch (e) { showError(outEl, e); }
}

function renderSample(outEl, manifest, packs) {
  const sample = packs?.[0]?.skills?.[0]?.cards?.[0];
  const obj = {
    manifest: {
      app: manifest.app, totalPacks: manifest.totalPacks,
      packIds: (manifest.packs||[]).map(p=>p.packId)
    },
    sampleCard: sample || '(no sample)'
  };
  outEl.textContent = JSON.stringify(obj, null, 2);
}
function showError(outEl, err) {
  outEl.textContent = String(err?.message || err);
}
