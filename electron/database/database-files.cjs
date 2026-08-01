const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')
const { runMigrations } = require('../db.cjs')

const KNOWN_TABLES = [
  'helpbook_entries',
  'ai_prompt_entries',
  'notebooks',
  'encyclopedia_topics',
  'todo_lists',
]

const timestampForFilename = (date = new Date()) => {
  return date.toISOString().replace('T', '_').replace(/\.\d{3}Z$/, '').replaceAll(':', '-')
}

const samePath = (firstPath, secondPath) => {
  const first = path.resolve(firstPath)
  const second = path.resolve(secondPath)
  return process.platform === 'win32'
    ? first.toLowerCase() === second.toLowerCase()
    : first === second
}

const validateDatabaseFile = (filePath) => {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error('The selected database file does not exist.')
  }

  let candidate
  try {
    candidate = new Database(filePath, { readonly: true, fileMustExist: true })
    const integrity = candidate.pragma('integrity_check', { simple: true })
    if (integrity !== 'ok') {
      throw new Error('The selected SQLite database failed its integrity check.')
    }

    const tableNames = new Set(
      candidate
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
        .all()
        .map((row) => row.name),
    )
    if (!KNOWN_TABLES.some((tableName) => tableNames.has(tableName))) {
      throw new Error('The selected file is not a Pied Piper database.')
    }
  } catch (error) {
    if (error instanceof Error && /selected|Pied Piper/.test(error.message)) {
      throw error
    }
    throw new Error('The selected file is not a readable SQLite database.')
  } finally {
    candidate?.close()
  }

  return { ok: true }
}

const backupDatabaseTo = async (database, destinationPath) => {
  if (samePath(database.name, destinationPath)) {
    throw new Error('Choose a location different from the active database.')
  }

  await database.backup(destinationPath)
  return destinationPath
}

const createAutomaticBackup = async (database, backupDirectory, date = new Date()) => {
  fs.mkdirSync(backupDirectory, { recursive: true })
  const baseName = `pied-piper-backup-${timestampForFilename(date)}`
  let backupPath = path.join(backupDirectory, `${baseName}.db`)
  let suffix = 2

  while (fs.existsSync(backupPath)) {
    backupPath = path.join(backupDirectory, `${baseName}-${suffix}.db`)
    suffix += 1
  }

  await backupDatabaseTo(database, backupPath)
  return backupPath
}

const prepareImportDatabase = async (sourcePath, stagingPath) => {
  validateDatabaseFile(sourcePath)
  if (samePath(sourcePath, stagingPath)) {
    throw new Error('The import staging location must be different from the selected file.')
  }

  if (fs.existsSync(stagingPath)) {
    fs.rmSync(stagingPath)
  }

  const sourceDatabase = new Database(sourcePath, {
    readonly: true,
    fileMustExist: true,
  })

  try {
    await sourceDatabase.backup(stagingPath)
  } finally {
    sourceDatabase.close()
  }

  const stagedDatabase = new Database(stagingPath)
  try {
    stagedDatabase.pragma('foreign_keys = ON')
    runMigrations(stagedDatabase)
    const integrity = stagedDatabase.pragma('integrity_check', { simple: true })
    if (integrity !== 'ok') {
      throw new Error('The prepared database failed its integrity check.')
    }
  } finally {
    stagedDatabase.close()
  }

  return stagingPath
}

const replaceDatabaseFile = (database, preparedPath, rollbackPath) => {
  const activePath = database.name
  if (samePath(activePath, preparedPath) || samePath(activePath, rollbackPath)) {
    throw new Error('Database replacement paths must be different.')
  }

  database.close()
  fs.copyFileSync(activePath, rollbackPath)

  try {
    fs.copyFileSync(preparedPath, activePath)
    validateDatabaseFile(activePath)
  } catch (error) {
    fs.copyFileSync(rollbackPath, activePath)
    throw error
  } finally {
    if (fs.existsSync(preparedPath)) fs.rmSync(preparedPath)
  }

  if (fs.existsSync(rollbackPath)) fs.rmSync(rollbackPath)
  return activePath
}

module.exports = {
  backupDatabaseTo,
  createAutomaticBackup,
  prepareImportDatabase,
  replaceDatabaseFile,
  samePath,
  timestampForFilename,
  validateDatabaseFile,
}
