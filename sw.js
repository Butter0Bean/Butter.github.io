// sw.js - Service Worker с периодическими уведомлениями
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
  console.log('Service Worker установлен');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэш открыт');
        return cache.addAll(urlsToCache);
      })
  );
  // Заставляем сразу активироваться
  self.skipWaiting();
});

// Активация service worker
self.addEventListener('activate', event => {
  console.log('Service Worker активирован');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Получаем контроль над страницами
  return self.clients.claim();
});

// Запуск периодических уведомлений
function startPeriodicNotifications() {
  console.log('Запуск периодических уведомлений');
  
  // Создаем интервал в Service Worker
  setInterval(async () => {
    console.log('Проверка задач для уведомления...', new Date().toLocaleTimeString());
    
    try {
      // Получаем все клиенты (открытые страницы)
      const clients = await self.clients.matchAll();
      
      if (clients.length > 0) {
        // Отправляем сообщение в основную страницу, чтобы получить задачи
        clients.forEach(client => {
          client.postMessage({
            type: 'GET_TASKS'
          });
        });
      }
    } catch (error) {
      console.error('Ошибка при проверке задач:', error);
    }
  }, 10000); // 10000 миллисекунд = 10 секунд
}

// Слушаем сообщения от страницы
self.addEventListener('message', event => {
  console.log('Сообщение от страницы:', event.data);
  
  if (event.data && event.data.type === 'TASKS_DATA') {
    // Получили данные о задачах
    const tasks = event.data.tasks;
    const overdueTasks = tasks.filter(task => !task.completed && task.deadline && new Date(task.deadline) < new Date());
    const activeTasks = tasks.filter(task => !task.completed);
    
    console.log('Активных задач:', activeTasks.length);
    console.log('Просроченных задач:', overdueTasks.length);
    
    // Показываем уведомление если есть просроченные задачи
    if (overdueTasks.length > 0) {
      const taskList = overdueTasks.slice(0, 3).map(t => `⚠️ ${t.text}`).join('\n');
      const moreText = overdueTasks.length > 3 ? `\n...и еще ${overdueTasks.length - 3}` : '';
      
      showNotification(
        '⚠️ Просроченные задачи!',
        `У вас ${overdueTasks.length} просроченных задач:\n${taskList}${moreText}`,
        'urgent'
      );
    }
    // Если нет просроченных, но есть активные задачи
    else if (activeTasks.length > 0) {
      const taskList = activeTasks.slice(0, 3).map(t => `• ${t.text}`).join('\n');
      const moreText = activeTasks.length > 3 ? `\n...и еще ${activeTasks.length - 3}` : '';
      
      showNotification(
        '📋 Напоминание о задачах',
        `У вас ${activeTasks.length} активных задач:\n${taskList}${moreText}`,
        'reminder'
      );
    }
    // Если задач нет
    else {
      console.log('Нет активных задач для уведомления');
    }
  }
});

// Функция показа уведомления
function showNotification(title, body, type = 'normal') {
  console.log('Показываем уведомление:', title);
  
  const options = {
    body: body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    silent: false,
    requireInteraction: type === 'urgent', // Важные уведомления не исчезают
    data: {
      type: type,
      date: new Date().toISOString()
    }
  };
  
  self.registration.showNotification(title, options);
}

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
  console.log('Клик по уведомлению:', event.notification);
  event.notification.close();
  
  // Открываем или фокусируемся на приложении
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        if (windowClients.length > 0) {
          // Если есть открытое окно, фокусируемся на нем
          return windowClients[0].focus();
        } else {
          // Если нет, открываем новое
          return clients.openWindow('/');
        }
      })
  );
});

// Перехват запросов для кэширования
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
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

// Запускаем уведомления при активации
startPeriodicNotifications();
