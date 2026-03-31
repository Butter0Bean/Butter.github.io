// Класс для управления задачами
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
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
    }

    // Удаление задачи
    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.render();
    }

    // Переключение статуса задачи
    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    // Очистка выполненных задач
    clearCompleted() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.render();
    }

    // Получение отфильтрованных задач
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

    // Обновление счетчика задач
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

    // Отображение задач
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
        
        // Добавляем обработчики событий
        this.attachEventListeners();
        this.updateStats();
    }
    
    // Защита от XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Привязка обработчиков к элементам
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
    
    // Инициализация приложения
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
    }
}

// Запуск приложения после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
