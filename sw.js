const CACHE_NAME = 'schedule-v1';
const urlsToCache = [
    '/',
    '/index.php',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/logo2.jpg',
    '/logo3.jpg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});