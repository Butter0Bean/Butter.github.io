const CACHE_NAME = 'taskmaster-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json'
];

// Установка service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэш открыт');
        return cache.addAll(urlsToCache);
      })
  );
});

// Перехват запросов и ответ из кэша
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем кэшированный ответ или запрашиваем из сети
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            // Проверяем валидный ответ
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Клонируем ответ
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});
self.addEventListener('install', function(event) {
    // Планируем периодические уведомления
    event.waitUntil(
        (async () => {
            if ('periodicSync' in self.registration) {
                try {
                    await self.registration.periodicSync.register('reminders', {
                        minInterval: 1 * 60 * 1000 // Каждые 1 минуты
                    });
                } catch (error) {
                    console.log('Periodic sync not supported:', error);
                }
            }
        })()
    );
});
// Обновление кэша при активации
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
