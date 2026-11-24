// Keeps the app working offline. Change VERSION with every update so phones fetch the new files.
const VERSION = 'qt-v4';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/questions.js', 'js/db.js', 'js/logic.js', 'js/app.js',
  'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/inter-latin-wght-normal.woff2', 'fonts/inter-latin-ext-wght-normal.woff2', 'fonts/inter-greek-wght-normal.woff2',
  'fonts/bricolage-grotesque-latin-wght-normal.woff2', 'fonts/bricolage-grotesque-latin-ext-wght-normal.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'qt-guides').map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// App files come from the cache. The study guide PDFs are saved the first time they open,
// so they work offline after that.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => {
    if (hit) return hit;
    return fetch(e.request).then((res) => {
      if (res.ok && url.pathname.includes('/guides/')) {
        const copy = res.clone();
        caches.open('qt-guides').then((c) => c.put(e.request, copy));
      }
      return res;
    });
  }));
});
