const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { runMigrations } = require('../electron/db.cjs')
const {
  addTodoTask,
  createTodoList,
  deleteTodoList,
  getTodoState,
  setTodoTaskCompleted,
} = require('../electron/database/todo.cjs')

const database = new Database(':memory:')
database.pragma('foreign_keys = ON')
runMigrations(database)

assert.deepEqual(getTodoState(database), { list: null, tasks: [] })

createTodoList(database, { name: 'Weekly Focus' })
assert.equal(getTodoState(database).list.name, 'Weekly Focus')
assert.throws(() => deleteTodoList(database), /Add and complete at least one task/)
assert.throws(
  () => createTodoList(database, { name: 'Second List' }),
  /Only one Todo list/,
)

const { id: firstTaskId } = addTodoTask(database, { title: 'Write outline' })
const { id: secondTaskId } = addTodoTask(database, { title: 'Review outline' })

setTodoTaskCompleted(database, firstTaskId, true)
assert.deepEqual(
  getTodoState(database).tasks.map((task) => task.title),
  ['Review outline', 'Write outline'],
)
assert.throws(() => deleteTodoList(database), /Complete every task/)

setTodoTaskCompleted(database, secondTaskId, true)
assert.equal(getTodoState(database).tasks.every((task) => task.isCompleted), true)

setTodoTaskCompleted(database, firstTaskId, false)
assert.equal(getTodoState(database).tasks[0].title, 'Write outline')
assert.throws(() => deleteTodoList(database), /Complete every task/)

setTodoTaskCompleted(database, firstTaskId, true)
deleteTodoList(database)
assert.deepEqual(getTodoState(database), { list: null, tasks: [] })

createTodoList(database, { name: 'Fresh List' })
assert.equal(getTodoState(database).list.name, 'Fresh List')

database.close()
console.log('Single-list Todo database tests passed.')
