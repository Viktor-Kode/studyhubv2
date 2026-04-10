/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC0pmHvjHbAk9TJZg_plTEl6ESvWGR499I',
  authDomain: 'studyhelp-82734.firebaseapp.com',
  projectId: 'studyhelp-82734',
  storageBucket: 'studyhelp-82734.firebasestorage.app',
  messagingSenderId: '763192836819',
  appId: '1:763192836819:web:57c6143c89f446cfeeca26',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'StudyHelp';
  const body = payload.notification?.body || '';
  const link = payload.data?.link || '/dashboard/student';
  self.registration.showNotification(title, {
    body,
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    data: { link },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const raw = data.link ?? data.url ?? '/dashboard/student';
  const pathOrUrl = (typeof raw === 'string' ? raw : String(raw || '')).trim() || '/dashboard/student';
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : new URL(pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin) || !('focus' in client)) continue;

        try {
          if ('navigate' in client && typeof client.navigate === 'function') {
            await client.navigate(url);
          } else {
            client.postMessage({ type: 'SW_NAVIGATE', url });
          }
        } catch {
          try {
            client.postMessage({ type: 'SW_NAVIGATE', url });
          } catch {
            /* ignore */
          }
        }
        return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })()
  );
});

/** Offline shells — bump version when cache strategy or precache list changes */
const CACHE_VERSION = 'studyhelp-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/offline.html',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/site.webmanifest',
  '/favicon.ico',
];

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request)
      .then((res) => {
        if (res.ok) cache.put(request, res);
      })
      .catch(() => {});
    return cached;
  }
  const res = await fetch(request);
  if (res.ok) await cache.put(request, res.clone());
  return res;
}

async function networkFirstSameOrigin(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cache = await caches.open(cacheName);
    const hit = await cache.match(request);
    if (hit) return hit;
    throw new Error('network-failed');
  }
}

async function networkFirstDocument(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      } catch {
        /* ignore precache failures (e.g. offline during install) */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const keep = new Set([STATIC_CACHE, RUNTIME_CACHE]);
      await Promise.all(
        keys.filter((k) => k.startsWith('studyhelp-') && !keep.has(k)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(event.request, RUNTIME_CACHE));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstDocument(event.request));
    return;
  }

  event.respondWith(
    networkFirstSameOrigin(event.request, RUNTIME_CACHE).catch(() => {
      return new Response('', { status: 503, statusText: 'Unavailable' });
    })
  );
});
