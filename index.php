<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Мое расписание</title>
    <link rel="manifest" href="manifest.json">
    <link rel="stylesheet" href="style.css">
    <meta name="theme-color" content="#667eea">
</head>
<body>
    <div class="container">
        <header>
            <h1>📅 Мое расписание</h1>
            <button id="notificationBtn" class="notif-btn">🔔 Включить уведомления</button>
        </header>

        <div class="add-task-form">
            <input type="text" id="taskTitle" placeholder="Название задачи" maxlength="100">
            <input type="datetime-local" id="taskDateTime">
            <button id="addTaskBtn" class="btn-primary">➕ Добавить задачу</button>
        </div>

        <div class="filters">
            <button class="filter-btn active" data-filter="all">Все</button>
            <button class="filter-btn" data-filter="active">Активные</button>
            <button class="filter-btn" data-filter="completed">Выполненные</button>
        </div>

        <div id="tasksList" class="tasks-list">
            <div class="empty-state">Загрузка задач...</div>
        </div>
    </div>

    <div id="editModal" class="modal">
        <div class="modal-content">
            <h3>Редактировать задачу</h3>
            <input type="text" id="editTitle" class="edit-input">
            <div class="modal-buttons">
                <button id="saveEditBtn" class="btn-primary">Сохранить</button>
                <button id="closeModalBtn" class="btn-secondary">Отмена</button>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('SW registered:', reg))
                .catch(err => console.log('SW error:', err));
        }
    </script>
</body>
</html>