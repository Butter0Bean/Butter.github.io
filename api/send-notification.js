// api/send-notification.js
import webpush from 'web-push';

// Настройки VAPID (сгенерируйте свои)
const vapidKeys = {
  publicKey: 'ВАШ_PUBLIC_KEY',
  privateKey: 'ВАШ_PRIVATE_KEY'
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { title, body, icon } = req.body;
      
      // Получаем все подписки
      const subscriptions = global.subscriptions || [];
      
      // Отправляем уведомления всем подписчикам
      const notifications = subscriptions.map(subscription => {
        return webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: title || 'TaskMaster',
            body: body || 'Напоминание о задачах',
            icon: icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            vibrate: [200, 100, 200]
          })
        ).catch(error => console.error('Error sending notification:', error));
      });
      
      await Promise.all(notifications);
      
      res.status(200).json({ message: 'Notifications sent!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
