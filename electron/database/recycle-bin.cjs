const CATEGORIES = [
  { id: 'helpbook', label: 'Helpbook' },
  { id: 'ai-prompts', label: 'AI Prompt Vault' },
  { id: 'notes', label: 'Notes for Noobs' },
  { id: 'encyclopedia', label: 'Encyclopedia' },
]

const ITEM_CONFIG = {
  'helpbook:entry': {
    tableName: 'helpbook_entries',
    touchUpdatedAt: false,
  },
  'ai-prompts:prompt': {
    tableName: 'ai_prompt_entries',
    touchUpdatedAt: false,
  },
  'notes:notebook': {
    tableName: 'notebooks',
    touchUpdatedAt: true,
  },
  'encyclopedia:topic': {
    tableName: 'encyclopedia_topics',
    touchUpdatedAt: true,
  },
}

const ensureCategory = (category) => {
  if (!CATEGORIES.some((item) => item.id === category)) {
    throw new Error('Unknown Recycle Bin category.')
  }
}

const normalizeIds = (recycleItemIds) => {
  if (!Array.isArray(recycleItemIds)) {
    throw new Error('Select at least one Recycle Bin item.')
  }
  const ids = [...new Set(recycleItemIds.map((id) => String(id).trim()).filter(Boolean))]
  if (ids.length === 0) {
    throw new Error('Select at least one Recycle Bin item.')
  }
  return ids
}

const getRecycleBinCategories = (database) => {
  const counts = database
    .prepare(
      `
      SELECT category, COUNT(*) AS item_count
      FROM recycle_bin_items
      GROUP BY category
    `,
    )
    .all()

  const countByCategory = new Map(counts.map((row) => [row.category, row.item_count]))
  return CATEGORIES.map((category) => ({
    ...category,
    itemCount: countByCategory.get(category.id) ?? 0,
  }))
}

const listRecycleBinItems = (database, category) => {
  ensureCategory(category)
  return database
    .prepare(
      `
      SELECT id, category, item_type, original_id, display_title, deleted_at
      FROM recycle_bin_items
      WHERE category = ?
      ORDER BY datetime(deleted_at) DESC, display_title COLLATE NOCASE
    `,
    )
    .all(category)
    .map((row) => ({
      id: row.id,
      category: row.category,
      itemType: row.item_type,
      originalId: row.original_id,
      title: row.display_title,
      deletedAt: row.deleted_at,
    }))
}

const getItemConfig = (item) => {
  const config = ITEM_CONFIG[`${item.category}:${item.item_type}`]
  if (!config) {
    throw new Error('Unsupported Recycle Bin item.')
  }
  return config
}

const restoreRecycleBinItems = (database, recycleItemIds) => {
  const ids = normalizeIds(recycleItemIds)
  const restore = database.transaction(() => {
    let processed = 0

    ids.forEach((id) => {
      const item = database.prepare(`SELECT * FROM recycle_bin_items WHERE id = ?`).get(id)
      if (!item) {
        return
      }

      const config = getItemConfig(item)
      const updatedAtSql = config.touchUpdatedAt ? `, updated_at = datetime('now')` : ''
      database
        .prepare(
          `
          UPDATE ${config.tableName}
          SET deleted_at = NULL${updatedAtSql}
          WHERE id = ? AND deleted_at IS NOT NULL
        `,
        )
        .run(item.original_id)
      database.prepare(`DELETE FROM recycle_bin_items WHERE id = ?`).run(id)
      processed += 1
    })

    return processed
  })

  return { processed: restore() }
}

const permanentlyDeleteRecycleBinItems = (database, recycleItemIds) => {
  const ids = normalizeIds(recycleItemIds)
  const remove = database.transaction(() => {
    let processed = 0

    ids.forEach((id) => {
      const item = database.prepare(`SELECT * FROM recycle_bin_items WHERE id = ?`).get(id)
      if (!item) {
        return
      }

      const config = getItemConfig(item)
      database
        .prepare(`DELETE FROM ${config.tableName} WHERE id = ? AND deleted_at IS NOT NULL`)
        .run(item.original_id)
      database.prepare(`DELETE FROM recycle_bin_items WHERE id = ?`).run(id)
      processed += 1
    })

    return processed
  })

  return { processed: remove() }
}

const { randomUUID } = require('node:crypto')

const softDeleteToRecycleBin = (
  database,
  {
    tableName,
    category,
    itemType,
    originalId,
    titleColumn = 'title',
    touchUpdatedAt = false,
    notFoundMessage = 'Item not found.',
  },
) => {
  const moveToRecycleBin = database.transaction(() => {
    const item = database
      .prepare(
        `SELECT ${titleColumn} AS title FROM ${tableName} WHERE id = ? AND deleted_at IS NULL`,
      )
      .get(originalId)

    if (!item) {
      if (notFoundMessage) {
        throw new Error(notFoundMessage)
      }
      return
    }

    const updatedAtSql = touchUpdatedAt ? `, updated_at = datetime('now')` : ''
    database
      .prepare(
        `UPDATE ${tableName} SET deleted_at = datetime('now')${updatedAtSql} WHERE id = ?`,
      )
      .run(originalId)

    database
      .prepare(
        `
        INSERT INTO recycle_bin_items
          (id, category, item_type, original_id, display_title)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(category, item_type, original_id)
        DO UPDATE SET display_title = excluded.display_title, deleted_at = datetime('now')
      `,
      )
      .run(randomUUID(), category, itemType, String(originalId), item.title)
  })

  moveToRecycleBin()
  return { ok: true }
}

module.exports = {
  getRecycleBinCategories,
  listRecycleBinItems,
  permanentlyDeleteRecycleBinItems,
  restoreRecycleBinItems,
  softDeleteToRecycleBin,
}

