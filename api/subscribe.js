// api/subscribe.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const subscription = req.body;
      
      // Сохраняем подписку (в реальном проекте сохраняйте в базу данных)
      // Для простоты сохраняем в память (но после перезапуска сервера данные пропадут)
      if (!global.subscriptions) {
        global.subscriptions = [];
      }
      
      global.subscriptions.push(subscription);
      
      res.status(201).json({ message: 'Subscription saved!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
