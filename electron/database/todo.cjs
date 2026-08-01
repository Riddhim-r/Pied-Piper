const { randomUUID } = require('node:crypto')

const ensureText = (value, fieldName) => {
  const trimmedValue = String(value ?? '').trim()
  if (!trimmedValue) {
    throw new Error(`${fieldName} is required.`)
  }
  return trimmedValue
}

const mapTaskRow = (row) => ({
  id: row.id,
  title: row.title,
  isCompleted: Boolean(row.is_completed),
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  completedAt: row.completed_at,
})

const getTodoState = (database) => {
  const list = database
    .prepare(`SELECT name, created_at, updated_at FROM todo_lists WHERE id = 1`)
    .get()

  if (!list) {
    return { list: null, tasks: [] }
  }

  const tasks = database
    .prepare(
      `
      SELECT id, title, is_completed, sort_order, created_at, completed_at
      FROM todo_tasks
      WHERE list_id = 1
      ORDER BY
        is_completed ASC,
        CASE WHEN is_completed = 1 THEN datetime(completed_at) END ASC,
        sort_order ASC
    `,
    )
    .all()
    .map(mapTaskRow)

  return {
    list: {
      name: list.name,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
    },
    tasks,
  }
}

const createTodoList = (database, payload) => {
  const name = ensureText(payload.name, 'List name')

  try {
    database.prepare(`INSERT INTO todo_lists (id, name) VALUES (1, ?)`).run(name)
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      throw new Error('Only one Todo list can exist at a time.')
    }
    throw error
  }

  return { ok: true }
}

const addTodoTask = (database, payload) => {
  const title = ensureText(payload.title, 'Task')
  const listExists = database.prepare(`SELECT 1 FROM todo_lists WHERE id = 1`).get()

  if (!listExists) {
    throw new Error('Create a Todo list before adding tasks.')
  }

  const id = randomUUID()
  const nextOrder = database
    .prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM todo_tasks WHERE list_id = 1`)
    .get().next_order

  database
    .prepare(
      `
      INSERT INTO todo_tasks (id, list_id, title, sort_order)
      VALUES (?, 1, ?, ?)
    `,
    )
    .run(id, title, nextOrder)

  return { id }
}

const setTodoTaskCompleted = (database, id, isCompleted) => {
  const completedValue = isCompleted ? 1 : 0
  const result = database
    .prepare(
      `
      UPDATE todo_tasks
      SET
        is_completed = ?,
        completed_at = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END
      WHERE id = ? AND list_id = 1
    `,
    )
    .run(completedValue, completedValue, id)

  if (result.changes === 0) {
    throw new Error('Todo task not found.')
  }

  return { ok: true }
}

const deleteTodoList = (database) => {
  const listExists = database.prepare(`SELECT 1 FROM todo_lists WHERE id = 1`).get()
  if (!listExists) {
    throw new Error('Todo list not found.')
  }

  const taskCounts = database
    .prepare(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) AS incomplete
      FROM todo_tasks
      WHERE list_id = 1
    `,
    )
    .get()

  if (taskCounts.total === 0) {
    throw new Error('Add and complete at least one task before deleting this list.')
  }

  if (taskCounts.incomplete > 0) {
    throw new Error('Complete every task before deleting this list.')
  }

  database.prepare(`DELETE FROM todo_lists WHERE id = 1`).run()
  return { ok: true }
}

module.exports = {
  addTodoTask,
  createTodoList,
  deleteTodoList,
  getTodoState,
  setTodoTaskCompleted,
}
