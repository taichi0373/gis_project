-- データベースの作成
CREATE TABLE IF NOT EXISTS comments (
  comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  accident_id TEXT NOT NULL,
  username TEXT NOT NULL,
  comment TEXT NOT NULL,
  date_comment DATETIME NOT NULL
);