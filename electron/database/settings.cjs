const fs = require('node:fs')

const DEFAULT_THEMES = {
  dashboard: '#efc8d5',
  helpbook: '#f4d8e2',
  'ai-prompts': '#d8e6f4',
  notes: '#eadcf4',
  encyclopedia: '#d9eee5',
  todo: '#f5e4c8',
  'recycle-bin': '#e2e2e2',
  settings: '#d8e7ee',
}

const THEME_KEYS = Object.keys(DEFAULT_THEMES)
const HEX_COLOR = /^#[0-9a-f]{6}$/i

const getStoredValue = (database, key) => {
  return database.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(key)?.value
}

const parseThemes = (storedThemes) => {
  if (!storedThemes) {
    return { ...DEFAULT_THEMES }
  }

  try {
    const parsed = JSON.parse(storedThemes)
    return Object.fromEntries(
      THEME_KEYS.map((key) => [
        key,
        HEX_COLOR.test(parsed[key] ?? '') ? parsed[key].toLowerCase() : DEFAULT_THEMES[key],
      ]),
    )
  } catch {
    return { ...DEFAULT_THEMES }
  }
}

const getApplicationSettings = (database) => {
  const databaseLocation = database.name
  let storageUsedBytes = 0

  try {
    storageUsedBytes = fs.statSync(databaseLocation).size
  } catch {
    storageUsedBytes = 0
  }

  return {
    applicationName: getStoredValue(database, 'application_name') || 'Pied Piper',
    featureThemes: parseThemes(getStoredValue(database, 'feature_themes')),
    databaseLocation,
    storageUsedBytes,
  }
}

const saveApplicationSettings = (database, payload) => {
  const applicationName = String(payload?.applicationName ?? '').trim()
  if (!applicationName) {
    throw new Error('Application name is required.')
  }
  if (applicationName.length > 80) {
    throw new Error('Application name must be 80 characters or fewer.')
  }

  const featureThemes = {}
  THEME_KEYS.forEach((key) => {
    const color = String(payload?.featureThemes?.[key] ?? '').trim()
    if (!HEX_COLOR.test(color)) {
      throw new Error(`Theme color for ${key} must use a six-digit hex value.`)
    }
    featureThemes[key] = color.toLowerCase()
  })

  const save = database.transaction(() => {
    const upsert = database.prepare(
      `
      INSERT INTO app_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    )
    upsert.run('application_name', applicationName)
    upsert.run('feature_themes', JSON.stringify(featureThemes))
  })

  save()
  return getApplicationSettings(database)
}

module.exports = {
  DEFAULT_THEMES,
  getApplicationSettings,
  saveApplicationSettings,
}
