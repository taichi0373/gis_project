// ログイン状態になったら、usernameを表示する
window.onload = function () {
  var username = localStorage.getItem("username");
  if (username) {
    var usernameElement = document.getElementById("username_link");
    var usernameElement_sm = document.getElementById("username_link-sm");
    usernameElement.textContent = username;
    usernameElement_sm.textContent = username;
  }
};
// ログイン状態をチェックする関数
function checkLoginStatus() {
  var username = localStorage.getItem("username");
  if (username) {
    return true;
  } else {
    return false;
  }
}
// ログアウトリンクがクリックされたときの処理
function logout() {
  var isLoggedIn = checkLoginStatus();
  if (!isLoggedIn) {
    alert("ログインしていません");
  } else {
    localStorage.removeItem("username");
    console.log("ログアウトしました");
    window.location.href = "index.html";
  }
}

// 改善案コメントページ遷移
function showPage(pageNumber, accident_id) {
  document.getElementById("page-1").style.display =
    pageNumber === 1 ? "block" : "none";
  document.getElementById("page-2").style.display =
    pageNumber === 2 ? "block" : "none";
  //pageNumber === 2だったら、accident_idを引数にしてコメントを取得する
  if (pageNumber === 2) {
    getComment(accident_id);
  }
}
// コメントをデータベースから取得し、表示する関数
function getComment(accident_id) {
  // 書き込むボタンをクリックできるようにする
  var editButton = document.getElementById(`comment-submit`);
  editButton.disabled = false;

  const url = "server/server_comments.php";
  const distances = [];
  // accident_idから事故の緯度経度を取得
  const fd1 = new FormData();
  fd1.append("job", "get_location");
  fd1.append("accident_id", accident_id);
  fetch(url, {
    method: "POST",
    body: fd1
  })
    .then((response) => response.json())
    .then(($jsonResponse) => {
      if ($jsonResponse.status === "success") {
        const coordinates = $jsonResponse.get_location;
        for (const coord of coordinates) {
          var accident_latitude = coord.latitude;
          var accident_longitude = coord.longitude;
          var radius_area = 0.01; // キロメートル（10メートル以内）

          //　半径radiusメートル以内のマーカーを緯度・経度から計算して取得
          var markers = MarkerLayer.getLayers();
          for (var i = 0; i < markers.length; i++) {
            var marker = markers[i]
            // 緯度経度をラジアンに変換
            const radLat1 = accident_latitude * (Math.PI / 180);
            const radLon1 = accident_longitude * (Math.PI / 180);
            const radLat2 = marker._latlng.lat * (Math.PI / 180);
            const radLon2 = marker._latlng.lng * (Math.PI / 180);

            // 差を計算
            const radLatDiff = radLat2 - radLat1;
            const radLonDiff = radLon2 - radLon1;

            // ハバースィンの公式を使用して球面三角法の距離を計算
            const a = Math.sin(radLatDiff / 2) ** 2 +
              Math.cos(radLat1) * Math.cos(radLat2) *
              Math.sin(radLonDiff / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            // 地球の半径を掛けて最終的な距離を計算
            const radius = 6371; // 地球の半径（km）
            const distance = radius * c;

            if (distance <= radius_area) {
              // distanceが小さい順にnear_markersにaccident_idをpushしたい
              distances.push({ distance: distance, accident_id: marker.accident_id });
            }
          }
        }
        // 距離でソート
        distances.sort((a, b) => a.distance - b.distance);
        // ソートされた配列からaccident_idを抽出してnear_markersに追加
        let near_markers = distances.map(item => item.accident_id);
        const fd2 = new FormData();
        fd2.append("job", "get_comments");
        fd2.append("accident_id", JSON.stringify(near_markers));

        fetch(url, {
          method: "POST",
          body: fd2
        })
          .then((response) => response.json())
          .then(($jsonResponse) => {
            if ($jsonResponse.status === "success") {
              // comment-areaの子要素を全て初期化
              var comment_area = document.getElementById("comment-area");
              while (comment_area.firstChild) {
                comment_area.removeChild(comment_area.firstChild);
              }
              // データベースから取得したコメントを表示
              const coordinates = $jsonResponse.comments;
              // let near_comment_check = false;
              for (const coord of coordinates) {
                const comment = coord.comment;
                const username = "(" + coord.username + ")".replace(/\((.+?)\)/, "( $1 )");
                const comment_id = coord.comment_id;
                const date = new Date(coord.date_comment);
                // 年月日を取得
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const hour = date.getHours();
                const minute = date.getMinutes();

                const comment_popup = document.createElement("div");
                // comment_popup.classList.add("comment-popup");
                const comment_title = document.createElement("div");
                comment_title.style.textAlign = "center";
                // コメントを表示
                comment_popup.innerHTML =
                  // コメント
                  `<p class="mt-1 mb-1" id="comment-form-${comment_id}" style="word-break: break-all;">` +
                  "・" +
                  comment +
                  "</p>" +
                  // 編集フォーム
                  `<textarea class="form-control mt-0 mb-1" rows="3" id="edit-form-${comment_id}" style="display:none; font-size:12px;" value="${comment}">` +
                  comment +
                  "</textarea>" +
                  // 日時
                  '<p class="mt-0 mb-1" style="display: flex; justify-content: flex-end; font-size:11px;">' +
                  `${year}-${month}-${day} ${hour}:${minute}` +
                  "</p>" +
                  // ユーザー名
                  '<p class="mt-0 mb-1" style="display: flex; justify-content: flex-end; font-size:11px;">' +
                  username +
                  "</p>";

                // ログインユーザーとコメントのユーザー名が一致する場合のみ編集と削除ボタンを表示
                var loggedInUsername = localStorage.getItem("username");
                if (loggedInUsername === coord.username) {
                  comment_popup.innerHTML +=
                    `<p class="mt-0 mb-0" style="display:flex;">` +
                    // 編集アイコン
                    `<button class="btn btn-outline-dark" type="button" id="edit-form-button-${comment_id}" name="edit-icon" value=${comment_id} style="width:24px; height:24px; margin:0px; padding:0px;" onclick="editformComment(${comment_id})">` +
                    '<i class="bi bi-pencil"></i>' +
                    "</button>" +
                    // 削除アイコン
                    `<button class="btn btn-outline-danger ms-1" type="button" id="delete-button-${comment_id}" name="delete-icon" value=${comment_id} style="width:24px; height:24px; margin:0px; padding:0px;" onclick="deleteComment(${comment_id}, ${accident_id})">` +
                    '<i class="bi bi-trash3-fill"></i>' +
                    "</button>" +
                    // 編集フォームの戻るボタン
                    `<button class="btn btn-outline-dark btn-sm ms-1" type="button" id="return-button-${comment_id}" style="width:40px; height:24px; margin:0px; padding:0px; display:none; font-size:12px;" onclick="Return(${accident_id})">` +
                    "戻る" +
                    "</button>" +
                    // 編集フォームの変更ボタン
                    `<button class="btn btn-outline-primary btn-sm ms-1" type="button" id="edit-button-${comment_id}" value=${comment_id} style="width:60px; height:24px; margin:0px; padding:0px; display:none; font-size:12px;" onclick="editComment(${comment_id}, ${accident_id})">` +
                    "変更する" +
                    "</button>" +
                    "</p>";
                }
                comment_area.appendChild(comment_popup);
                // comment_popupを見やすくするためのCSS
                comment_popup.style.backgroundColor = "#f5f5f5";
                comment_popup.style.borderRadius = "5px";
                comment_popup.style.padding = "5px";
                comment_popup.style.margin = "5px";
                comment_popup.style.fontSize = "12px";
                comment_popup.style.boxShadow = "0 0 15px rgba(0,0,0,0.2)";
              }
              // leafletpopupを一番下までスクロール
              let popup = document.getElementById("comment-area");
              popup.scrollTop = popup.scrollHeight;
            } else {
              console.error("error");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
          });

      } else {
        console.error("error");
      }

    })

}

// 書き込むボタンがクリックされたときの処理
function submitComment(accident_id, accident_latitude, accident_longitude) {
  var isLoggedIn = checkLoginStatus();
  if (!isLoggedIn) {
    // ログインしていない場合、ログインページにリダイレクト
    alert("書き込むにはログインが必要です");
  } else {
    // ログイン状態の場合、コメントをデータベースに保存
    var commentInput = document.getElementById("comment");
    var comment = commentInput.value;
    var username = localStorage.getItem("username");
    // commentInputが空の場合、アラートを表示
    if (comment === "") {
      alert("コメントを入力してください");
      return;
    } // コメントの文字数が100文字を超える場合、アラートを表示
    else if (comment.length > 100) {
      alert("コメントは100文字以内で入力してください");
      return;
    }
    const url = "server/server_comments.php";
    var fd = new FormData();
    fd.append("job", "keep_comments");
    fd.append("accident_id", accident_id);
    fd.append("username", username);
    fd.append("comment", comment);
    fd.append("latitude", accident_latitude);
    fd.append("longitude", accident_longitude);
    fetch(url, {
      method: "POST",
      body: fd
    })
      .then((response) => response.json())
      .then((data) => {
        getComment(accident_id);
        document.getElementById("comment").value = "";
        // console.log(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}

// コメント削除アイコンがクリックされたときの処理
function deleteComment(comment_id, accident_id) {
  const url = "server/server_comments.php";
  const fd = new FormData();
  fd.append("job", "delete_comments");
  fd.append("comment_id", comment_id);
  fetch(url, {
    method: "POST",
    body: fd
  })
    .then((response) => response.json())
    .then(($jsonResponse) => {
      if ($jsonResponse.status === "success") {
        getComment(accident_id);
      } else {
        self.postMessage({
          status: "error",
        });
      }
    })
    .catch((error) => {
      self.postMessage({
        status: "error",
      });
    });
}

// コメント編集アイコンがクリックされたときの処理
function editformComment(comment_id) {
  // 全ての編集アイコン、削除アイコンを非表示
  var editIcon = document.getElementsByName("edit-icon");
  for (var i = 0; i < editIcon.length; i++) {
    editIcon[i].style.display = "none";
  }
  var deleteIcon = document.getElementsByName("delete-icon");
  for (var i = 0; i < deleteIcon.length; i++) {
    deleteIcon[i].style.display = "none";
  }
  // comment-formを非表示
  var commentForm = document.getElementById(`comment-form-${comment_id}`);
  commentForm.style.display = "none";

  // edit-form、編集決定ボタンを表示
  var editButton = document.getElementById(`edit-button-${comment_id}`);
  editButton.style.display = "block";
  var editForm = document.getElementById(`edit-form-${comment_id}`);
  editForm.style.display = "block";
  var returnButton = document.getElementById(`return-button-${comment_id}`);
  returnButton.style.display = "block";

  // 書き込むボタンをクリックできないようにする
  var submitButton = document.getElementById("comment-submit");
  submitButton.disabled = true;
}

// 編集フォームの送信ボタンがクリックされたときの処理
function editComment(comment_id, accident_id) {
  const url = "server/server_comments.php";
  const fd = new FormData();
  fd.append("job", "edit_comments");
  fd.append("comment_id", comment_id);
  fd.append("comment", document.getElementById(`edit-form-${comment_id}`).value);
  fetch(url, {
    method: "POST",
    body: fd
  })
    .then((response) => response.json())
    .then(($jsonResponse) => {
      if ($jsonResponse.status === "success") {
        getComment(accident_id);
      } else {
        self.postMessage({
          status: "error",
        });
      }
    })
    .catch((error) => {
      self.postMessage({
        status: "error",
      });
    });
}
// 編集フォームの戻るボタンがクリックされたときの処理
function Return(accident_id) {
  getComment(accident_id);
}

// 地図背景のタイルレイヤー
const osm_1 = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  {
    // 右下にクレジットを表示(規約)
    attribution: "&copy; OpenStreetMap contributors",
  }
);
const osm_2 = L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
  // 右下にクレジットを表示(規約)
  attribution: "&copy; OpenStreetMap contributors",
});

var baseLayers = {
  "OSM": osm_2,
  "OSM CARTO": osm_1,
};

var map = L.map("map", {
  center: [32.7898, 130.741584],
  zoom: 12,
  maxZoom: 18,
  layers: [osm_1, osm_2],
  preferCanvas: true, //trueとし、Canvasレンダラーを選択
  zoomControl: false
});

// Sample legend content
var legendContent =
  '<div class="legend" style="background: rgba(255,255,255,0.5); padding: 6px 8px; box-shadow: 0 0 15px rgba(0,0,0,0.2); border-radius: 5px; font-size:13px;"> \
<strong style="margin-top:5px;">マーカー</strong> \
<div class="legend-item"> \
    <label class="form-check-label"><span class="marker-color" style="background-color: red; margin-right:8px;"></span>死亡</label> \
</div> \
<div class="legend-item"> \
    <label class="form-check-label"><span class="marker-color" style="background-color: #D2691E; margin-right:8px;"></span>負傷</label> \
</div> \
<div class="legend-item"> \
    <label class="form-check-label"><span class="marker-color" style="background-color: #3399FF; margin-right:8px;"></span>損傷なし</label> \
</div> \
</div>';

// Add legend to the map
var legend = L.control({ position: "bottomright" });
legend.onAdd = function (map) {
  var div = L.DomUtil.create("div", "info legend");
  div.innerHTML = legendContent;
  return div;
};
legend.addTo(map);

// マーカー
var MarkerLayer = L.layerGroup();
// ヒートマップ
var heatData = [];
var heatLayer = L.heatLayer(heatData, {
  radius: 11,
  blur: 18,
  gradient: {
    0.2: "#2b95ff",
    0.4: "#2bff2b",
    0.6: "#ffff2b",
    0.8: "#ff8000",
    1: "#ff0000",
  },
  opacity: 0.1,
  maxZoom: 13,
  scaleRadius: true,
  useLocalExtrema: true,
});

// zoomendイベントのリスナーを追加
map.on("zoomend", function () {
  var currentZoom = map.getZoom();
  if (currentZoom <= 16) {
    map.removeLayer(MarkerLayer);
    heatLayer.addTo(map);
  } else {
    map.removeLayer(heatLayer);
    MarkerLayer.addTo(map);
  }
});

// 現在地を表示
var option_Locate = {
  position: "topright",
  strings: {
    title: "現在地を表示",
  },
  locateOptions: {
    maxZoom: 16
  },
  metric: false,
  drawCircle: false,
  drawMarker: false,
  showPopup: false,
}

//　検索機能
var option_search = {
  collapsed: false,
  position: "topright",
  text: "検索",
  placeholder: "例）熊本県 熊本市 西区...",
  callback: function (results) {
    if (results.length === 1) {
      // 検索結果が1つだけの場合は、ポップアップを表示せずに地図をその位置に移動する
      let bbox = results[0].boundingbox;
      let first = new L.LatLng(bbox[0], bbox[2]);
      let second = new L.LatLng(bbox[1], bbox[3]);
      let bounds = new L.LatLngBounds([first, second]);
      this._map.fitBounds(bounds);
    } else {
      // 検索結果が複数ある場合は、ポップアップを表示する
      let popupContent = "<ul class='list-group'>";
      results.forEach(function (result) {
        popupContent +=
          "<li class='list-group-item'>" + result.display_name + "</li>";
      });
      popupContent += "</ul>";

      // ポップアップを表示
      let popupOptions = {
        minWidth: 200,
        closeButton: false,
      };
      let popup = L.popup(popupOptions)
        .setLatLng(this._map.getCenter())
        .setContent(popupContent)
        .openOn(this._map);

      // ポップアップのリストアイテムをクリックしたときに、地図をその位置に移動する
      let listItems = popup._contentNode.querySelectorAll(".list-group-item");
      listItems.forEach(
        function (item, index) {
          item.addEventListener(
            "click",
            function () {
              let bbox = results[index].boundingbox;
              let first = new L.LatLng(bbox[0], bbox[2]);
              let second = new L.LatLng(bbox[1], bbox[3]);
              let bounds = new L.LatLngBounds([first, second]);
              this._map.fitBounds(bounds);
              this._map.closePopup(popup); // ポップアップを閉じる
            }.bind(this)
          );
        }.bind(this)
      );
    }
  },
};

// 検索ボックスを追加
var osmGeocoder = new L.Control.OSMGeocoder(option_search);
map.addControl(osmGeocoder);
// ズームコントロールを追加
L.control.zoom({ position: 'topright' }).addTo(map);
// 現在地を追加
var lc = L.control.locate(option_Locate).addTo(map);
// レイヤー切り替えを追加
var LayerControl = L.control.layers(baseLayers, null, { position: 'bottomleft' }).addTo(map);

document.addEventListener("DOMContentLoaded", function () {
  // PC用
  const modal = document.getElementById("errorModal");
  const errorMessageElement = document.getElementById("errorMessage");

  const year_checkboxes = document.querySelectorAll("[layer-code='1']");
  const checkboxes = document.querySelectorAll("[layer-code='2']");

  const buttonContainers = document.querySelectorAll(".layer-button");

  const button_show = document.getElementById("show-button");
  const button_mapclear = document.getElementById("map-clear");

  const layer_checkboxes = document.querySelectorAll('input[type="checkbox"]');

  // スマホ用
  const modal_sm = document.getElementById("errorModal-sm");
  const errorMessageElement_sm = document.getElementById("errorMessage-sm");

  const year_checkboxes_sm = document.querySelectorAll("[layer-code='1-sm']");
  const checkboxes_sm = document.querySelectorAll("[layer-code='2-sm']");

  const buttonContainers_sm = document.querySelectorAll(".layer-button-sm");

  const button_show_sm = document.getElementById("show-button-sm");
  const button_mapclear_sm = document.getElementById("map-clear-sm");

  function displayErrorMessage(message) {
    function closeErrorMessage() {
      modal.style.display = "none"; // ボックスを消す
      clearTimeout(timerId); // タイマーを終了
    }
    errorMessageElement.textContent = message;
    modal.style.display = "block";
    timerId = setTimeout(closeErrorMessage, 700);
  }
  // checkbox CSS
  function layer_click(click_value) {
    var divId = click_value + "-div";
    var div = document.getElementById(divId);
    var clicked_value = document.getElementById(click_value);
    if (clicked_value.checked) {
      div.style.backgroundColor = "#505050";
      div.style.color = "#f5f5f5";
    } else {
      div.style.backgroundColor = "#f5f5f5"; // Reset background color
      div.style.color = "#505050";
    }
  }

  layer_checkboxes.forEach(function (layer_checkbox) {
    layer_checkbox.addEventListener("change", function () {
      if (layer_checkbox.id.slice(-3) === "-sm") {
        var divId = layer_checkbox.id.split("-")[0] + "-div-sm";
      } else {
        var divId = layer_checkbox.id + "-div";
      }
      var div = document.getElementById(divId);
      if (layer_checkbox.checked) {
        div.style.backgroundColor = "#505050";
        div.style.color = "#f5f5f5";
      } else {
        div.style.backgroundColor = "#f5f5f5"; // Reset background color
        div.style.color = "#505050";
      }
    });
  });

  // ボタン：すべて選ぶ、クリア（レイヤー別）
  buttonContainers.forEach(function (container) {
    container.addEventListener("click", function (event) {
      const targetButton = event.target;
      if (targetButton.tagName === "BUTTON") {
        const action = targetButton.getAttribute("data-action");
        const layer_numbers = document.querySelectorAll(
          `[layer-number="${targetButton.value}"]`
        );
        switch (action) {
          case "select":
            for (const layer_number of layer_numbers) {
              layer_number.checked = true;
              layer_click(layer_number.value);
            }

            break;
          case "clear":
            for (const layer_number of layer_numbers) {
              layer_number.checked = false;
              layer_click(layer_number.value);
            }
            break;
        }
      }
    });
  });

  // ボタン：地図をクリア
  button_mapclear.addEventListener("click", function () {
    map.removeLayer(heatLayer);
    map.removeLayer(MarkerLayer);
  });

  // ボタン：表示する
  button_show.addEventListener("click", function () {
    // マーカー座標のセット
    const addedMarkerCoordinates = new Set();
    let duplicateCount = 0;
    MarkerLayer.clearLayers();
    heatData.length = 0;

    const selected_years = [];
    const selected_layers = [];
    var check_element1 = false;
    var check_element2 = false;

    const layerNumbers = new Set(); // ユニークな layer-number を保存する Set

    for (const year_checkbox of year_checkboxes) {
      if (year_checkbox.checked) {
        check_element1 = true;
        selected_years.push(year_checkbox.value);
      }
    }
    for (const checkbox of checkboxes) {
      if (checkbox.checked) {
        check_element2 = true;
        const layerNumber = parseInt(checkbox.getAttribute("layer-number")); // selected_layers = { {}, {}, {}, {}, {}}
        if (!selected_layers[layerNumber]) {
          selected_layers[layerNumber] = [];
        }
        selected_layers[layerNumber].push(checkbox.value);
        layerNumbers.add(layerNumber); // Set に layer-number を追加：全てのレイヤーが１つ以上選択されているか？
      }
    }
    const allNumbersExist = layerNumbers.size === 9;

    if (check_element1 && check_element2 && allNumbersExist) {
      for (const selected_year of selected_years) {
        const worker = new Worker("worker_index.js");
        // メッセージを送信
        worker.postMessage({ layer: selected_layers, year: selected_year });
        // Web Workerからのメッセージを受信
        worker.onmessage = function (event) {
          if (event.data.status == "success") {
            const latitude = event.data.latitude;
            const longitude = event.data.longitude;
            const markerCoordinate = `${latitude}_${longitude}_${event.data.year}`; // 座標を文字列として結合

            // 既に同じ座標のマーカーが追加されていないか確認
            if (!addedMarkerCoordinates.has(markerCoordinate)) {
              addedMarkerCoordinates.add(markerCoordinate); // 新しい座標をセットに追加
              const markerOptions = event.data.markerOptions;
              const popupContent = event.data.popup;
              const accident_id = event.data.id;

              // ポップアップを生成し、maxWidthを指定
              var popup = L.popup({
                maxWidth: 229, // 任意の最大幅を指定
                maxHeight: 449,
              }).setContent(popupContent);

              addMarker = L.circleMarker([latitude, longitude], markerOptions)
                .bindPopup(popup)
                .on("click", function (e) {
                  this.openPopup();
                });
              addMarker.accident_id = accident_id;
              MarkerLayer.addLayer(addMarker);
              heatData.push([latitude, longitude, 0.3]);

              heatLayer.addTo(map);
              heatLayer.redraw();
            } else {
              // console.log("同じ座標"); // 同じ座標が既に存在する場合のカウントを増やす
            }
          } else {
            console.log("Fetch error:");
          }
        };
      }
    } else {
      const errorMessage = "選択されていない発生年またはレイヤーがあります";
      displayErrorMessage(errorMessage);
      console.log("error");
    }
  });

  // スマホ用

  function displayErrorMessage_sm(message_sm) {
    function closeErrorMessage_sm() {
      modal_sm.style.display = "none"; // ボックスを消す
      clearTimeout(timerId_sm); // タイマーを終了
    }
    errorMessageElement_sm.textContent = message_sm;
    modal_sm.style.display = "block";
    timerId_sm = setTimeout(closeErrorMessage_sm, 700);
  }
  // checkbox CSS
  function layer_click_sm(click_value_sm) {
    var divId_sm = click_value_sm + "-div-sm";
    var div_sm = document.getElementById(divId_sm);
    var clicked_value = document.getElementById(click_value_sm + "-sm");
    if (clicked_value.checked) {
      div_sm.style.backgroundColor = "#505050";
      div_sm.style.color = "#f5f5f5";
    } else {
      div_sm.style.backgroundColor = "#f5f5f5";
      div_sm.style.color = "#505050";
    }
  }

  // ボタン：すべて選ぶ、クリア（レイヤー別）
  buttonContainers_sm.forEach(function (container_sm) {
    container_sm.addEventListener("click", function (event) {
      const targetButton_sm = event.target;
      if (targetButton_sm.tagName === "BUTTON") {
        const action = targetButton_sm.getAttribute("data-action");
        const layer_numbers_sm = document.querySelectorAll(
          `[layer-number="${targetButton_sm.value}"]`
        );
        switch (action) {
          case "select":
            for (const layer_number_sm of layer_numbers_sm) {
              layer_number_sm.checked = true;
              layer_click_sm(layer_number_sm.value);
            }
            break;
          case "clear":
            for (const layer_number_sm of layer_numbers_sm) {
              layer_number_sm.checked = false;
              layer_click_sm(layer_number_sm.value);
            }
            break;
        }
      }
    });
  });

  // ボタン：地図をクリア（スマホ）
  button_mapclear_sm.addEventListener("click", function () {
    map.removeLayer(heatLayer);
    map.removeLayer(MarkerLayer);
  });

  // ボタン：表示する（スマホ）
  button_show_sm.addEventListener("click", function () {
    const addedMarkerCoordinates_sm = new Set();
    MarkerLayer.clearLayers();
    heatData.length = 0;

    const selected_years_sm = [];
    const selected_layers_sm = [];
    var check_element1 = false;
    var check_element2 = false;

    const layerNumbers_sm = new Set(); // ユニークな layer-number を保存する Set

    for (const year_checkbox_sm of year_checkboxes_sm) {
      if (year_checkbox_sm.checked) {
        check_element1 = true;
        selected_years_sm.push(year_checkbox_sm.value);
      }
    }
    for (const checkbox of checkboxes_sm) {
      if (checkbox.checked) {
        check_element2 = true;
        const layerNumber_sm = parseInt(
          checkbox.getAttribute("layer-number").split("-")[0]
        );
        if (!selected_layers_sm[layerNumber_sm]) {
          selected_layers_sm[layerNumber_sm] = [];
        }
        selected_layers_sm[layerNumber_sm].push(checkbox.value);
        layerNumbers_sm.add(layerNumber_sm); // Set に layer-number を追加
      }
    }
    const allNumbersExist_sm = layerNumbers_sm.size === 9;
    if (check_element1 && check_element2 && allNumbersExist_sm) {
      for (const selected_year_sm of selected_years_sm) {
        const worker = new Worker("worker_index.js");
        // メッセージを送信
        worker.postMessage({
          layer: selected_layers_sm,
          year: selected_year_sm,
        });
        // Web Workerからのメッセージを受信
        worker.onmessage = function (event) {
          if (event.data.status == "success") {
            const latitude_sm = event.data.latitude;
            const longitude_sm = event.data.longitude;
            const markerCoordinate_sm = `${latitude_sm}_${longitude_sm}_${event.data.year}`; // 座標を文字列として結合

            // 既に同じ座標のマーカーが追加されていないか確認
            if (!addedMarkerCoordinates_sm.has(markerCoordinate_sm)) {
              addedMarkerCoordinates_sm.add(markerCoordinate_sm); // 新しい座標をセットに追加
              const markerOptions_sm = event.data.markerOptions;
              const popupContent_sm = event.data.popup;
              const accident_id_sm = event.data.id;

              addMarker = L.circleMarker(
                [latitude_sm, longitude_sm],
                markerOptions_sm
              )
                .bindPopup(popupContent_sm)
                .on("click", function (e) {
                  this.openPopup();
                });
              addMarker.accident_id = accident_id_sm;
              MarkerLayer.addLayer(addMarker);
              heatData.push([latitude_sm, longitude_sm, 0.3]);

              heatLayer.addTo(map);
              heatLayer.redraw();
            } else {
              // console.log("同じ座標"); // 同じ座標が既に存在する場合のカウントを増やす
            }
          } else {
            console.log("Fetch error:");
          }
        };
      }
    } else {
      const errorMessage_sm = "選択されていない発生年またはレイヤーがあります";
      displayErrorMessage_sm(errorMessage_sm);
      console.log("error");
    }
  });
});
