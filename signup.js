// ログイン状態になったら、usernameを表示する
window.onload = function () {
  displayUsername();
};

// ログイン状態をチェックする関数
function checkLoginStatus() {
  var username = localStorage.getItem("username");
  return !!username;
}

// ユーザー名を表示する関数
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

var passwordField = document.getElementById("password");
var confirmField = document.getElementById("confirm");

var toggleButton = document.getElementById("togglePassword");
var toggleButton_confirm = document.getElementById("toggleConfirmPassword");
var isPasswordVisible = false;

// パスワードフォーム
toggleButton.addEventListener("click", function () {
  isPasswordVisible = !isPasswordVisible;
  togglePasswordVisibility(passwordField, toggleButton);
});

// パスワード確認フォーム
toggleButton_confirm.addEventListener("click", function () {
  isPasswordVisible = !isPasswordVisible;
  togglePasswordVisibility(confirmField, toggleButton_confirm);
});

// パスワードの可視性を切り替える関数
function togglePasswordVisibility(field, button) {
  if (isPasswordVisible) {
    field.type = "text";
    button.innerHTML = '<i class="bi bi-eye-slash"></i>'; // Change icon to eye-slash when password is visible
  } else {
    field.type = "password";
    button.innerHTML = '<i class="bi bi-eye"></i>'; // Change icon back to eye when password is hidden
  }
}

document
  .getElementById("formLogin")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var confirm = document.getElementById("confirm").value;

    if (!username && !password && !confirm) {
      alert("ユーザー名とパスワードが入力されていません");
      return;
    }
    if (!username) {
      alert("ユーザー名が入力されていません");
      return;
    }
    if (!password) {
      alert("パスワードが入力されていません");
      return;
    }

    if (username.length > 11) {
      alert("ユーザー名は11文字以下で入力してください。");
      return;
    }
    // パスワードが英数字記号かチェック
    if (!password.match(/^[A-Za-z0-9]*$/)) {
      alert("パスワードは半角英数字で入力してください。");
      return;
    }
    if (password.length < 6 || password.length > 11) {
      alert("パスワードは6文字以上、11文字以下で入力してください。");
      return;
    }

    if (password !== confirm) {
      alert("パスワードが一致しません。");
      return;
    }
    let fd = new FormData();
    fd.append("username", username);
    fd.append("password", password);
    const url = "./server/signup.php";
    // FetchAPIを使用してPOSTリクエストを送信
    fetch(url, {
      method: "POST",
      body: fd,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          window.location.href = "login.html";
        } else {
          alert(data.message);
        }
      });
  });
