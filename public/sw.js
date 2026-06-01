// Minimal service worker — enables PWA install prompt
// No offline caching: the app always fetches fresh data from Supabase
const CACHE = 'porra2026-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Network-first: always go to network, no stale data risk
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
