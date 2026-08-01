const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const Database = require('better-sqlite3')
const { copyLegacyDatabase, runMigrations } = require('../electron/db.cjs')
const {
  backupDatabaseTo,
  createAutomaticBackup,
  prepareImportDatabase,
  replaceDatabaseFile,
  timestampForFilename,
  validateDatabaseFile,
} = require('../electron/database/database-files.cjs')

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pied-piper-database-files-'))

const createAppDatabase = (filePath, notebookTitle) => {
  const database = new Database(filePath)
  runMigrations(database)
  database
    .prepare(
      `
      INSERT INTO notebooks (title, content_json, plain_text_length)
      VALUES (?, '{"type":"doc","content":[]}', 0)
    `,
    )
    .run(notebookTitle)
  return database
}

const readNotebookTitles = (filePath) => {
  const database = new Database(filePath, { readonly: true })
  try {
    return database.prepare('SELECT title FROM notebooks ORDER BY id').all().map((row) => row.title)
  } finally {
    database.close()
  }
}

const run = async () => {
  const legacyPath = path.join(tempDirectory, 'legacy.db')
  const migratedPath = path.join(tempDirectory, 'migrated.db')
  const activePath = path.join(tempDirectory, 'active.db')
  const exportPath = path.join(tempDirectory, 'exported.db')
  const backupDirectory = path.join(tempDirectory, 'backups')
  const importSourcePath = path.join(tempDirectory, 'import-source.db')
  const stagingPath = path.join(tempDirectory, 'staging.db')
  const rollbackPath = path.join(tempDirectory, 'rollback.db')
  const invalidPath = path.join(tempDirectory, 'invalid.db')
  const unrelatedPath = path.join(tempDirectory, 'unrelated.db')

  const legacyDatabase = createAppDatabase(legacyPath, 'Legacy notebook')
  legacyDatabase.close()
  assert.equal(copyLegacyDatabase(migratedPath, [legacyPath]), true)
  assert.deepEqual(readNotebookTitles(migratedPath), ['Legacy notebook'])
  assert.equal(copyLegacyDatabase(migratedPath, [legacyPath]), false)

  const activeDatabase = createAppDatabase(activePath, 'Current notebook')
  await backupDatabaseTo(activeDatabase, exportPath)
  assert.deepEqual(readNotebookTitles(exportPath), ['Current notebook'])
  assert.deepEqual(validateDatabaseFile(exportPath), { ok: true })
  await assert.rejects(() => backupDatabaseTo(activeDatabase, activePath), /different/)

  const fixedDate = new Date('2026-07-27T10:20:30.000Z')
  assert.equal(timestampForFilename(fixedDate), '2026-07-27_10-20-30')
  const firstBackup = await createAutomaticBackup(activeDatabase, backupDirectory, fixedDate)
  const secondBackup = await createAutomaticBackup(activeDatabase, backupDirectory, fixedDate)
  assert.equal(path.basename(firstBackup), 'pied-piper-backup-2026-07-27_10-20-30.db')
  assert.equal(path.basename(secondBackup), 'pied-piper-backup-2026-07-27_10-20-30-2.db')

  fs.writeFileSync(invalidPath, 'not a database')
  assert.throws(() => validateDatabaseFile(invalidPath), /not a readable SQLite database/)

  const unrelatedDatabase = new Database(unrelatedPath)
  unrelatedDatabase.exec('CREATE TABLE unrelated (id INTEGER PRIMARY KEY)')
  unrelatedDatabase.close()
  assert.throws(() => validateDatabaseFile(unrelatedPath), /not a Pied Piper database/)

  const importSourceDatabase = createAppDatabase(importSourcePath, 'Imported notebook')
  importSourceDatabase.close()
  await prepareImportDatabase(importSourcePath, stagingPath)
  assert.deepEqual(readNotebookTitles(stagingPath), ['Imported notebook'])

  replaceDatabaseFile(activeDatabase, stagingPath, rollbackPath)
  assert.deepEqual(readNotebookTitles(activePath), ['Imported notebook'])
  assert.equal(fs.existsSync(stagingPath), false)
  assert.equal(fs.existsSync(rollbackPath), false)

  const failureActivePath = path.join(tempDirectory, 'failure-active.db')
  const failurePreparedPath = path.join(tempDirectory, 'failure-prepared.db')
  const failureRollbackPath = path.join(tempDirectory, 'failure-rollback.db')
  const failureDatabase = createAppDatabase(failureActivePath, 'Protected notebook')
  fs.writeFileSync(failurePreparedPath, 'invalid replacement')
  assert.throws(
    () =>
      replaceDatabaseFile(
        failureDatabase,
        failurePreparedPath,
        failureRollbackPath,
      ),
    /not a readable SQLite database/,
  )
  assert.deepEqual(readNotebookTitles(failureActivePath), ['Protected notebook'])
  assert.equal(fs.existsSync(failureRollbackPath), true)
}

run()
  .then(() => {
    fs.rmSync(tempDirectory, { recursive: true, force: true })
    console.log('Database export, backup, validation, and import tests passed.')
  })
  .catch((error) => {
    fs.rmSync(tempDirectory, { recursive: true, force: true })
    console.error(error)
    process.exitCode = 1
  })
