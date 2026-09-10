CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  person_id INTEGER NOT NULL,
  person_name TEXT NOT NULL,
  guessed_correctly INTEGER NOT NULL DEFAULT 0,
  answer_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS game_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  trait_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS confirmed_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  person_id INTEGER NOT NULL,
  trait_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_games_person ON games(person_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_game ON game_answers(game_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_person_trait ON confirmed_answers(person_id, trait_id);
