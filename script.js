// Класс для управления уведомлениями
class NotificationManager {
    constructor() {
        this.isEnabled = false;
        this.permission = Notification.permission;
        this.init();
    }

    async init() {
        const savedState = localStorage.getItem('notifications_enabled');
        this.isEnabled = savedState === 'true' && this.permission === 'granted';
        this.updateUI();
        
        if (this.permission === 'granted' && savedState !== 'true') {
            this.isEnabled = true;
            localStorage.setItem('notifications_enabled', 'true');
            this.updateUI();
        }
    }

    async requestPermission() {
        if (this.permission === 'granted') {
            this.enable();
            return true;
        }

        if (this.permission === 'denied') {
            alert('Уведомления заблокированы. Включите их в настройках браузера.');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.enable();
                this.sendNotification('✅ Уведомления включены', 'Теперь вы будете получать напоминания о задачах');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка:', error);
            return false;
        }
    }

    enable() {
        this.isEnabled = true;
        localStorage.setItem('notifications_enabled', 'true');
        this.updateUI();
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
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                vibrate: [200, 100, 200],
                ...options
            });
            setTimeout(() => notification.close(), 5000);
            return true;
        } catch (error) {
            console.error('Ошибка:', error);
            return false;
        }
    }

    updateUI() {
        const btn = document.getElementById('notificationBtn');
        const status = document.getElementById('notificationStatus');
        
        if (btn) {
            if (this.isEnabled && this.permission === 'granted') {
                btn.textContent = '🔕 Выключить уведомления';
                btn.classList.add('notification-enabled');
                if (status) status.textContent = '✅ Уведомления включены';
            } else if (this.permission === 'denied') {
                btn.textContent = '🔔 Уведомления заблокированы';
                btn.disabled = true;
                if (status) status.textContent = '❌ Уведомления заблокированы';
            } else {
                btn.textContent = '🔔 Включить уведомления';
                btn.classList.remove('notification-enabled');
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
        this.startReminderInterval();
        this.startOverdueCheck();
    }

    loadTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.updateStats();
    }

    // Добавление задачи с дедлайном
    addTask(text, deadline = null) {
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            deadline: deadline ? new Date(deadline).toISOString() : null,
            overdueNotified: false
        };
        this.tasks.push(task);
        this.saveTasks();
        this.render();
        
        // Уведомление о добавлении
        if (deadline) {
            const deadlineDate = new Date(deadline);
            const formattedDeadline = deadlineDate.toLocaleString('ru-RU');
            this.notificationManager.sendNotification(
                '📝 Новая задача с дедлайном',
                `"${text}"\n⏰ Дедлайн: ${formattedDeadline}`
            );
        } else {
            this.notificationManager.sendNotification(
                '📝 Новая задача',
                `Добавлена задача: "${text}"`
            );
        }
        
        // Напоминание о дедлайне
        if (deadline) {
            this.scheduleDeadlineReminder(task);
        }
    }

    // Планирование напоминания о дедлайне
    scheduleDeadlineReminder(task) {
        if (!task.deadline) return;
        
        const interval = setInterval(() => {
            const currentTask = this.tasks.find(t => t.id === task.id);
            if (!currentTask || currentTask.completed) {
                clearInterval(interval);
                return;
            }
            
            const now = new Date();
            const deadline = new Date(currentTask.deadline);
            const timeLeft = deadline - now;
            
            // Если задача просрочена
            if (timeLeft < 0 && !currentTask.overdueNotified) {
                this.notificationManager.sendNotification(
                    '⚠️ ЗАДАЧА ПРОСРОЧЕНА!',
                    `"${currentTask.text}"\nДедлайн был ${deadline.toLocaleString('ru-RU')}`
                );
                currentTask.overdueNotified = true;
                this.saveTasks();
                this.render();
                clearInterval(interval);
            }
            // Если до дедлайна осталось меньше 10 минут
            else if (timeLeft > 0 && timeLeft < 600000 && !currentTask.overdueNotified) {
                const minutesLeft = Math.floor(timeLeft / 60000);
                this.notificationManager.sendNotification(
                    '⏰ СКОРО ДЕДЛАЙН!',
                    `"${currentTask.text}"\nОсталось ${minutesLeft} минут(ы)`
                );
                currentTask.overdueNotified = true;
                this.saveTasks();
                clearInterval(interval);
            }
        }, 180000); // 3 минуты
    }

    // Проверка просроченных задач каждую минуту
    startOverdueCheck() {
        setInterval(() => {
            this.tasks.forEach(task => {
                if (!task.completed && task.deadline) {
                    const now = new Date();
                    const deadline = new Date(task.deadline);
                    
                    if (now > deadline) {
                        if (!task.overdueNotified) {
                            this.notificationManager.sendNotification(
                                '⚠️ ЗАДАЧА ПРОСРОЧЕНА!',
                                `"${task.text}"\nДедлайн был ${deadline.toLocaleString('ru-RU')}`
                            );
                            task.overdueNotified = true;
                            this.saveTasks();
                            this.render();
                        }
                    } else {
                        if (task.overdueNotified && now < deadline) {
                            task.overdueNotified = false;
                            this.saveTasks();
                        }
                    }
                }
            });
        }, 60000);
    }

    // Запуск напоминаний каждые 3 минуты
    startReminderInterval() {
        setInterval(() => {
            if (this.notificationManager.isEnabled) {
                const activeTasks = this.tasks.filter(task => !task.completed);
                const overdueTasks = this.getOverdueTasks();
                
                if (overdueTasks.length > 0) {
                    const taskList = overdueTasks.map(t => `⚠️ ${t.text}`).join('\n');
                    this.notificationManager.sendNotification(
                        '⚠️ Просроченные задачи',
                        `У вас ${overdueTasks.length} просроченных ${this.getTaskWord(overdueTasks.length)}:\n${taskList}`
                    );
                } else if (activeTasks.length > 0) {
                    const taskList = activeTasks.slice(0, 5).map(t => `• ${t.text}`).join('\n');
                    const moreText = activeTasks.length > 5 ? `\n...и еще ${activeTasks.length - 5}` : '';
                    this.notificationManager.sendNotification(
                        '📋 Активные задачи',
                        `У вас ${activeTasks.length} ${this.getTaskWord(activeTasks.length)}:\n${taskList}${moreText}`
                    );
                }
            }
        }, 180000); // 3 минуты
    }

    getOverdueTasks() {
        const now = new Date();
        return this.tasks.filter(task => 
            !task.completed && 
            task.deadline && 
            new Date(task.deadline) < now
        );
    }

    deleteTask(id) {
        const task = this.tasks.find(task => task.id === id);
        const taskText = task ? task.text : '';
        
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.render();
        
        if (taskText) {
            this.notificationManager.sendNotification(
                '🗑️ Задача удалена',
                `Удалена задача: "${taskText}"`
            );
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            if (task.completed && task.deadline) {
                const deadline = new Date(task.deadline);
                const now = new Date();
                if (now > deadline) {
                    this.notificationManager.sendNotification(
                        '🎉 Просроченная задача выполнена!',
                        `Поздравляю! Вы выполнили просроченную задачу: "${task.text}"`
                    );
                } else {
                    this.notificationManager.sendNotification(
                        '✅ Задача выполнена',
                        `Поздравляю! Вы выполнили задачу: "${task.text}"`
                    );
                }
            } else if (task.completed) {
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
            this.saveTasks();
            this.render();
        }
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.render();
        
        if (completedCount > 0) {
            this.notificationManager.sendNotification(
                '🧹 Очистка задач',
                `Удалено ${completedCount} выполненных ${this.getTaskWord(completedCount)}`
            );
        }
    }

    getTaskWord(count) {
        if (count % 10 === 1 && count % 100 !== 11) return 'задача';
        if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'задачи';
        return 'задач';
    }

    getFilteredTasks() {
        const now = new Date();
        switch(this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'overdue':
                return this.tasks.filter(task => 
                    !task.completed && 
                    task.deadline && 
                    new Date(task.deadline) < now
                );
            default:
                return this.tasks;
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const active = total - completed;
        const overdue = this.getOverdueTasks().length;
        
        const taskCount = document.getElementById('taskCount');
        const overdueCount = document.getElementById('overdueCount');
        
        if (taskCount) {
            taskCount.textContent = `📊 Всего: ${total} | Активных: ${active} | Выполнено: ${completed}`;
        }
        
        if (overdueCount) {
            if (overdue > 0) {
                overdueCount.textContent = `⚠️ Просрочено: ${overdue}`;
                overdueCount.style.animation = 'pulse 1s ease-in-out infinite';
            } else {
                overdueCount.textContent = '✅ Нет просроченных';
                overdueCount.style.animation = 'none';
            }
        }
    }

    formatDeadline(deadline) {
        if (!deadline) return null;
        const date = new Date(deadline);
        const now = new Date();
        const isOverdue = date < now;
        
        const formatted = date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return { formatted, isOverdue };
    }

    render() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            let emptyMessage = '✨ Нет задач';
            if (this.currentFilter === 'overdue') emptyMessage = '🎉 Нет просроченных задач!';
            if (this.currentFilter === 'completed') emptyMessage = '📝 Нет выполненных задач';
            if (this.currentFilter === 'active') emptyMessage = '🚀 Все задачи выполнены!';
            taskList.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
            this.updateStats();
            return;
        }
        
        taskList.innerHTML = filteredTasks.map(task => {
            const deadlineInfo = task.deadline ? this.formatDeadline(task.deadline) : null;
            const isOverdue = deadlineInfo && deadlineInfo.isOverdue && !task.completed;
            
            return `
                <li class="task-item ${isOverdue ? 'overdue' : ''}" data-id="${task.id}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</span>
                        ${deadlineInfo ? `
                            <div class="task-deadline ${isOverdue ? 'overdue' : ''}">
                                ${isOverdue ? '⚠️ Просрочено: ' : '⏰ Дедлайн: '}
                                ${deadlineInfo.formatted}
                            </div>
                        ` : ''}
                    </div>
                    <button class="delete-btn">🗑️</button>
                </li>
            `;
        }).join('');
        
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
        
        const addBtn = document.getElementById('addBtn');
        const taskInput = document.getElementById('taskInput');
        const deadlineInput = document.getElementById('taskDeadline');
        
        addBtn.addEventListener('click', () => {
            const text = taskInput.value.trim();
            if (text) {
                const deadline = deadlineInput.value;
                this.addTask(text, deadline || null);
                taskInput.value = '';
                deadlineInput.value = '';
                taskInput.focus();
            } else {
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
        
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });
        
        const clearCompleted = document.getElementById('clearCompleted');
        if (clearCompleted) {
            clearCompleted.addEventListener('click', () => this.clearCompleted());
        }
        
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.notificationManager.toggle();
            });
        }
    }
}

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker зарегистрирован: ', registration.scope);
            })
            .catch(error => {
                console
