// Класс для управления уведомлениями
class NotificationManager {
    constructor() {
        this.isEnabled = false;
        this.permission = Notification.permission;
        this.init();
    }

    async init() {
        // Проверяем, включены ли уведомления
        const savedState = localStorage.getItem('notifications_enabled');
        this.isEnabled = savedState === 'true' && this.permission === 'granted';
        
        // Обновляем UI
        this.updateUI();
        
        // Если разрешение уже дано, но состояние не сохранено
        if (this.permission === 'granted' && savedState !== 'true') {
            this.isEnabled = true;
            localStorage.setItem('notifications_enabled', 'true');
            this.updateUI();
        }
    }

    async requestPermission() {
        if (this.permission === 'granted') {
            // Если уже есть разрешение, просто включаем уведомления
            this.enable();
            return true;
        }

        if (this.permission === 'denied') {
            this.showNotificationGuide();
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.enable();
                this.showWelcomeNotification();
                return true;
            } else {
                this.showPermissionDenied();
                return false;
            }
        } catch (error) {
            console.error('Ошибка запроса разрешения:', error);
            return false;
        }
    }

    enable() {
        this.isEnabled = true;
        localStorage.setItem('notifications_enabled', 'true');
        this.updateUI();
        this.sendNotification('✅ Уведомления включены', 'Теперь вы будете получать напоминания о задачах');
    }

    disable() {
        this.isEnabled = false;
        localStorage.setItem('notifications_enabled', 'false');
        this.updateUI();
        this.sendNotification('🔕 Уведомления выключены', 'Вы больше не будете получать уведомления');
    }

    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.requestPermission();
        }
    }

    sendNotification(title, body, options = {}) {
        if (!this.isEnabled || this.permission !== 'granted') {
            return false;
        }

        try {
            const notification = new Notification(title, {
                body: body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200],
                ...options
            });

            // Автоматически закрыть через 5 секунд
            setTimeout(() => notification.close(), 5000);
            
            return true;
        } catch (error) {
            console.error('Ошибка отправки уведомления:', error);
            return false;
        }
    }

    showWelcomeNotification() {
        this.sendNotification(
            '🎉 Добро пожаловать!',
            'Теперь вы будете получать уведомления о задачах'
        );
    }

    showNotificationGuide() {
        const message = 'Уведомления заблокированы. Чтобы включить их, измените настройки сайта в браузере.';
        alert(message);
    }

    showPermissionDenied() {
        alert('Разрешение на уведомления не получено. Вы можете включить их в настройках браузера.');
    }

    updateUI() {
        const btn = document.getElementById('notificationBtn');
        const status = document.getElementById('notificationStatus');
        
        if (btn) {
            if (this.isEnabled && this.permission === 'granted') {
                btn.textContent = '🔕 Выключить уведомления';
                btn.classList.add('notification-enabled');
                btn.classList.remove('disabled');
                if (status) status.textContent = '✅ Уведомления включены';
            } else if (this.permission === 'denied') {
                btn.textContent = '🔔 Уведомления заблокированы';
                btn.classList.add('disabled');
                btn.disabled = true;
                if (status) status.textContent = '❌ Уведомления заблокированы в браузере';
            } else {
                btn.textContent = '🔔 Включить уведомления';
                btn.classList.remove('notification-enabled', 'disabled');
                btn.disabled = false;
                if (status) status.textContent = '⚠️ Уведомления отключены';
            }
        }
    }
}

