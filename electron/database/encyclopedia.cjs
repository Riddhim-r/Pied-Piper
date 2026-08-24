const { randomUUID } = require('node:crypto')

const mapTopicRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  linkCount: Number(row.link_count ?? 0),
  pdfCount: Number(row.pdf_count ?? 0),
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

const mapPdfRow = (row) => ({
  id: row.id,
  topicId: row.topic_id,
  fileName: row.file_name,
  filePath: row.file_path,
  fileSize: row.file_size,
  createdAt: row.created_at,
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
      SELECT 
        t.id, t.title, t.description, t.created_at, t.updated_at,
        (SELECT COUNT(*) FROM encyclopedia_topic_links l WHERE l.topic_id = t.id) AS link_count,
        (SELECT COUNT(*) FROM encyclopedia_topic_pdfs p WHERE p.topic_id = t.id) AS pdf_count
      FROM encyclopedia_topics t
      WHERE t.id = ? AND t.deleted_at IS NULL
    `,
    )
    .get(id)

  return row ? mapTopicRow(row) : null
}

const listTopics = (database) => {
  const rows = database
    .prepare(
      `
      SELECT 
        t.id, t.title, t.description, t.created_at, t.updated_at,
        (SELECT COUNT(*) FROM encyclopedia_topic_links l WHERE l.topic_id = t.id) AS link_count,
        (SELECT COUNT(*) FROM encyclopedia_topic_pdfs p WHERE p.topic_id = t.id) AS pdf_count
      FROM encyclopedia_topics t
      WHERE t.deleted_at IS NULL
      ORDER BY datetime(t.updated_at) DESC
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

  const result = database
    .prepare(
      `
      UPDATE encyclopedia_topics
      SET title = ?, description = ?, updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `,
    )
    .run(title, description, id)

  if (result.changes === 0) {
    throw new Error('Encyclopedia topic not found.')
  }

  return { ok: true }
}

const { softDeleteToRecycleBin } = require('./recycle-bin.cjs')

const deleteTopic = (database, id) => {
  return softDeleteToRecycleBin(database, {
    tableName: 'encyclopedia_topics',
    category: 'encyclopedia',
    itemType: 'topic',
    originalId: id,
    touchUpdatedAt: true,
    notFoundMessage: 'Encyclopedia topic not found.',
  })
}

const listLinks = (database, topicId) => {
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
  const topic = getTopic(database, topicId)
  if (!topic) {
    throw new Error('Encyclopedia topic not found.')
  }

  const label = ensureLinkValue(payload.label, 'Link name')
  const url = ensureUrl(payload.url)

  const maxRow = database
    .prepare(
      `
      SELECT COALESCE(MAX(sort_order), -1) AS max_sort
      FROM encyclopedia_topic_links
      WHERE topic_id = ?
    `,
    )
    .get(topicId)

  const id = randomUUID()
  const sortOrder = (maxRow?.max_sort ?? -1) + 1

  database
    .prepare(
      `
      INSERT INTO encyclopedia_topic_links (id, topic_id, label, url, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
    .run(id, topicId, label, url, sortOrder)

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

const listPdfs = (database, topicId) => {
  const rows = database
    .prepare(
      `
      SELECT id, topic_id, file_name, file_path, file_size, created_at
      FROM encyclopedia_topic_pdfs
      WHERE topic_id = ?
      ORDER BY datetime(created_at) DESC
    `,
    )
    .all(topicId)

  return rows.map(mapPdfRow)
}

const addPdf = (database, topicId, fileDetails) => {
  const id = randomUUID()
  const fileName = String(fileDetails.fileName ?? '').trim() || 'Document.pdf'
  const filePath = String(fileDetails.filePath ?? '').trim()
  const fileSize = Number(fileDetails.fileSize ?? 0)

  if (!filePath) {
    throw new Error('File path is required.')
  }

  database
    .prepare(
      `
      INSERT INTO encyclopedia_topic_pdfs (id, topic_id, file_name, file_path, file_size)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
    .run(id, topicId, fileName, filePath, fileSize)

  return { id }
}

const deletePdf = (database, id) => {
  const row = database
    .prepare(`SELECT file_path FROM encyclopedia_topic_pdfs WHERE id = ?`)
    .get(id)

  database.prepare(`DELETE FROM encyclopedia_topic_pdfs WHERE id = ?`).run(id)
  return row ? { ok: true, filePath: row.file_path } : { ok: true }
}

module.exports = {
  addPdf,
  createLink,
  createTopic,
  deleteLink,
  deletePdf,
  deleteTopic,
  getTopic,
  listLinks,
  listPdfs,
  listTopics,
  updateLink,
  updateTopic,
}
