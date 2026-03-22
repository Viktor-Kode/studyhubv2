self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    self.clients.claim();
});

// No fetch listener — empty handlers cause Chrome "no-op fetch" warnings and add overhead.
// Install/activate only is enough for basic PWA installability without intercepting API calls.
