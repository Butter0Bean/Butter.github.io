<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['id']) && isset($data['title'])) {
    $id = (int)$data['id'];
    $title = trim($data['title']);
    
    if (!empty($title)) {
        if (updateTaskTitle($id, $title)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false]);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Название не может быть пустым']);
    }
} else {
    echo json_encode(['success' => false]);
}
?>