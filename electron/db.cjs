const path = require('node:path')
const fs = require('node:fs')
const { app } = require('electron')
const Database = require('better-sqlite3')

let db

const copyLegacyDatabase = (destinationPath, legacyPaths) => {
  if (fs.existsSync(destinationPath)) {
    return false
  }

  const legacyPath = legacyPaths.find(
    (candidatePath) =>
      path.resolve(candidatePath).toLowerCase() !==
        path.resolve(destinationPath).toLowerCase() &&
      fs.existsSync(candidatePath),
  )

  if (!legacyPath) {
    return false
  }

  fs.copyFileSync(legacyPath, destinationPath)
  return true
}

const ensureDatabase = () => {
  if (db) {
    return db
  }

  const userDataPath = app.getPath('userData')
  fs.mkdirSync(userDataPath, { recursive: true })

  const dbPath = path.join(userDataPath, 'pied-piper.db')
  copyLegacyDatabase(dbPath, [
    path.join(userDataPath, 'coursebook.db'),
    path.join(app.getPath('appData'), 'coursebook', 'coursebook.db'),
  ])

  db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  runMigrations(db)
  return db
}

const runMigrations = (database) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS encyclopedia_topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS encyclopedia_topic_links (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (topic_id) REFERENCES encyclopedia_topics(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_encyclopedia_links_topic
      ON encyclopedia_topic_links(topic_id, sort_order);

    CREATE TABLE IF NOT EXISTS recycle_bin_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      item_type TEXT NOT NULL,
      original_id TEXT NOT NULL,
      display_title TEXT NOT NULL,
      deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(category, item_type, original_id)
    );

    INSERT OR IGNORE INTO recycle_bin_items
      (id, category, item_type, original_id, display_title, deleted_at)
    SELECT
      lower(hex(randomblob(16))),
      'encyclopedia',
      'topic',
      id,
      title,
      deleted_at
    FROM encyclopedia_topics
    WHERE deleted_at IS NOT NULL;

    CREATE TABLE IF NOT EXISTS helpbook_entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_prompt_entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS todo_lists (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS todo_tasks (
      id TEXT PRIMARY KEY,
      list_id INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (list_id) REFERENCES todo_lists(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_todo_tasks_order
      ON todo_tasks(list_id, is_completed, sort_order);

    CREATE TABLE IF NOT EXISTS notebooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      tag TEXT,
      content_json TEXT NOT NULL,
      plain_text_length INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_notebooks_status_updated
      ON notebooks(deleted_at, updated_at DESC);

    INSERT OR IGNORE INTO recycle_bin_items
      (id, category, item_type, original_id, display_title, deleted_at)
    SELECT
      lower(hex(randomblob(16))),
      'notes',
      'notebook',
      CAST(id AS TEXT),
      title,
      deleted_at
    FROM notebooks
    WHERE deleted_at IS NOT NULL;
  `)

  const ensureColumn = (tableName, columnName, columnDefinition) => {
    const columns = database.prepare(`PRAGMA table_info(${tableName})`).all()
    if (!columns.some((column) => column.name === columnName)) {
      database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`)
    }
  }

  ensureColumn('helpbook_entries', 'deleted_at', 'deleted_at TEXT')
  ensureColumn('ai_prompt_entries', 'deleted_at', 'deleted_at TEXT')

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_recycle_bin_category
      ON recycle_bin_items(category, deleted_at DESC);

    CREATE INDEX IF NOT EXISTS idx_helpbook_status
      ON helpbook_entries(deleted_at, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_ai_prompts_status
      ON ai_prompt_entries(deleted_at, created_at DESC);

    INSERT OR IGNORE INTO recycle_bin_items
      (id, category, item_type, original_id, display_title, deleted_at)
    SELECT
      lower(hex(randomblob(16))),
      'helpbook',
      'entry',
      id,
      title,
      deleted_at
    FROM helpbook_entries
    WHERE deleted_at IS NOT NULL;

    INSERT OR IGNORE INTO recycle_bin_items
      (id, category, item_type, original_id, display_title, deleted_at)
    SELECT
      lower(hex(randomblob(16))),
      'ai-prompts',
      'prompt',
      id,
      title,
      deleted_at
    FROM ai_prompt_entries
    WHERE deleted_at IS NOT NULL;

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    UPDATE app_settings
    SET value = 'Pied Piper'
    WHERE key = 'application_name' AND value = 'Coursebook';
  `)
}

module.exports = { copyLegacyDatabase, ensureDatabase, runMigrations }
