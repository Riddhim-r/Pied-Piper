import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/PageHeader'
import TopNav from '../../../components/TopNav'
import { defaultSettings, useAppSettings } from '../context/SettingsContext'
import {
  createDatabaseBackup,
  exportDatabase,
  importDatabase,
} from '../services/settingsService'
import type { ApplicationSettingsInput, ThemeFeatureId } from '../types/settings'

const themeFeatures: Array<{ id: ThemeFeatureId; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'helpbook', label: 'Helpbook' },
  { id: 'ai-prompts', label: 'AI Prompt Vault' },
  { id: 'notes', label: 'Notes for Noobs' },
  { id: 'encyclopedia', label: 'Encyclopedia' },
  { id: 'todo', label: 'Todo' },
  { id: 'recycle-bin', label: 'Recycle Bin' },
  { id: 'settings', label: 'Settings' },
]

const shortcuts: Array<{ keys: string[]; description: string }> = [
  { keys: ['Alt + Left Arrow'], description: 'Move to the previous page' },
  { keys: ['Alt + Right Arrow'], description: 'Move to the next page' },
  { keys: ['Alt + Home'], description: 'Open the Dashboard' },
  {
    keys: ['Alt + Shift + U', 'or', 'Shift + F3'],
    description: 'Toggle text case (caps to regular & vice versa) for selected text',
  },
  { keys: ['Ctrl + K'], description: 'Search and open an application page' },
  { keys: ['Ctrl + ,'], description: 'Open Settings' },
  { keys: ['Ctrl + N'], description: 'Create a new item in the current feature' },
  { keys: ['Ctrl + Shift + T'], description: 'Open Todo' },
  { keys: ['Ctrl + Shift + Delete'], description: 'Open the Recycle Bin' },
  {
    keys: ['Escape'],
    description:
      'Close active search, menu, dialog, or empty creation form (preserves content if non-empty)',
  },
]

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

