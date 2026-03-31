<?php
// Настройки для BeGet
$host = 'localhost';  // На BeGet обычно localhost
$dbname = 'ваше_имя_базы';  // Замените на имя вашей базы данных
$username = 'ваше_имя_пользователя';  // Замените на имя пользователя
$password = 'ваш_пароль';  // Замените на пароль

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die(json_encode(['error' => 'Ошибка подключения к базе данных: ' . $e->getMessage()]));
}

// Функции для работы с задачами
function getAllTasks() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM tasks ORDER BY date_time ASC");
    return $stmt->fetchAll();
}

function addTask($title, $dateTime) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO tasks (title, date_time) VALUES (?, ?)");
    return $stmt->execute([$title, $dateTime]);
}

function toggleTask($id, $completed) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE tasks SET completed = ? WHERE id = ?");
    return $stmt->execute([$completed, $id]);
}

function deleteTask($id) {
    global $pdo;
    $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
    return $stmt->execute([$id]);
}

function updateTaskTitle($id, $title) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE tasks SET title = ? WHERE id = ?");
    return $stmt->execute([$title, $id]);
}
?>