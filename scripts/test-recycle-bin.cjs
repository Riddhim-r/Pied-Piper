const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { runMigrations } = require('../electron/db.cjs')
const {
  createLink,
  createTopic,
  deleteTopic,
  getTopic,
} = require('../electron/database/encyclopedia.cjs')
const {
  createEntry,
  listEntries,
  softDeleteEntry,
} = require('../electron/database/knowledge-entries.cjs')
const {
  createNotebook,
  getNotebook,
  softDeleteNotebook,
} = require('../electron/database/notes.cjs')
const {
  getRecycleBinCategories,
  listRecycleBinItems,
  permanentlyDeleteRecycleBinItems,
  restoreRecycleBinItems,
} = require('../electron/database/recycle-bin.cjs')

const database = new Database(':memory:')
database.pragma('foreign_keys = ON')

database.exec(`
  CREATE TABLE helpbook_entries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    steps TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE ai_prompt_entries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    steps TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

runMigrations(database)
assert.equal(
  database.prepare(`PRAGMA table_info(helpbook_entries)`).all().some((column) => column.name === 'deleted_at'),
  true,
)
assert.equal(
  database.prepare(`PRAGMA table_info(ai_prompt_entries)`).all().some((column) => column.name === 'deleted_at'),
  true,
)

const helpbook = createEntry(database, 'helpbook', {
  title: 'Fix Wi-Fi',
  tags: ['network'],
  steps: ['Restart router'],
})
const prompt = createEntry(database, 'prompts', {
  title: 'Summarize',
  tags: ['writing'],
  steps: ['Summarize this text'],
})
const notebook = createNotebook(database, 'Study Notes')
const topic = createTopic(database, {
  title: 'Frontend',
  description: 'Web links',
})
const link = createLink(database, topic.id, {
  label: 'MDN',
  url: 'https://developer.mozilla.org',
})

softDeleteEntry(database, 'helpbook', helpbook.id)
softDeleteEntry(database, 'prompts', prompt.id)
softDeleteNotebook(database, notebook.id)
deleteTopic(database, topic.id)

assert.deepEqual(
  getRecycleBinCategories(database).map((category) => [category.id, category.itemCount]),
  [
    ['helpbook', 1],
    ['ai-prompts', 1],
    ['notes', 1],
    ['encyclopedia', 1],
  ],
)
assert.equal(listEntries(database, 'helpbook').length, 0)
assert.equal(listEntries(database, 'prompts').length, 0)

const helpbookRecycleId = listRecycleBinItems(database, 'helpbook')[0].id
const notebookRecycleId = listRecycleBinItems(database, 'notes')[0].id
restoreRecycleBinItems(database, [helpbookRecycleId, notebookRecycleId])

assert.equal(listEntries(database, 'helpbook')[0].title, 'Fix Wi-Fi')
assert.equal(getNotebook(database, notebook.id).deletedAt, null)

const promptRecycleId = listRecycleBinItems(database, 'ai-prompts')[0].id
const topicRecycleId = listRecycleBinItems(database, 'encyclopedia')[0].id
permanentlyDeleteRecycleBinItems(database, [promptRecycleId, topicRecycleId])

assert.equal(database.prepare(`SELECT COUNT(*) AS count FROM ai_prompt_entries WHERE id = ?`).get(prompt.id).count, 0)
assert.equal(getTopic(database, topic.id), null)
assert.equal(
  database.prepare(`SELECT COUNT(*) AS count FROM encyclopedia_topic_links WHERE id = ?`).get(link.id).count,
  0,
)
assert.equal(getRecycleBinCategories(database).every((category) => category.itemCount === 0), true)
assert.throws(() => restoreRecycleBinItems(database, []), /Select at least one/)

database.close()
console.log('Cross-category Recycle Bin migration, restore, and permanent-delete tests passed.')
