const { randomUUID } = require('node:crypto')

const EMPTY_DOCUMENT = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
})

const ensureTitle = (value) => {
  const title = String(value ?? '').trim()
  if (!title) {
    throw new Error('Notebook title cannot be empty.')
  }
  return title.slice(0, 100)
}

const normalizeTag = (database, value) => {
  const tag = String(value ?? '').trim().slice(0, 40)
  if (!tag) {
    return null
  }

  const existing = database
    .prepare(
      `
      SELECT tag
      FROM notebooks
      WHERE deleted_at IS NULL AND tag IS NOT NULL AND lower(tag) = lower(?)
      LIMIT 1
    `,
    )
    .get(tag)

  return existing?.tag ?? tag
}

const mapNotebook = (row) => ({
  id: row.id,
  title: row.title,
  tag: row.tag,
  contentJson: row.content_json,
  plainTextLength: row.plain_text_length,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
})

const mapSummary = (row) => ({
  id: row.id,
  title: row.title,
  tag: row.tag,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
})

const listNotebooks = (database, params = {}) => {
  const search = String(params.search ?? '').trim()
  const tag = String(params.tag ?? '').trim()
  const includeTrashed = Boolean(params.includeTrashed)

  const rows = database
    .prepare(
      `
      SELECT id, title, tag, created_at, updated_at, deleted_at
      FROM notebooks
      WHERE
        CASE WHEN ? = 1 THEN deleted_at IS NOT NULL ELSE deleted_at IS NULL END
        AND (? = '' OR lower(title) LIKE '%' || lower(?) || '%')
        AND (? = '' OR lower(tag) = lower(?))
      ORDER BY datetime(updated_at) DESC, id DESC
    `,
    )
    .all(includeTrashed ? 1 : 0, search, search, tag, tag)

  return rows.map(mapSummary)
}

const getNotebook = (database, id) => {
  const row = database
    .prepare(
      `
      SELECT
        id, title, tag, content_json, plain_text_length,
        created_at, updated_at, deleted_at
      FROM notebooks
      WHERE id = ?
    `,
    )
    .get(id)

  return row ? mapNotebook(row) : null
}

const createNotebook = (database, title) => {
  const temporaryTitle = String(title ?? '').trim().slice(0, 100)
  const result = database
    .prepare(
      `
      INSERT INTO notebooks (title, content_json)
      VALUES (?, ?)
    `,
    )
    .run(temporaryTitle, EMPTY_DOCUMENT)

  return getNotebook(database, result.lastInsertRowid)
}

const discardEmptyNotebook = (database, id) => {
  const result = database
    .prepare(
      `
      DELETE FROM notebooks
      WHERE
        id = ?
        AND deleted_at IS NULL
        AND trim(title) = ''
        AND (tag IS NULL OR trim(tag) = '')
        AND plain_text_length = 0
        AND content_json = ?
    `,
    )
    .run(id, EMPTY_DOCUMENT)

  return { discarded: result.changes > 0 }
}

const saveNotebook = (database, payload) => {
  const plainTextLength = Number(payload.plainTextLength ?? 0)
  if (!Number.isInteger(plainTextLength) || plainTextLength < 0) {
    throw new Error('Notebook character count is invalid.')
  }
  if (plainTextLength > 10_000) {
    throw new Error('Notebook text limit exceeded.')
  }

  const contentJson = String(payload.contentJson ?? '')
  try {
    JSON.parse(contentJson)
  } catch {
    throw new Error('Notebook content is invalid.')
  }

  const result = database
    .prepare(
      `
      UPDATE notebooks
      SET
        title = ?,
        tag = ?,
        content_json = ?,
        plain_text_length = ?,
        updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `,
    )
    .run(
      ensureTitle(payload.title),
      normalizeTag(database, payload.tag),
      contentJson,
      plainTextLength,
      payload.id,
    )

  if (result.changes === 0) {
    throw new Error('Notebook not found.')
  }

  return getNotebook(database, payload.id)
}

const softDeleteNotebook = (database, id) => {
  const moveToRecycleBin = database.transaction(() => {
    const notebook = database
      .prepare(`SELECT title FROM notebooks WHERE id = ? AND deleted_at IS NULL`)
      .get(id)
    if (!notebook) {
      throw new Error('Notebook not found.')
    }

    database
      .prepare(
        `
        UPDATE notebooks
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
        VALUES (?, 'notes', 'notebook', ?, ?)
        ON CONFLICT(category, item_type, original_id)
        DO UPDATE SET display_title = excluded.display_title, deleted_at = datetime('now')
      `,
      )
      .run(randomUUID(), String(id), notebook.title)
  })

  moveToRecycleBin()
  return { ok: true }
}

const restoreNotebook = (database, id) => {
  const restore = database.transaction(() => {
    database
      .prepare(
        `
        UPDATE notebooks
        SET deleted_at = NULL, updated_at = datetime('now')
        WHERE id = ? AND deleted_at IS NOT NULL
      `,
      )
      .run(id)
    database
      .prepare(
        `
        DELETE FROM recycle_bin_items
        WHERE category = 'notes' AND item_type = 'notebook' AND original_id = ?
      `,
      )
      .run(String(id))
  })

  restore()
  return { ok: true }
}

const permanentlyDeleteNotebook = (database, id) => {
  const remove = database.transaction(() => {
    database.prepare(`DELETE FROM notebooks WHERE id = ? AND deleted_at IS NOT NULL`).run(id)
    database
      .prepare(
        `
        DELETE FROM recycle_bin_items
        WHERE category = 'notes' AND item_type = 'notebook' AND original_id = ?
      `,
      )
      .run(String(id))
  })

  remove()
  return { ok: true }
}

const listTags = (database) => {
  return database
    .prepare(
      `
      SELECT MIN(tag) AS tag
      FROM notebooks
      WHERE deleted_at IS NULL AND tag IS NOT NULL AND trim(tag) <> ''
      GROUP BY lower(tag)
      ORDER BY lower(tag)
    `,
    )
    .all()
    .map((row) => row.tag)
}

const renameTag = (database, oldTag, newTag) => {
  const oldValue = String(oldTag ?? '').trim()
  const newValue = normalizeTag(database, newTag)
  if (!oldValue || !newValue) {
    throw new Error('Both tag names are required.')
  }

  database
    .prepare(
      `
      UPDATE notebooks
      SET tag = ?, updated_at = datetime('now')
      WHERE deleted_at IS NULL AND lower(tag) = lower(?)
    `,
    )
    .run(newValue, oldValue)

  return { ok: true }
}

module.exports = {
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
}
