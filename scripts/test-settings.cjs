const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { runMigrations } = require('../electron/db.cjs')
const {
  DEFAULT_THEMES,
  getApplicationSettings,
  saveApplicationSettings,
} = require('../electron/database/settings.cjs')

const database = new Database(':memory:')
runMigrations(database)

const defaults = getApplicationSettings(database)
assert.equal(defaults.applicationName, 'Pied Piper')
assert.deepEqual(defaults.featureThemes, DEFAULT_THEMES)
assert.equal(defaults.databaseLocation, ':memory:')
assert.equal(defaults.storageUsedBytes, 0)

saveApplicationSettings(database, {
  applicationName: 'Coursebook',
  featureThemes: DEFAULT_THEMES,
})
runMigrations(database)
assert.equal(getApplicationSettings(database).applicationName, 'Pied Piper')

const customThemes = Object.fromEntries(
  Object.keys(DEFAULT_THEMES).map((key, index) => [
    key,
    `#${String(index + 1).repeat(6)}`,
  ]),
)

const saved = saveApplicationSettings(database, {
  applicationName: 'Pied Piper Test',
  featureThemes: customThemes,
})

assert.equal(saved.applicationName, 'Pied Piper Test')
assert.deepEqual(saved.featureThemes, customThemes)
assert.equal(getApplicationSettings(database).applicationName, 'Pied Piper Test')
assert.equal(database.prepare('SELECT COUNT(*) AS count FROM app_settings').get().count, 2)

assert.throws(
  () =>
    saveApplicationSettings(database, {
      applicationName: ' ',
      featureThemes: customThemes,
    }),
  /Application name is required/,
)

assert.throws(
  () =>
    saveApplicationSettings(database, {
      applicationName: 'Valid name',
      featureThemes: { ...customThemes, dashboard: '#abc' },
    }),
  /six-digit hex value/,
)

database.close()
console.log('Settings tests passed.')
