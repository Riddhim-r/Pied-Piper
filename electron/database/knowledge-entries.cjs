const { randomUUID } = require('node:crypto')

const ENTRY_TYPES = {
  helpbook: {
    tableName: 'helpbook_entries',
    category: 'helpbook',
    itemType: 'entry',
  },
  prompts: {
    tableName: 'ai_prompt_entries',
    category: 'ai-prompts',
    itemType: 'prompt',
  },
}

const getEntryType = (type) => {
  const entryType = ENTRY_TYPES[type]
  if (!entryType) {
    throw new Error('Unknown knowledge entry type.')
  }
  return entryType
}

const parseArray = (value) => {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const mapEntry = (row) => ({
  id: row.id,
  title: row.title,
  tags: parseArray(row.tags),
  steps: parseArray(row.steps),
})

const normalizePayload = (payload) => {
  const title = String(payload?.title ?? '').trim()
  if (!title) {
    throw new Error('A title is required.')
  }

  return {
    title,
    tags: JSON.stringify(Array.isArray(payload.tags) ? payload.tags : []),
    steps: JSON.stringify(Array.isArray(payload.steps) ? payload.steps : []),
  }
}

const listEntries = (database, type) => {
  const { tableName } = getEntryType(type)
  return database
    .prepare(
      `
      SELECT id, title, tags, steps
      FROM ${tableName}
      WHERE deleted_at IS NULL
      ORDER BY datetime(created_at) DESC
    `,
    )
    .all()
    .map(mapEntry)
}

const createEntry = (database, type, payload) => {
  const { tableName } = getEntryType(type)
  const entry = normalizePayload(payload)
  const id = randomUUID()

  database
    .prepare(
      `
      INSERT INTO ${tableName} (id, title, tags, steps)
      VALUES (?, ?, ?, ?)
    `,
    )
    .run(id, entry.title, entry.tags, entry.steps)

  return { id }
}

const updateEntry = (database, type, id, payload) => {
  const { tableName } = getEntryType(type)
  const entry = normalizePayload(payload)
  const result = database
    .prepare(
      `
      UPDATE ${tableName}
      SET title = ?, tags = ?, steps = ?
      WHERE id = ? AND deleted_at IS NULL
    `,
    )
    .run(entry.title, entry.tags, entry.steps, id)

  if (result.changes === 0) {
    throw new Error('Entry not found.')
  }

  return { ok: true }
}

const { softDeleteToRecycleBin } = require('./recycle-bin.cjs')

const softDeleteEntry = (database, type, id) => {
  const { tableName, category, itemType } = getEntryType(type)
  return softDeleteToRecycleBin(database, {
    tableName,
    category,
    itemType,
    originalId: id,
    notFoundMessage: 'Entry not found.',
  })
}

module.exports = {
  createEntry,
  listEntries,
  softDeleteEntry,
  updateEntry,
}
