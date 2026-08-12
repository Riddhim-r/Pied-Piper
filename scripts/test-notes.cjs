const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { runMigrations } = require('../electron/db.cjs')
const {
  createNotebook,
  discardEmptyNotebook,
  getNotebook,
  listNotebooks,
  listTags,
  permanentlyDeleteNotebook,
  renameTag,
  restoreNotebook,
  saveNotebook,
  softDeleteNotebook,
} = require('../electron/database/notes.cjs')

const database = new Database(':memory:')
database.pragma('foreign_keys = ON')
runMigrations(database)

const blank = createNotebook(database, '')
assert.equal(blank.title, '')
assert.deepEqual(discardEmptyNotebook(database, blank.id), { discarded: true })
assert.equal(getNotebook(database, blank.id), null)

const first = createNotebook(database, 'JavaScript Notes')
const second = createNotebook(database, 'CSS Notes')
assert.deepEqual(discardEmptyNotebook(database, first.id), { discarded: false })
assert.equal(listNotebooks(database, {}).length, 2)
assert.equal(
  listNotebooks(database, { search: 'javascript' }).map((notebook) => notebook.id)[0],
  first.id,
)

const documentJson = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Closures' }] }],
})

saveNotebook(database, {
  id: first.id,
  title: 'JavaScript Notes',
  tag: 'Frontend',
  contentJson: documentJson,
  plainTextLength: 8,
})
saveNotebook(database, {
  id: second.id,
  title: 'CSS Notes',
  tag: 'frontend',
  contentJson: documentJson,
  plainTextLength: 8,
})

assert.deepEqual(listTags(database), ['Frontend'])
assert.equal(listNotebooks(database, { tag: 'FRONTEND' }).length, 2)
assert.throws(
  () =>
    saveNotebook(database, {
      id: first.id,
      title: first.title,
      tag: null,
      contentJson: documentJson,
      plainTextLength: 1_000_001,
    }),
  /text limit exceeded/,
)

renameTag(database, 'Frontend', 'Web')
assert.deepEqual(listTags(database), ['Web'])

softDeleteNotebook(database, first.id)
assert.equal(listNotebooks(database, {}).length, 1)
assert.equal(listNotebooks(database, { includeTrashed: true }).length, 1)
assert.equal(
  database
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM recycle_bin_items
      WHERE category = 'notes' AND item_type = 'notebook' AND original_id = ?
    `,
    )
    .get(String(first.id)).count,
  1,
)

restoreNotebook(database, first.id)
assert.equal(getNotebook(database, first.id).deletedAt, null)

softDeleteNotebook(database, first.id)
permanentlyDeleteNotebook(database, first.id)
assert.equal(getNotebook(database, first.id), null)

database.close()
console.log('Notes notebook, tag, save, and trash database tests passed.')
