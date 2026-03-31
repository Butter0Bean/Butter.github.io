let currentFilter = 'all';
let editingTaskId = null;

// Загрузка задач
function loadTasks() {
    fetch(`get_tasks.php?filter=${currentFilter}`)
        .then(response => response.json())
        .then(tasks => {
            renderTasks(tasks);
        })
        .catch(error => console.error('Error loading tasks:', error));
}

// Отображение задач
function renderTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-state">✨ Нет задач. Добавьте новую задачу!</div>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <div class="task-title">${escapeHtml(task.title)}</div>
            </div>
            <div class="task-datetime">
                📅 ${task.formatted_date}
                <span style="margin-left: 10px; font-weight: bold;">${task.time_remaining}</span>
            </div>
            <div class="task-actions">
                <button class="edit-btn" data-id="${task.id}" data-title="${escapeHtml(task.title)}">✏️ Редактировать</button>
                <button class="delete-btn" data-id="${task.id}">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleTask(parseInt(this.dataset.id), this.checked);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showEditModal(parseInt(this.dataset.id), this.dataset.title);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteTask(parseInt(this.dataset.id));
        });
    });
}

// Добавление задачи
function addTask() {
    const title = document.getElementById('taskTitle').value;
    const dateTime = document.getElementById('taskDateTime').value;
    
    if (!title.trim()) {
        alert('Введите название задачи');
        return;
    }
    
    if (!dateTime) {
        alert('Выберите дату и время');
        return;
    }
    
    fetch('add_task.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), dateTime: dateTime })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('taskTitle').value = '';
            setDefaultDateTime();
            loadTasks();
        } else {
            alert('Ошибка: ' + (data.error || 'Не удалось добавить задачу'));
        }
    })
    .catch(error => console.error('Error adding task:', error));
}

// Переключение статуса
function toggleTask(id, completed) {
    fetch('toggle_task.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, completed: completed ? 1 : 0 })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadTasks();
            if (completed) {
                showNotification('Задача выполнена', 'Отлично!');
            }
        }
    })
    .catch(error => console.error('Error toggling task:', error));
}

// Удаление задачи
function deleteTask(id) {
    if (!confirm('Удалить задачу?')) return;
    
    fetch('delete_task.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadTasks();
        }
    })
    .catch(error => console.error('Error deleting task:', error));
}

// Редактирование задачи
function editTask(id, title) {
    if (!title.trim()) {
        alert('Название не может быть пустым');
        return;
    }
    
    fetch('edit_task.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, title: title.trim() })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadTasks();
            closeModal();
        } else {
            alert('Ошибка: ' + (data.error || 'Не удалось редактировать задачу'));
        }
    })
    .catch(error => console.error('Error editing task:', error));
}

// Показать модальное окно редактирования
function showEditModal(id, title) {
    editingTaskId = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editModal').style.display = 'flex';
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    editingTaskId = null;
}

// Установка даты по умолчанию
function setDefaultDateTime() {
    const input = document.getElementById('taskDateTime');
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    input.value = now.toISOString().slice(0, 16);
    input.min = new Date().toISOString().slice(0, 16);
}

// Уведомления
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Ваш браузер не поддерживает уведомления');
        return;
    }
    
    if (Notification.permission === 'granted') {
        alert('Уведомления уже включены');
        return;
    }
    
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            const btn = document.getElementById('notificationBtn');
            btn.textContent = '🔔 Уведомления включены';
            new Notification('Уведомления включены', {
                body: 'Вы будете получать напоминания о задачах'
            });
        }
    });
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body: body });
    }
}

// Проверка напоминаний
function checkReminders() {
    fetch('get_tasks.php?filter=active')
        .then(response => response.json())
        .then(tasks => {
            const now = new Date();
            tasks.forEach(task => {
                const taskTime = new Date(task.date_time);
                const diff = taskTime - now;
                
                if (diff > 0 && diff <= 5 * 60 * 1000) {
                    const key = `reminded_${task.id}`;
                    if (!localStorage.getItem(key)) {
                        showNotification('🔔 Напоминание', `"${task.title}" через ${Math.ceil(diff/60000)} минут!`);
                        localStorage.setItem(key, 'true');
                    }
                }
            });
        });
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    setDefaultDateTime();
    loadTasks();
    
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('notificationBtn').addEventListener('click', requestNotificationPermission);
    document.getElementById('saveEditBtn').addEventListener('click', () => {
        if (editingTaskId) {
            editTask(editingTaskId, document.getElementById('editTitle').value);
        }
    });
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadTasks();
        });
    });
    
    document.getElementById('taskTitle').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    setInterval(checkReminders, 60000);
    
    if (Notification.permission === 'granted') {
        document.getElementById('notificationBtn').textContent = '🔔 Уведомления включены';
    }
});