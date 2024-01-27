<?php

function connectToDatabase($servername, $username, $password, $dbname)
{
    try {
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        echo json_encode(array("success" => false, "message" => "エラー: " . $e->getMessage()));
        return null;
    }
}

function checkIfUsernameExists($conn, $username)
{
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = :username");
    $stmt->bindValue(':username', $username);
    $result = $stmt->execute();
    return $result->fetchArray() !== false;
}

function registerNewUser($conn, $username, $password)
{
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':password', $hashed_password);
    $stmt->execute();
}

// データベースに接続
$conn = new SQLite3('./database/gis.sqlite');

// 接続エラーの確認
if ($conn->lastErrorMsg() != 'not an error') {
    die("接続に失敗しました: " . $conn->lastErrorMsg());
}

if ($conn) {
    $username = $_POST['username'];

    if (checkIfUsernameExists($conn, $username)) {
        echo json_encode(array("success" => false, "message" => "ユーザー名が既に存在します。"));
    } else {
        registerNewUser($conn, $username, $_POST['password']);
        echo json_encode(array("success" => true));
    }

    $conn = null;
}