// Класс для управления задачами
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.notificationManager = new NotificationManager();
        this.init();
    }

    // Загрузка задач из localStorage
    loadTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    // Сохранение задач в localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // Добавление задачи
    addTask(text) {
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.tasks.push(task);
        this.saveTasks();
        this.render();
        
        // Отправляем уведомление о добавлении задачи
        this.notificationManager.sendNotification(
            '📝 Новая задача',
            `Добавлена задача: "${text}"`
        );
        
        // Устанавливаем напоминание через 1 час (опционально)
        this.scheduleReminder(task);
    }

    // Удаление задачи
    deleteTask(id) {
        const task = this.tasks.find(task => task.id === id);
        const taskText = task ? task.text : '';
        
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.render();
        
        // Уведомление об удалении
        if (taskText) {
            this.notificationManager.sendNotification(
                '🗑️ Задача удалена',
                `Удалена задача: "${taskText}"`
            );
        }
    }

    // Переключение статуса задачи
    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
            
            // Уведомление о выполнении задачи
            if (task.completed) {
                this.notificationManager.sendNotification(
                    '✅ Задача выполнена',
                    `Поздравляю! Вы выполнили задачу: "${task.text}"`
                );
            } else {
                this.notificationManager.sendNotification(
                    '🔄 Задача возвращена',
                    `Задача снова в работе: "${task.text}"`
                );
            }
        }
    }

    // Очистка выполненных задач
    clearCompleted() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.render();
        
        // Уведомление об очистке
        if (completedCount > 0) {
            this.notificationManager.sendNotification(
                '🧹 Очистка задач',
                `Удалено ${completedCount} выполненных ${this.getTaskWord(completedCount)}`
            );
        }
    }

    // Напоминание о задаче (через 1 час)
    scheduleReminder(task) {
        if (!this.notificationManager.isEnabled) return;
        
        setTimeout(() => {
            // Проверяем, не выполнена ли задача
            const currentTask = this.tasks.find(t => t.id === task.id);
            if (currentTask && !currentTask.completed) {
                this.notificationManager.sendNotification(
                    '⏰ Напоминание о задаче',
                    `Не забыли про задачу: "${task.text}"?`
                );
            }
        }, 3600000); // 1 час
    }

    // Напоминание о всех невыполненных задачах
    remindAllTasks() {
        const activeTasks = this.tasks.filter(task => !task.completed);
        
        if (activeTasks.length > 0) {
            const taskList = activeTasks.map(t => `• ${t.text}`).join('\n');
            this.notificationManager.sendNotification(
                '📋 Невыполненные задачи',
                `У вас ${activeTasks.length} ${this.getTaskWord(activeTasks.length)}:\n${taskList}`,
                { body: `У вас ${activeTasks.length} ${this.getTaskWord(activeTasks.length)}` }
            );
        }
    }

    getTaskWord(count) {
        if (count % 10 === 1 && count % 100 !== 11) return 'задача';
        if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'задачи';
        return 'задач';
    }

    getFilteredTasks() {
        switch(this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const active = total - completed;
        
        const taskCount = document.getElementById('taskCount');
        if (taskCount) {
            if (total === 0) {
                taskCount.textContent = 'Нет задач';
            } else {
                taskCount.textContent = `Всего: ${total} | Активных: ${active} | Выполнено: ${completed}`;
            }
        }
    }

    render() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state">✨ Нет задач</div>';
            this.updateStats();
            return;
        }
        
        taskList.innerHTML = filteredTasks.map(task => `
            <li class="task-item" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</span>
                <button class="delete-btn">🗑️ Удалить</button>
            </li>
        `).join('');
        
        this.attachEventListeners();
        this.updateStats();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    attachEventListeners() {
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            const id = parseInt(item.dataset.id);
            const checkbox = item.querySelector('.task-checkbox');
            const deleteBtn = item.querySelector('.delete-btn');
            
            checkbox.addEventListener('change', () => this.toggleTask(id));
            deleteBtn.addEventListener('click', () => this.deleteTask(id));
        });
    }
    
    init() {
        this.render();
        
        // Добавление новой задачи
        const addBtn = document.getElementById('addBtn');
        const taskInput = document.getElementById('taskInput');
        
        addBtn.addEventListener('click', () => {
            const text = taskInput.value.trim();
            if (text) {
                this.addTask(text);
                taskInput.value = '';
                taskInput.focus();
            } else {
                // Уведомление о пустой задаче
                this.notificationManager.sendNotification(
                    '⚠️ Ошибка',
                    'Пожалуйста, введите текст задачи'
                );
            }
        });
        
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addBtn.click();
            }
        });
        
        // Фильтры
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });
        
        // Очистка выполненных
        const clearCompleted = document.getElementById('clearCompleted');
        if (clearCompleted) {
            clearCompleted.addEventListener('click', () => this.clearCompleted());
        }
        
        // Кнопка уведомлений
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.notificationManager.toggle();
            });
        }
        
        // Автоматическое напоминание каждые 30 минут (если уведомления включены)
        setInterval(() => {
            if (this.notificationManager.isEnabled && this.tasks.length > 0) {
                this.remindAllTasks();
            }
        }, 1800000); // 30 минут
    }
}

// Запуск приложения после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
