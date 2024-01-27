<?php

// Connect to the SQLite database
$database = new SQLite3('./server/database/gis.sqlite');

// Get the list of tables in the database
$tablesQuery = $database->query("SELECT name FROM sqlite_master WHERE type='table'");
$tables = [];
while ($row = $tablesQuery->fetchArray(SQLITE3_ASSOC)) {
    $tables[] = $row['name'];
}

// Display the tables and their data
foreach ($tables as $table) {
    echo "Table: $table\n";

    // Get the data from the table
    $dataQuery = $database->query("SELECT * FROM $table");
    while ($row = $dataQuery->fetchArray(SQLITE3_ASSOC)) {
        echo json_encode($row) . "\n";
    }

    echo "\n";
}

// Close the database connection
$database->close();
?>
