const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { runMigrations } = require('../electron/db.cjs')
const {
  createLink,
  createTopic,
  deleteLink,
  deleteTopic,
  getTopic,
  listLinks,
  listTopics,
  updateLink,
} = require('../electron/database/encyclopedia.cjs')

const database = new Database(':memory:')
database.pragma('foreign_keys = ON')
runMigrations(database)

const { id: topicId } = createTopic(database, {
  title: 'Web Development',
  description: 'Useful learning references',
})

assert.equal(listTopics(database).length, 1)
assert.equal(getTopic(database, topicId).title, 'Web Development')

const { id: firstLinkId } = createLink(database, topicId, {
  label: 'MDN',
  url: 'https://developer.mozilla.org',
})
const { id: secondLinkId } = createLink(database, topicId, {
  label: 'React',
  url: 'react.dev',
})

assert.deepEqual(
  listLinks(database, topicId).map((link) => link.label),
  ['MDN', 'React'],
)

updateLink(database, secondLinkId, {
  label: 'React Docs',
  url: 'https://react.dev',
})
assert.equal(listLinks(database, topicId)[1].label, 'React Docs')

deleteLink(database, firstLinkId)
assert.equal(listLinks(database, topicId).length, 1)

deleteTopic(database, topicId)
assert.equal(getTopic(database, topicId), null)
assert.equal(listLinks(database, topicId).length, 0)
assert.equal(
  database
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM recycle_bin_items
      WHERE category = 'encyclopedia'
        AND item_type = 'topic'
        AND original_id = ?
    `,
    )
    .get(topicId).count,
  1,
)
assert.equal(
  database
    .prepare(`SELECT COUNT(*) AS count FROM encyclopedia_topic_links WHERE topic_id = ?`)
    .get(topicId).count,
  1,
)

database.close()
console.log('Encyclopedia topic, link, and recycle-bin database tests passed.')
