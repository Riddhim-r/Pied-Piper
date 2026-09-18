const { randomUUID } = require('node:crypto')

const mapEntry = (row) => ({
  id: row.id,
  date: row.date,
  title: row.title,
  description: row.description || '',
  createdAt: row.created_at,
})

const listBragBookEntries = (database) => {
  return database
    .prepare(
      `
      SELECT id, date, title, description, created_at
      FROM brag_book_entries
      ORDER BY date DESC, datetime(created_at) DESC
    `,
    )
    .all()
    .map(mapEntry)
}

const createBragBookEntry = (database, payload) => {
  const title = String(payload?.title ?? '').trim()
  if (!title) {
    throw new Error('An accomplishment description is required.')
  }

  const date = String(payload?.date ?? '').trim() || new Date().toISOString().split('T')[0]
  const description = String(payload?.description ?? '').trim()
  const id = randomUUID()

  database
    .prepare(
      `
      INSERT INTO brag_book_entries (id, date, title, description)
      VALUES (?, ?, ?, ?)
    `,
    )
    .run(id, date, title, description)

  return { id, date, title, description }
}

module.exports = {
  listBragBookEntries,
  createBragBookEntry,
}
