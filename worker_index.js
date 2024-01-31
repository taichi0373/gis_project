// worker_accident.js
function GPSMarkerOptions1() {
  return {
    radius: 4,
    fillColor: "red",
    color: "red",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };
}
function GPSMarkerOptions2() {
  return {
    radius: 4,
    fillColor: "#DEB887",
    color: "#D2691E",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };
}
function GPSMarkerOptions3() {
  return {
    radius: 4,
    fillColor: "#66CCFF",
    color: "#3399FF",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };
}
// マーカー表示登録
var markers_dict = {
  1: GPSMarkerOptions1(),
  2: GPSMarkerOptions2(),
  4: GPSMarkerOptions3()
};
const defaultGPSMarkerOptions = GPSMarkerOptions3();
function getMarkerOptionsByKey(key) {
  return markers_dict[key] || defaultGPSMarkerOptions;
}

var address_dict = {
  100: "熊本市",
  101: "中央区",
  102: "東区",
  103: "西区",
  104: "南区",
  105: "北区",
  202: "八代市",
  203: "人吉市",
  204: "荒尾市",
  205: "水俣市",
  206: "玉名市",
  208: "山鹿市",
  210: "菊池市",
  211: "宇土市",
  212: "上天草市",
  213: "宇城市",
  214: "阿蘇市",
  215: "天草市",
  216: "合志市",
  364: "玉名郡玉東町",
  367: "玉名郡南関町",
  368: "玉名郡長洲町",
  369: "玉名郡和水町",
  403: "菊池郡大津町",
  406: "菊池郡菊陽町",
  423: "阿蘇郡南小国町",
  424: "阿蘇郡小国町",
  425: "阿蘇郡産山村",
  428: "阿蘇郡高森町",
  432: "阿蘇郡西原村",
  433: "阿蘇郡南阿蘇村",
  441: "上益城郡御船町",
  442: "上益城郡嘉島町",
  443: "上益城郡益城町",
  444: "上益城郡甲佐町",
  447: "上益城郡山都町",
  348: "下益城郡美里町",
  468: "八代郡氷川町",
  482: "葦北郡芦北町",
  484: "葦北郡津奈木町",
  501: "球磨郡錦町",
  505: "球磨郡多良木町",
  506: "球磨郡湯前町",
  507: "球磨郡水上村",
  510: "球磨郡相良村",
  511: "球磨郡五木村",
  512: "球磨郡山江村",
  513: "球磨郡球磨村",
  514: "球磨郡あさぎり町",
  531: "天草郡苓北町",
};
var day_of_week_dict = {
  1: "日",
  2: "月",
  3: "火",
  4: "水",
  5: "木",
  6: "金",
  7: "土",
};
var traffic_light_dict = {
  1: "あり",
  2: "あり",
  3: "あり",
  4: "あり",
  5: "あり（消灯）",
  6: "あり（故障）",
  7: "なし",
  8: "あり",
};
var road_shape_dict = {
  31: "交差点－環状交差点",
  1: "交差点",
  37: "交差点付近－環状交差点付近",
  7: "交差点付近－その他",
  11: "単路－トンネル",
  12: "単路－橋",
  13: "単路－カーブ・屈折",
  14: "単路－その他",
  21: "踏切－第一種",
  22: "踏切－第三種",
  23: "踏切－第四種",
  0: "一般交通の場所",
};
var personal_injury_dict = {
  1: "死亡",
  2: "負傷",
  4: "損傷なし",
  0: "対象外当事者",
};
var accident_type_dict = {
  1: "人対車両",
  21: "車両相互",
  41: "車両単独",
  61: "列車",
};
var weather_dict = {
  1: "晴れ",
  2: "曇り",
  3: "雨",
  4: "霧",
  5: "雪",
};
var sidewalk_road_division_dict = {
  1: "防護柵等",
  2: "縁石・ブロック等",
  3: "路側帯",
  4: "歩道なし",
};
// メッセージを受信した際の処理
self.addEventListener("message", function (event) {
  const layer_values = event.data.layer;
  const year_value = event.data.year;

  let fd = new FormData();
  fd.append("value", JSON.stringify(layer_values));
  fd.append("selected_year", year_value);
  const url = "server/server_index.php";
  // FetchAPIを使用してPOSTリクエストを送信
  fetch(url, {
    method: "POST",
    body: fd,
  })
    .then(response => response.json())
    .then($jsonResponse => {
      if ($jsonResponse.status === "success") {
        const coordinates = $jsonResponse.coordinates;
        for (const coord of coordinates) {
          const datetime_data = coord.occurrence_time.split(" ");
          const time = datetime_data[1].split(":");
          const map_url = `https://www.google.com/maps/@?api=1&map_action=pano&parameters&viewpoint=${coord.latitude},${coord.longitude}&heading=-90&fov=40`;
          const popup = `
                                      <div id='popup-content'>
                                        <div id='page-1'>
                                          <table class="table table-striped">
                                            <tbody>
                                              <tr>
                                                <th>市区町村</th>
                                                  <td>${address_dict[
            coord.city_code
            ]
            }</td>
                                                  </tr>
                                                  <tr>
                                                  <th>発生日</th>
                                                  <td>${datetime_data[0].replace(
              /-/g,
              "/"
            )}</td>
                                                  </tr>
                                                  <tr>
                                                  <th>発生日時</th>
                                                  <td>${time[0]}時${time[1]
            }分</td>
                                                  </tr>
                                                  <tr>
                                                  <th>曜日</th>
                                                  <td>${day_of_week_dict[
            coord.day_of_week
            ]
            }曜日</td>
                                                  </tr>
                                                  <tr>
                                                  <th>天候</th>
                                                  <td>${weather_dict[coord.weather]
            }</td>
                                                  </tr>
                                                  <tr>
                                                  <th>事故内容</th>
                                                  <td>${accident_type_dict[
            coord.accident_type
            ]
            }</td>
                                                  </tr>
                                                  <tr>
                                                  <th>道路形状</th>
                                                  <td>${road_shape_dict[
            coord.road_shape
            ]
            }</td>
                                                  </tr>
                                                  <tr>
                                                  <th>信号機</th>
                                                  <td>${traffic_light_dict[
            coord.traffic_light
            ]
            }</td>
                                                  </tr>
                                                  <tr>
                                                  <th>当事者A</th>
                                                  <td>${personal_injury_dict[
            coord.injury_degree_a
            ]
            }</td>
                                                  </tr>
                                                  <tr>
                                                  <th>当事者B</th>
                                                  <td>${personal_injury_dict[
            coord.injury_degree_b
            ]
            }</td>
                                                  </tr>
                                                  <tr>
                                                  <th>Google map</th>
                                                  <td>
                                                    <a href=${map_url}>ストリートビュー</a>
                                                  </td>
                                                  </tr>
                                              </tbody>
                                              </table>
                                              <button type="button" class="btn btn-outline-dark" onclick='showPage(2, ${coord.id
            })' style="width:60%;">次のページ</button>
                                            </div>

                                            <div id='page-2' style='display: none; width:100%; height:400px;'>
                                              <div class="pt-0 pb-1" id="comment-area" style="width:100%; height: 65%; overflow-y: auto;">
                                              </div>
                                              <div class="form-comments" style="width:100%; height: auto;">
                                                <label for="comment" class="form-label mt-1 mb-1">コメント</label>
                                                <textarea class="form-control mb-2 mt-0" id="comment" rows="3" placeholder="実際に感じた危険な点や、注意点を書いて下さい" style="font-size:12px;"></textarea>
                                                <button type="button" class="btn btn-outline-dark me-2" onclick='showPage(1)' style="width:80px;">戻る</button>
                                                <button id="comment-submit" onclick='submitComment(${coord.id}, ${coord.latitude}, ${coord.longitude})' type="button" class="btn btn-outline-primary" style="width:80px;">書き込む</button>
                                              </div>
                                            </div>
                                        </div>
                                          `;
          let injury_degree = ""
          if (coord.injury_degree_a == 1 || coord.injury_degree_b == 1) {
            injury_degree = 1
          } else if (coord.injury_degree_a == 2 || coord.injury_degree_b == 2) {
            injury_degree = 2
          } else {
            injury_degree = 4
          }
          // データをメインスレッドに送信
          self.postMessage({
            status: $jsonResponse.status,
            latitude: coord.latitude,
            longitude: coord.longitude,
            markerOptions: getMarkerOptionsByKey([
              injury_degree
            ]),
            popup: popup,
            year: year_value,
            id: coord.id,
          });
        }
      } else {
        self.postMessage({
          status: "error",
        });
      }
    })
    .catch(error => {
      self.postMessage({
        status: "error",
      });
    });
});
