self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('psycle-v1').then(cache => cache.addAll([
      './runner.html', '../catalog.json', '../money/manifest.json', '../work/manifest.json', '../mental/manifest.json',
      './manifest.webmanifest'
    ]))
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // JSONはネット優先、失敗時キャッシュ
  const isJson = url.pathname.endsWith('.json');
  if (isJson) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open('psycle-v1').then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // 静的はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
