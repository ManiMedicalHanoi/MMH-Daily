// MMH Daily — service worker: trang + dữ liệu lấy mạng trước (mất mạng ⇒ bản lưu); MP3 không lưu ở đây (trình duyệt tự đệm).
// Gỡ khẩn cấp: thay toàn bộ file bằng: self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));
const V = 'mmh-daily-v17';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'index.html', 'app.css', 'app.js', 'install.js', 'update.js', 'learn.js', 'study.js', 'rank.js', 'chars.js', 'social.js', 'path.js', 'fun.js', 'guide.js', 'manifest.webmanifest', 'coach/', 'coach/index.html', 'coach/coach.css', 'coach/coach.js', 'coach/lessons.js', 'coach/live.js', 'coach/live.css', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']).catch(() => {}))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || /\.mp3$/.test(u.pathname)) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});

// Thông báo "tinh tinh" khi có số podcast mới (Training Hub ▸ dypTick_ ⇒ mmh-backend daily-push.yml ⇒ Web Push)
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'MMH Daily Podcast', { body: d.body || '', tag: d.tag || 'mmh-daily', renotify: true,
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: d.url || './#/listen' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './#/listen';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) if (w.url.includes('/MMH-Daily/') && 'focus' in w) { w.navigate(url).catch(() => {}); return w.focus(); }
    return clients.openWindow(url);
  }));
});
