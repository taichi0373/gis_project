<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $layer_values_json = $_POST['value'];
    $selected_year = $_POST['selected_year'];

    $selected_layer = json_decode($layer_values_json, true);

    $array = [
        "2019" => "strftime('%Y', occurrence_time) = '2019'",
        "2020" => "strftime('%Y', occurrence_time) = '2020'",
        "2021" => "strftime('%Y', occurrence_time) = '2021'",
        "2022" => "strftime('%Y', occurrence_time) = '2022'",

        "tc_ac_time1" => "strftime('%H:%M:%S', occurrence_time) >= '05:00:00' AND strftime('%H:%M:%S', occurrence_time) < '11:00:00'",
        "tc_ac_time2" => "strftime('%H:%M:%S', occurrence_time) >= '11:00:00' AND strftime('%H:%M:%S', occurrence_time) < '16:00:00'",
        "tc_ac_time3" => "strftime('%H:%M:%S', occurrence_time) >= '16:00:00' AND strftime('%H:%M:%S', occurrence_time) < '19:00:00'",
        "tc_ac_time4" => "(strftime('%H:%M:%S', occurrence_time) >= '19:00:00' OR strftime('%H:%M:%S', occurrence_time) < '05:00:00')",

        "age_a" => "(age_a = '1' OR age_b = '1')",
        "age_b" => "(age_a = '25' OR age_b = '25')",
        "age3" => "(age_a = '35' OR age_b = '35')",
        "age4" => "(age_a = '45' OR age_b = '45')",
        "age5" => "(age_a = '55' OR age_b = '55')",
        "age6" => "(age_a = '65' OR age_b = '65')",
        "age7" => "(age_a = '75' OR age_b = '75')",
        "age8" => "(age_a = '0' OR age_b = '0')",

        "tc_light1" => "traffic_light <> '7'",
        "tc_light2" => "traffic_light = '7'",

        "monday" => "day_of_week = '2'",
        "tuesday" => "day_of_week = '3'",
        "wednesday" => "day_of_week = '4'",
        "thursday" => "day_of_week = '5'",
        "friday" => "day_of_week = '6'",
        "saturday" => "day_of_week = '7'",
        "sunday" => "day_of_week = '1'",

        "weather1" => "weather = '1'",
        "weather2" => "weather = '2'",
        "weather3" => "weather = '3'",
        "weather4" => "weather = '4'",
        "weather5" => "weather = '5'",

        "road_shape1" => "(road_shape = '1' OR road_shape = '7' OR road_shape = '31' OR road_shape = '37')",
        "road_shape2" => "(road_shape >= '11' AND road_shape <= '14')",
        "road_shape3" => "(road_shape >= '21' AND road_shape <= '23')",
        "road_shape4" => "road_shape = '0'",

        "accident_type1" => "accident_type = '1'",
        "accident_type2" => "accident_type = '21'",
        "accident_type3" => "accident_type = '41'",
        "accident_type4" => "accident_type = '61'",

        "accident_detail1" => "injury_degree_a = '1' OR injury_degree_b = '1'",
        "accident_detail2" => "injury_degree_a = '2' OR injury_degree_b = '2'",
        "accident_detail3" => "injury_degree_a = '4' AND injury_degree_b = '4'",

        "sidewalk_road_division1" => "sidewalk_road_division = '1'",
        "sidewalk_road_division2" => "sidewalk_road_division = '2'",
        "sidewalk_road_division3" => "sidewalk_road_division = '3'",
        "sidewalk_road_division4" => "sidewalk_road_division = '4'",
    ];

    // データベースに接続
    $conn = new SQLite3('./database/gis.sqlite');

    // 接続エラーの確認
    if ($conn->lastErrorMsg() != 'not an error') {
        die("接続に失敗しました: " . $conn->lastErrorMsg());
    }

    $orConditions = array(); // OR 条件を格納する配列を初期化

    // 2重構造の配列をforループで処理
    if (!empty($selected_layer)) {
        foreach ($selected_layer as $layerNumber => $values) {
            $orConditionsLayer = array(); // 各レイヤーごとの OR 条件を格納する配列を初期化

            foreach ($values as $value) {
                if (isset($array[$value])) {
                    $orConditionsLayer[] = '(' . $array[$value] . ')';
                }
            }

            if (!empty($orConditionsLayer)) {
                $orConditions[] = '(' . implode(' OR ', $orConditionsLayer) . ')';
            }
        }
        if (isset($array[$selected_year])) {
            $orConditions[] = $array[$selected_year];
        }
        // 最終的なクエリを組み立てる
        $sqlQuery = "SELECT * FROM traffic_accident_kumamoto WHERE " . implode(' AND ', $orConditions);

        // echo $sqlQuery;
        // クエリを実行して結果を取得
        $result = $conn->query($sqlQuery);

        // 結果を配列に格納
        $coordinates = array();
        while ($row = $result->fetchArray()) {
            $coordinates[] = array(
                'id' => $row['id'], 'city_code' => $row['city_code'], 'occurrence_time' => $row['occurrence_time'],
                'traffic_light' => $row['traffic_light'], 'day_of_week' => $row['day_of_week'], 'age_a' => $row['age_a'], 'age_b' => $row['age_b'],
                'weather' => $row['weather'], 'road_shape' => $row['road_shape'], 'accident_type' => $row['accident_type'], 'sidewalk_road_division' => $row['sidewalk_road_division'],
                'injury_degree_a' => $row['injury_degree_a'], 'injury_degree_b' => $row['injury_degree_b'], 'latitude' => $row['latitude'], 'longitude' => $row['longitude']
            );
        }
        // データベース接続を閉じる
        $conn->close();

        // 応答データの作成
        $responseData = ['status' => 'success', 'coordinates' => $coordinates];
        $jsonResponse = json_encode($responseData);
        echo $jsonResponse;
    }
}
