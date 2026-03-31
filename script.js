// ... существующий код TaskManager ...

// Регистрация Service Worker и настройка связи
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker зарегистрирован:', registration);
      
      // Проверяем, есть ли уже Service Worker
      if (registration.active) {
        console.log('Service Worker активен');
      }
    })
    .catch(error => {
      console.log('Ошибка регистрации Service Worker:', error);
    });
  
  // Слушаем сообщения от Service Worker
  navigator.serviceWorker.addEventListener('message', event => {
    console.log('Получено сообщение от Service Worker:', event.data);
    
    if (event.data && event.data.type === 'GET_TASKS') {
      // Отправляем данные о задачах в Service Worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TASKS_DATA',
          tasks: this.tasks // отправляем все задачи
        });
      }
    }
  });
  
  // Проверяем поддержку уведомлений
  if ('Notification' in window) {
    // Если разрешение еще не запрошено, запрашиваем через 3 секунды
    if (Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission().then(permission => {
          console.log('Разрешение на уведомления:', permission);
          if (permission === 'granted') {
            new Notification('✅ Уведомления включены', {
              body: 'Теперь вы будете получать напоминания каждые 10 секунд'
            });
          }
        });
      }, 3000);
    }
  }
}

// Функция для тестирования уведомлений (можно вызвать из консоли)
window.testNotification = function() {
  if (Notification.permission === 'granted') {
    new Notification('🔔 Тестовое уведомление', {
      body: 'Если вы видите это сообщение, уведомления работают!'
    });
    console.log('Тестовое уведомление отправлено');
  } else {
    console.log('Нет разрешения на уведомления');
  }
};
