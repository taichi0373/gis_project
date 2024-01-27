<?php
// FILEPATH: /C:/xampp/htdocs/sqlite_gis/create_db.php

// SQLite データベースファイルのパスとファイル名
$db_path = './server/database/gis.sqlite';

// SQLite3 オブジェクトを作成し、データベースに接続
$pdo = new SQLite3($db_path);

// ./table　の中にあるsqlファイルを読み込み、実行する
$pdo->exec(file_get_contents('./table/traffic_accident_kumamoto.sql'));
// $pdo->exec(file_get_contents('./table/risk_kumamoto.sql'));
// $pdo->exec(file_get_contents('./table/mesh4_polygon_kumamoto.sql'));
$pdo->exec(file_get_contents('./table/comments.sql'));
$pdo->exec(file_get_contents('./table/users.sql'));




// Close the database connection
$pdo = null;

echo "Database created successfully!";
