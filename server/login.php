<?php

function connectToDatabase($host, $db, $user, $pass, $charset)
{
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $opt = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    return new PDO($dsn, $user, $pass, $opt);
}

function loginUser($conn, $username, $password)
{
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = :username");
    $stmt->bindValue(':username', $username);
    $result = $stmt->execute();

    if ($row = $result->fetchArray()) {
        return password_verify($password, $row['password']);
    }

    return false;
}

try {
    // データベースに接続
    $pdo = new SQLite3('./database/gis.sqlite');
} catch (Exception $e) {
    die("接続に失敗しました: " . $e->getMessage());
}

$username = $_POST['username'];
$password = $_POST['password'];

if (loginUser($pdo, $username, $password)) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'ユーザー名またはパスワードが違います']);
}
