<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

$filter = $_GET['filter'] ?? 'all';
$tasks = getAllTasks();

if ($filter === 'active') {
    $tasks = array_filter($tasks, fn($t) => $t['completed'] == 0);
} elseif ($filter === 'completed') {
    $tasks = array_filter($tasks, fn($t) => $t['completed'] == 1);
}

// Добавляем форматированное время
foreach ($tasks as &$task) {
    $task['formatted_date'] = date('d.m.Y H:i', strtotime($task['date_time']));
    $task['time_remaining'] = getTimeRemaining($task['date_time']);
}

echo json_encode(array_values($tasks));

function getTimeRemaining($dateTimeStr) {
    $date = new DateTime($dateTimeStr);
    $now = new DateTime();
    $diff = $now->diff($date);
    
    if ($diff->invert == 1) {
        return '📅 Просрочено';
    }
    
    if ($diff->days > 0) {
        return "⏰ Через {$diff->days} д. {$diff->h} ч.";
    } elseif ($diff->h > 0) {
        return "⏰ Через {$diff->h} ч. {$diff->i} мин.";
    } elseif ($diff->i > 0) {
        return "⏰ Через {$diff->i} мин.";
    } else {
        return '🔔 Скоро!';
    }
}
?>