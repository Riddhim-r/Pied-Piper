const { randomUUID } = require('node:crypto')

const mapTopicRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const mapLinkRow = (row) => ({
  id: row.id,
  topicId: row.topic_id,
  label: row.label,
  url: row.url,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const ensureTopicTitle = (title) => {
  const trimmedTitle = String(title ?? '').trim()
  if (!trimmedTitle) {
    throw new Error('Topic title is required.')
  }
  return trimmedTitle
}

const ensureLinkValue = (value, fieldName) => {
  const trimmedValue = String(value ?? '').trim()
  if (!trimmedValue) {
    throw new Error(`${fieldName} is required.`)
  }
  return trimmedValue
}

const ensureUrl = (value) => {
  const enteredUrl = ensureLinkValue(value, 'URL')
  const normalizedUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(enteredUrl)
    ? enteredUrl
    : `https://${enteredUrl}`

  let parsedUrl
  try {
    parsedUrl = new URL(normalizedUrl)
  } catch {
    throw new Error('Enter a valid web address.')
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP and HTTPS links are supported.')
  }

  return parsedUrl.toString()
}

const getTopic = (database, id) => {
  const row = database
    .prepare(
      `
      SELECT id, title, description, created_at, updated_at
      FROM encyclopedia_topics
      WHERE id = ? AND deleted_at IS NULL
    `,
    )
    .get(id)

  return row ? mapTopicRow(row) : null
}

const listTopics = (database) => {
  const rows = database
    .prepare(
      `
      SELECT id, title, description, created_at, updated_at
      FROM encyclopedia_topics
      WHERE deleted_at IS NULL
      ORDER BY datetime(updated_at) DESC
    `,
    )
    .all()

  return rows.map(mapTopicRow)
}

const createTopic = (database, payload) => {
  const id = randomUUID()
  const title = ensureTopicTitle(payload.title)
  const description = String(payload.description ?? '').trim()

  database
    .prepare(
      `
      INSERT INTO encyclopedia_topics (id, title, description)
      VALUES (?, ?, ?)
    `,
    )
    .run(id, title, description)

  return { id }
}

const updateTopic = (database, id, payload) => {
  const title = ensureTopicTitle(payload.title)
  const description = String(payload.description ?? '').trim()

  database
    .prepare(
      `
      UPDATE encyclopedia_topics
      SET title = ?, description = ?, updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `,
    )
    .run(title, description, id)

  return { ok: true }
}

const deleteTopic = (database, id) => {
  const moveToRecycleBin = database.transaction(() => {
    const topic = database
      .prepare(`SELECT title FROM encyclopedia_topics WHERE id = ? AND deleted_at IS NULL`)
      .get(id)

    if (!topic) {
      return
    }

    database
      .prepare(
        `
        UPDATE encyclopedia_topics
        SET deleted_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `,
      )
      .run(id)

    database
      .prepare(
        `
        INSERT INTO recycle_bin_items
          (id, category, item_type, original_id, display_title)
        VALUES (?, 'encyclopedia', 'topic', ?, ?)
        ON CONFLICT(category, item_type, original_id)
        DO UPDATE SET display_title = excluded.display_title, deleted_at = datetime('now')
      `,
      )
      .run(randomUUID(), id, topic.title)
  })

  moveToRecycleBin()

  return { ok: true }
}

const listLinks = (database, topicId) => {
  if (!getTopic(database, topicId)) {
    return []
  }

  const rows = database
    .prepare(
      `
      SELECT id, topic_id, label, url, sort_order, created_at, updated_at
      FROM encyclopedia_topic_links
      WHERE topic_id = ?
      ORDER BY sort_order ASC, datetime(created_at) ASC
    `,
    )
    .all(topicId)

  return rows.map(mapLinkRow)
}

const createLink = (database, topicId, payload) => {
  if (!getTopic(database, topicId)) {
    throw new Error('Encyclopedia topic not found.')
  }

  const id = randomUUID()
  const label = ensureLinkValue(payload.label, 'Link name')
  const url = ensureUrl(payload.url)
  const nextOrder = database
    .prepare(
      `
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
      FROM encyclopedia_topic_links
      WHERE topic_id = ?
    `,
    )
    .get(topicId).next_order

  database
    .prepare(
      `
      INSERT INTO encyclopedia_topic_links (id, topic_id, label, url, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
    .run(id, topicId, label, url, nextOrder)

  return { id }
}

const updateLink = (database, id, payload) => {
  const label = ensureLinkValue(payload.label, 'Link name')
  const url = ensureUrl(payload.url)
  const result = database
    .prepare(
      `
      UPDATE encyclopedia_topic_links
      SET label = ?, url = ?, updated_at = datetime('now')
      WHERE id = ?
        AND topic_id IN (
          SELECT id FROM encyclopedia_topics WHERE deleted_at IS NULL
        )
    `,
    )
    .run(label, url, id)

  if (result.changes === 0) {
    throw new Error('Encyclopedia link not found.')
  }

  return { ok: true }
}

const deleteLink = (database, id) => {
  database.prepare(`DELETE FROM encyclopedia_topic_links WHERE id = ?`).run(id)
  return { ok: true }
}

module.exports = {
  createLink,
  createTopic,
  deleteLink,
  deleteTopic,
  getTopic,
  listLinks,
  listTopics,
  updateLink,
  updateTopic,
}
