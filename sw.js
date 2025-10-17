const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/js/common.js',
  '/js/cart.js',
  '/js/i18n.js',
  '/js/products.js',
  '/js/product.js',
  '/pages/products.html',
  '/pages/product.html',
  '/pages/story.html',
  '/pages/contact.html',
  '/assets/logos/logo-removebg-preview.png',
  '/assets/favicon/favicon-32x32.png',
  '/assets/favicon/favicon-16x16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (![STATIC_CACHE, RUNTIME_CACHE].includes(key)) {
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// Offline-first for navigation requests, network-first for JSON, cache-first for static
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle same-origin
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    // App shell strategy
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        return cached || caches.match('/offline.html');
      })
    );
    return;
  }

  // JSON/data network-first
  if (req.url.endsWith('/data/products.json')) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Static cache-first
  if (STATIC_ASSETS.some((p) => url.pathname === p)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
