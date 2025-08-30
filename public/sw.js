self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open('static-v1').then(cache => cache.addAll(['/offline.html'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Network-first for navigation
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        return fresh;
      } catch (e) {
        const cache = await caches.open('static-v1');
        return (await cache.match('/offline.html')) || Response.error();
      }
    })());
    return;
  }

  // Stale-while-revalidate for images and static assets
  if (req.destination === 'image' || /\.(?:js|css|woff2)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open('assets-v1');
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((networkResponse) => {
        cache.put(req, networkResponse.clone());
        return networkResponse;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }
});
