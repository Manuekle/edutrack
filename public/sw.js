const CACHE_NAME = 'sira-v1';
const STATIC_CACHE = 'sira-static-v1';
const DYNAMIC_CACHE = 'sira-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/icons/favicon.ico',
  '/icons/favicon-192x192.png',
  '/icons/favicon-512x512.png',
];

const API_CACHE_DURATION = 5 * 60 * 1000;

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

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  event.respondWith(cacheFirstStrategy(request));
});

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return caches.match('/offline.html') || new Response('Offline', { status: 503 });
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
    return cachedResponse || new Response('No cache available', { status: 503 });
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
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
