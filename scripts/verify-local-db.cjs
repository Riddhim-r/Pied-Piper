const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

const getArgValue = (args, flag) => {
  const index = args.indexOf(flag)
  if (index === -1 || index === args.length - 1) {
    return ''
  }
  return args[index + 1]
}

const resolveDatabasePath = (explicitPath) => {
  if (explicitPath) {
    return path.resolve(explicitPath)
  }

  const appDataPath = process.env.APPDATA
  if (!appDataPath) {
    throw new Error('APPDATA is unavailable. Pass --db-path explicitly.')
  }

  const candidates = [
    path.join(appDataPath, 'Pied Piper', 'pied-piper.db'),
    path.join(appDataPath, 'pied-piper', 'pied-piper.db'),
    path.join(appDataPath, 'coursebook', 'coursebook.db'),
  ]

  return candidates.find((candidatePath) => fs.existsSync(candidatePath)) ?? candidates[0]
}

const args = process.argv.slice(2)
const databasePath = resolveDatabasePath(getArgValue(args, '--db-path'))

if (!fs.existsSync(databasePath)) {
  throw new Error(`SQLite file not found: ${databasePath}`)
}

const database = new Database(databasePath, { readonly: true })

const counts = {
  activeTopics: database
    .prepare('SELECT COUNT(*) AS count FROM encyclopedia_topics WHERE deleted_at IS NULL')
    .get().count,
  deletedTopics: database
    .prepare('SELECT COUNT(*) AS count FROM encyclopedia_topics WHERE deleted_at IS NOT NULL')
    .get().count,
  encyclopediaLinks: database
    .prepare('SELECT COUNT(*) AS count FROM encyclopedia_topic_links')
    .get().count,
  recycledEncyclopediaTopics: database
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM recycle_bin_items
      WHERE category = 'encyclopedia' AND item_type = 'topic'
    `,
    )
    .get().count,
  activeHelpbook: database
    .prepare('SELECT COUNT(*) AS count FROM helpbook_entries WHERE deleted_at IS NULL')
    .get().count,
  deletedHelpbook: database
    .prepare('SELECT COUNT(*) AS count FROM helpbook_entries WHERE deleted_at IS NOT NULL')
    .get().count,
  activePrompts: database
    .prepare('SELECT COUNT(*) AS count FROM ai_prompt_entries WHERE deleted_at IS NULL')
    .get().count,
  deletedPrompts: database
    .prepare('SELECT COUNT(*) AS count FROM ai_prompt_entries WHERE deleted_at IS NOT NULL')
    .get().count,
  recycledItems: database.prepare('SELECT COUNT(*) AS count FROM recycle_bin_items').get().count,
  todoLists: database.prepare('SELECT COUNT(*) AS count FROM todo_lists').get().count,
  todoTasks: database.prepare('SELECT COUNT(*) AS count FROM todo_tasks').get().count,
  incompleteTodoTasks: database
    .prepare('SELECT COUNT(*) AS count FROM todo_tasks WHERE is_completed = 0')
    .get().count,
  activeNotebooks: database
    .prepare('SELECT COUNT(*) AS count FROM notebooks WHERE deleted_at IS NULL')
    .get().count,
  deletedNotebooks: database
    .prepare('SELECT COUNT(*) AS count FROM notebooks WHERE deleted_at IS NOT NULL')
    .get().count,
  applicationSettings: database
    .prepare('SELECT COUNT(*) AS count FROM app_settings')
    .get().count,
}

console.log(`SQLite file: ${databasePath}`)
console.log(`Active encyclopedia topics: ${counts.activeTopics}`)
console.log(`Deleted encyclopedia topics: ${counts.deletedTopics}`)
console.log(`Encyclopedia links: ${counts.encyclopediaLinks}`)
console.log(`Recycled encyclopedia topics: ${counts.recycledEncyclopediaTopics}`)
console.log(`Active Helpbook entries: ${counts.activeHelpbook}`)
console.log(`Deleted Helpbook entries: ${counts.deletedHelpbook}`)
console.log(`Active AI Prompt Vault entries: ${counts.activePrompts}`)
console.log(`Deleted AI Prompt Vault entries: ${counts.deletedPrompts}`)
console.log(`Total Recycle Bin items: ${counts.recycledItems}`)
console.log(`Todo lists: ${counts.todoLists}`)
console.log(`Todo tasks: ${counts.todoTasks}`)
console.log(`Incomplete Todo tasks: ${counts.incompleteTodoTasks}`)
console.log(`Active notebooks: ${counts.activeNotebooks}`)
console.log(`Deleted notebooks: ${counts.deletedNotebooks}`)
console.log(`Saved application settings: ${counts.applicationSettings}`)

database.close()
