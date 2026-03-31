<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['title']) && isset($data['dateTime'])) {
    $title = trim($data['title']);
    $dateTime = $data['dateTime'];
    
    if (!empty($title) && !empty($dateTime)) {
        if (addTask($title, $dateTime)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Ошибка сохранения']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Заполните все поля']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Не переданы данные']);
}
?>