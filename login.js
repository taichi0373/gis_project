// ログイン状態になったら、usernameを表示する
window.onload = function () {
  displayUsername();
};

// ログイン状態をチェックする関数
function checkLoginStatus() {
  var username = localStorage.getItem("username");
  return !!username;
}

// ユーザ名を表示する関数
function displayUsername() {
  var username = localStorage.getItem("username");
  if (username) {
    var usernameElement = document.getElementById("username_link");
    var usernameElement_sm = document.getElementById("username_link-sm");
    usernameElement.textContent = username;
    usernameElement_sm.textContent = username;
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

document.querySelector("form").addEventListener("submit", function (event) {
  event.preventDefault();

  var username = document.querySelector('input[name="username"]').value;
  var password = document.querySelector('input[name="password"]').value;

  if (!username && !password) {
    alert("ユーザー名とパスワードが入力されていません");
    event.preventDefault(); // フォームの送信を停止
  } else if (!username) {
    alert("ユーザー名が入力されていません");
    event.preventDefault(); // フォームの送信を停止
  } else if (!password) {
    alert("パスワードが入力されていません");
    event.preventDefault(); // フォームの送信を停止
  } else {
    // フォームデータを作成
    var formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    // リクエストを送信
    fetch("server/login.php", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // ユーザ名をlocalStorageに保存
          localStorage.setItem("username", username);
          window.location.href = "index.html";
        } else {
          alert(data.message);
        }
      });
  }
});
