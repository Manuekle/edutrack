const CACHE_NAME = 'sira-v1.1';
const STATIC_CACHE = 'sira-static-v1.1';
const DYNAMIC_CACHE = 'sira-dynamic-v1.1';

const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/offline.html',
  '/icons/favicon.ico',
  '/icons/favicon-192x192.png',
  '/icons/favicon-512x512.png',
  '/logo-fup.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            return name.startsWith('sira-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE;
          })
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // External assets (like Google Fonts)
  if (!url.origin.includes(self.location.origin)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // API Requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Images and Fonts
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Navigation - fallback to offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return cache.match('/offline.html');
      })
    );
    return;
  }

  // Default: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  return cachedResponse || fetchPromise;
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Imagen no disponible offline', { status: 404 });
  }
}

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Error de conexión', { status: 503 });
  }
}

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'SIRA';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icons/favicon-192x192.png',
    badge: '/icons/favicon-72x72.png',
    data: data.url || '/',
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
