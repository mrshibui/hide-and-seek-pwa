const CACHE = 'mapper-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './leaflet/leaflet.min.js',
  './leaflet/leaflet.min.css',
  './leaflet/images/layers.png',
  './leaflet/images/layers-2x.png',
  './leaflet/images/marker-icon.png',
  './leaflet/images/marker-icon-2x.png',
  './leaflet/images/marker-shadow.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for our assets; network-first for map tiles
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Map tiles: network-first with cache fallback
  if (url.hostname.includes('tile.openstreetmap.org')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Everything else: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
