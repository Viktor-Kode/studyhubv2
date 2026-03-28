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
  const raw = event.notification.data?.link || '/dashboard/student';
  const url = raw.startsWith('http') ? raw : new URL(raw, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && typeof client.navigate === 'function') {
            client.navigate(url);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});