const SettingsPage = () => {
  const { settings, isLoading, saveSettings } = useAppSettings()
  const [draft, setDraft] = useState<ApplicationSettingsInput>({
    applicationName: settings.applicationName,
    featureThemes: { ...settings.featureThemes },
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [databaseAction, setDatabaseAction] = useState<
    'export' | 'import' | 'backup' | null
  >(null)
  const [databaseError, setDatabaseError] = useState('')
  const [databaseSuccess, setDatabaseSuccess] = useState('')

  useEffect(() => {
    setDraft({
      applicationName: settings.applicationName,
      featureThemes: { ...settings.featureThemes },
    })
  }, [settings])

  const invalidTheme = useMemo(
    () =>
      themeFeatures.find(
        ({ id }) => !/^#[0-9a-f]{6}$/i.test(draft.featureThemes[id]),
      ),
    [draft.featureThemes],
  )

  const handleSave = async () => {
    setError('')
    setSuccess('')
    if (!draft.applicationName.trim()) {
      setError('Application name is required.')
      return
    }
    if (invalidTheme) {
      setError(`${invalidTheme.label} must use a six-digit hex value such as #efc8d5.`)
      return
    }

    setIsSaving(true)
    try {
      await saveSettings({
        applicationName: draft.applicationName.trim(),
        featureThemes: draft.featureThemes,
      })
      setSuccess('Settings saved.')
    } catch (saveError) {
      console.error(saveError)
      setError(saveError instanceof Error ? saveError.message : 'Could not save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const beginDatabaseAction = () => {
    setDatabaseError('')
    setDatabaseSuccess('')
  }

  const handleExportDatabase = async () => {
    beginDatabaseAction()
    setDatabaseAction('export')
    try {
      const result = await exportDatabase()
      if (!result.canceled && result.filePath) {
        setDatabaseSuccess(`Database exported to ${result.filePath}`)
      }
    } catch (actionError) {
      console.error(actionError)
      setDatabaseError(
        actionError instanceof Error ? actionError.message : 'Could not export the database.',
      )
    } finally {
      setDatabaseAction(null)
    }
  }

  const handleCreateBackup = async () => {
    beginDatabaseAction()
    setDatabaseAction('backup')
    try {
      const result = await createDatabaseBackup()
      if (!result.canceled && result.filePath) {
        setDatabaseSuccess(`Backup created at ${result.filePath}`)
      }
    } catch (actionError) {
      console.error(actionError)
      setDatabaseError(
        actionError instanceof Error ? actionError.message : 'Could not create the backup.',
      )
    } finally {
      setDatabaseAction(null)
    }
  }

  const handleImportDatabase = async () => {
    beginDatabaseAction()
    setDatabaseAction('import')
    try {
      const result = await importDatabase()
      if (!result.canceled && result.restarting) {
        setDatabaseSuccess('Database imported. The application is restarting...')
      } else {
        setDatabaseAction(null)
      }
    } catch (actionError) {
      console.error(actionError)
      setDatabaseError(
        actionError instanceof Error ? actionError.message : 'Could not import the database.',
      )
      setDatabaseAction(null)
    }
  }

  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="Application preferences"
        rightSlot={
          <Link className="btn ghost" to="/dashboard">
            Back
          </Link>
        }
      />

      <main className="content">
        <PageHeader
          title="Settings"
          description="Personalize the application and review its local data."
        />

        <section className="card settings-section">
          <div>
            <h2>Application</h2>
            <p className="muted">These details are stored in the same local SQLite database.</p>
          </div>

          <label className="field">
            <span>Application Name</span>
            <input
              type="text"
              maxLength={80}
              value={draft.applicationName}
              disabled={isLoading}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  applicationName: event.target.value,
                }))
              }
            />
          </label>

          <div className="settings-info-grid">
            <div className="settings-info">
              <span>Database Location</span>
              <code>{settings.databaseLocation || 'Available in the desktop application'}</code>
            </div>
            <div className="settings-info">
              <span>Storage Used</span>
              <strong>{formatBytes(settings.storageUsedBytes)}</strong>
            </div>
          </div>
        </section>

        <section className="card settings-section">
          <div>
            <h2>Feature Themes</h2>
            <p className="muted">
              Set a six-digit hex background color for each part of the application.
            </p>
          </div>

          <div className="settings-theme-grid">
            {themeFeatures.map(({ id, label }) => {
              const color = draft.featureThemes[id]
              const validColor = /^#[0-9a-f]{6}$/i.test(color)
              return (
                <label className="settings-theme-field" key={id}>
                  <span>{label}</span>
                  <div className="settings-color-controls">
                    <input
                      type="color"
                      aria-label={`${label} color picker`}
                      value={validColor ? color : '#ffffff'}
                      disabled={isLoading}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          featureThemes: {
                            ...current.featureThemes,
                            [id]: event.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      type="text"
                      aria-label={`${label} hex value`}
                      value={color}
                      maxLength={7}
                      spellCheck={false}
                      disabled={isLoading}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          featureThemes: {
                            ...current.featureThemes,
                            [id]: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </label>
              )
            })}
          </div>

          <div className="card-actions">
            <button
              className="btn ghost"
              type="button"
              disabled={isLoading || isSaving}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  featureThemes: { ...defaultSettings.featureThemes },
                }))
              }
            >
              Use Default Colors
            </button>
            <button
              className="btn primary"
              type="button"
              disabled={isLoading || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
          {success ? <p className="success-message">{success}</p> : null}
        </section>

        <section className="card settings-section">
          <div>
            <h2>Database Actions</h2>
            <p className="muted">
              Export a portable copy, create a local safety backup, or replace the current
              data with another Pied Piper SQLite database.
            </p>
          </div>
          <p className="settings-warning">
            Import validates the selected file, automatically backs up the current database,
            and restarts the application.
          </p>
          <div className="card-actions">
            <button
              className="btn ghost"
              type="button"
              disabled={databaseAction !== null}
              onClick={handleExportDatabase}
            >
              {databaseAction === 'export' ? 'Exporting...' : 'Export Database'}
            </button>
            <button
              className="btn ghost"
              type="button"
              disabled={databaseAction !== null}
              onClick={handleImportDatabase}
            >
              {databaseAction === 'import' ? 'Importing...' : 'Import Database'}
            </button>
            <button
              className="btn ghost"
              type="button"
              disabled={databaseAction !== null}
              onClick={handleCreateBackup}
            >
              {databaseAction === 'backup' ? 'Creating...' : 'Create Backup'}
            </button>
          </div>
          {databaseError ? <p className="error settings-path-message">{databaseError}</p> : null}
          {databaseSuccess ? (
            <p className="success-message settings-path-message">{databaseSuccess}</p>
          ) : null}
        </section>

        <section className="card settings-section" id="keyboard-shortcuts">
          <div>
            <h2>Keyboard Shortcuts</h2>
            <p className="muted">Reference for the shortcuts currently available.</p>
          </div>
          <div className="settings-shortcut-grid">
            {shortcuts.map(({ keys, description }, index) => (
              <div className="settings-shortcut" key={index}>
                <div className="settings-shortcut-keys">
                  {keys.map((k, i) =>
                    k === 'or' ? (
                      <span key={i} className="shortcut-or">
                        or
                      </span>
                    ) : (
                      <kbd key={i}>{k}</kbd>
                    ),
                  )}
                </div>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default SettingsPage
