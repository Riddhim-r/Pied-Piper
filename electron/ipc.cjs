const fs = require('node:fs')
const path = require('node:path')
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron')
const {
  createLink,
  createTopic,
  deleteLink,
  deleteTopic,
  getTopic,
  listLinks,
  listTopics,
  updateLink,
  updateTopic,
} = require('./database/encyclopedia.cjs')
const {
  addTodoTask,
  createTodoList,
  deleteTodoList,
  getTodoState,
  setTodoTaskCompleted,
} = require('./database/todo.cjs')
const {
  createNotebook,
  discardEmptyNotebook,
  getNotebook,
  listNotebooks,
  listTags,
  permanentlyDeleteNotebook,
  renameTag,
  restoreNotebook,
  saveNotebook,
  softDeleteNotebook,
} = require('./database/notes.cjs')
const {
  createEntry,
  listEntries,
  softDeleteEntry,
  updateEntry,
} = require('./database/knowledge-entries.cjs')
const {
  getRecycleBinCategories,
  listRecycleBinItems,
  permanentlyDeleteRecycleBinItems,
  restoreRecycleBinItems,
} = require('./database/recycle-bin.cjs')
const {
  getApplicationSettings,
  saveApplicationSettings,
} = require('./database/settings.cjs')
const {
  backupDatabaseTo,
  createAutomaticBackup,
  prepareImportDatabase,
  replaceDatabaseFile,
  samePath,
  validateDatabaseFile,
} = require('./database/database-files.cjs')
const { ensureDatabase } = require('./db.cjs')

const registerIpcHandlers = () => {
  const db = ensureDatabase()

  ipcMain.handle('encyclopedia:list-topics', async () => {
    return listTopics(db)
  })

  ipcMain.handle('encyclopedia:create-topic', async (_event, payload) => {
    return createTopic(db, payload)
  })

  ipcMain.handle('encyclopedia:update-topic', async (_event, id, payload) => {
    return updateTopic(db, id, payload)
  })

  ipcMain.handle('encyclopedia:delete-topic', async (_event, id) => {
    return deleteTopic(db, id)
  })

  ipcMain.handle('encyclopedia:get-topic', async (_event, id) => {
    return getTopic(db, id)
  })

  ipcMain.handle('encyclopedia:list-links', async (_event, topicId) => {
    return listLinks(db, topicId)
  })

  ipcMain.handle('encyclopedia:create-link', async (_event, topicId, payload) => {
    return createLink(db, topicId, payload)
  })

  ipcMain.handle('encyclopedia:update-link', async (_event, id, payload) => {
    return updateLink(db, id, payload)
  })

  ipcMain.handle('encyclopedia:delete-link', async (_event, id) => {
    return deleteLink(db, id)
  })

  ipcMain.handle('encyclopedia:open-link', async (_event, rawUrl) => {
    const value = String(rawUrl ?? '').trim()
    const normalizedUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`
    const parsedUrl = new URL(normalizedUrl)

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP and HTTPS links can be opened.')
    }

    await shell.openExternal(parsedUrl.toString())
    return { ok: true }
  })

  ipcMain.handle('todo:get-state', async () => {
    return getTodoState(db)
  })

  ipcMain.handle('todo:create-list', async (_event, payload) => {
    return createTodoList(db, payload)
  })

  ipcMain.handle('todo:add-task', async (_event, payload) => {
    return addTodoTask(db, payload)
  })

  ipcMain.handle('todo:set-task-completed', async (_event, id, isCompleted) => {
    return setTodoTaskCompleted(db, id, isCompleted)
  })

  ipcMain.handle('todo:delete-list', async () => {
    return deleteTodoList(db)
  })

  ipcMain.handle('notes:list', async (_event, params) => {
    return listNotebooks(db, params)
  })

  ipcMain.handle('notes:get', async (_event, id) => {
    return getNotebook(db, id)
  })

  ipcMain.handle('notes:create', async (_event, title) => {
    return createNotebook(db, title)
  })

  ipcMain.handle('notes:discard-empty', async (_event, id) => {
    return discardEmptyNotebook(db, id)
  })

  ipcMain.handle('notes:save', async (_event, payload) => {
    return saveNotebook(db, payload)
  })

  ipcMain.handle('notes:soft-delete', async (_event, id) => {
    return softDeleteNotebook(db, id)
  })

  ipcMain.handle('notes:restore', async (_event, id) => {
    return restoreNotebook(db, id)
  })

  ipcMain.handle('notes:permanent-delete', async (_event, id) => {
    return permanentlyDeleteNotebook(db, id)
  })

  ipcMain.handle('notes:list-tags', async () => {
    return listTags(db)
  })

  ipcMain.handle('notes:rename-tag', async (_event, oldTag, newTag) => {
    return renameTag(db, oldTag, newTag)
  })

  ipcMain.handle('notes:store-image', async (_event, filename, dataBase64) => {
    const extension = String(filename ?? '').split('.').pop()?.toLowerCase()
    const mimeTypes = {
      gif: 'image/gif',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    }
    const mimeType = mimeTypes[extension]
    if (!mimeType) {
      throw new Error('Use a PNG, JPEG, GIF, or WebP image.')
    }

    const imageBuffer = Buffer.from(String(dataBase64 ?? ''), 'base64')
    if (imageBuffer.length === 0 || imageBuffer.length > 5 * 1024 * 1024) {
      throw new Error('Images must be 5 MB or smaller.')
    }

    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
  })

  ipcMain.handle('notes:open-link', async (_event, rawUrl) => {
    const parsedUrl = new URL(String(rawUrl ?? '').trim())
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP and HTTPS links can be opened.')
    }
    await shell.openExternal(parsedUrl.toString())
    return { ok: true }
  })

  ipcMain.handle('notes:export-pdf', async (event, payload) => {
    const title = String(payload?.title ?? '').trim() || 'Notebook'
    const contentHtml = String(payload?.contentHtml ?? '')
    const safeFilename = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 100)
    const ownerWindow = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(ownerWindow, {
      title: 'Export notebook as PDF',
      defaultPath: `${safeFilename}.pdf`,
      filters: [{ name: 'PDF document', extensions: ['pdf'] }],
    })

    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        javascript: false,
        nodeIntegration: false,
        sandbox: true,
      },
    })

    const printDocument = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title.replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[character])}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body { color: #241f27; font-family: Georgia, serif; line-height: 1.55; }
            h1, h2, h3 { font-family: Arial, sans-serif; line-height: 1.2; }
            h1 { font-size: 28px; } h2 { font-size: 22px; } h3 { font-size: 18px; }
            img { max-width: 100%; height: auto; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #555; padding: 6px; vertical-align: top; }
            pre { background: #f2f2f2; padding: 12px; white-space: pre-wrap; }
            a { color: #315f91; }
            ul[data-type="taskList"] { list-style: none; padding-left: 0; }
            ul[data-type="taskList"] li { display: flex; gap: 8px; }
          </style>
        </head>
        <body>
          <h1>${title.replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[character])}</h1>
          ${contentHtml}
        </body>
      </html>
    `

    try {
      await printWindow.loadURL(
        `data:text/html;base64,${Buffer.from(printDocument, 'utf8').toString('base64')}`,
      )
      const pdfData = await printWindow.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
      })
      fs.writeFileSync(result.filePath, pdfData)
      return { canceled: false, filePath: result.filePath }
    } finally {
      printWindow.destroy()
    }
  })

  ipcMain.handle('helpbook:list', async () => {
    return listEntries(db, 'helpbook')
  })

  ipcMain.handle('helpbook:create', async (_event, payload) => {
    return createEntry(db, 'helpbook', payload)
  })

  ipcMain.handle('helpbook:update', async (_event, id, payload) => {
    return updateEntry(db, 'helpbook', id, payload)
  })

  ipcMain.handle('helpbook:delete', async (_event, id) => {
    return softDeleteEntry(db, 'helpbook', id)
  })

  ipcMain.handle('prompts:list', async () => {
    return listEntries(db, 'prompts')
  })

  ipcMain.handle('prompts:create', async (_event, payload) => {
    return createEntry(db, 'prompts', payload)
  })

  ipcMain.handle('prompts:update', async (_event, id, payload) => {
    return updateEntry(db, 'prompts', id, payload)
  })

  ipcMain.handle('prompts:delete', async (_event, id) => {
    return softDeleteEntry(db, 'prompts', id)
  })

  ipcMain.handle('recycle-bin:list-categories', async () => {
    return getRecycleBinCategories(db)
  })

  ipcMain.handle('recycle-bin:list-items', async (_event, category) => {
    return listRecycleBinItems(db, category)
  })

  ipcMain.handle('recycle-bin:restore-items', async (_event, recycleItemIds) => {
    return restoreRecycleBinItems(db, recycleItemIds)
  })

  ipcMain.handle('recycle-bin:permanently-delete-items', async (_event, recycleItemIds) => {
    return permanentlyDeleteRecycleBinItems(db, recycleItemIds)
  })

  ipcMain.handle('settings:get', async () => {
    return getApplicationSettings(db)
  })

  ipcMain.handle('settings:save', async (_event, payload) => {
    return saveApplicationSettings(db, payload)
  })

  ipcMain.handle('settings:export-database', async (event) => {
    const ownerWindow = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(ownerWindow, {
      title: 'Export database',
      defaultPath: path.join(
        app.getPath('documents'),
        `pied-piper-database-${new Date().toISOString().slice(0, 10)}.db`,
      ),
      filters: [{ name: 'SQLite database', extensions: ['db', 'sqlite', 'sqlite3'] }],
    })

    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }

    await backupDatabaseTo(db, result.filePath)
    return { canceled: false, filePath: result.filePath }
  })

  ipcMain.handle('settings:create-backup', async () => {
    const backupPath = await createAutomaticBackup(
      db,
      path.join(app.getPath('userData'), 'backups'),
    )
    return { canceled: false, filePath: backupPath }
  })

  ipcMain.handle('settings:import-database', async (event) => {
    const ownerWindow = BrowserWindow.fromWebContents(event.sender)
    const selection = await dialog.showOpenDialog(ownerWindow, {
      title: 'Import database',
      properties: ['openFile'],
      filters: [{ name: 'SQLite database', extensions: ['db', 'sqlite', 'sqlite3'] }],
    })

    if (selection.canceled || selection.filePaths.length === 0) {
      return { canceled: true }
    }

    const sourcePath = selection.filePaths[0]
    if (samePath(sourcePath, db.name)) {
      throw new Error('The selected file is already the active database.')
    }
    validateDatabaseFile(sourcePath)

    const confirmation = await dialog.showMessageBox(ownerWindow, {
      type: 'warning',
      title: 'Import database?',
      message: 'Importing will replace the current application data and restart the app.',
      detail:
        'A safety backup of the current database will be created automatically before replacement.',
      buttons: ['Cancel', 'Import and Restart'],
      defaultId: 1,
      cancelId: 0,
      noLink: true,
    })

    if (confirmation.response !== 1) {
      return { canceled: true }
    }

    const userDataPath = app.getPath('userData')
    const operationId = `${process.pid}-${Date.now()}`
    const stagingPath = path.join(userDataPath, `.database-import-${operationId}.db`)
    const rollbackPath = path.join(userDataPath, `.database-rollback-${operationId}.db`)
    let safetyBackupPath = ''
    let replacementStarted = false

    try {
      await prepareImportDatabase(sourcePath, stagingPath)
      safetyBackupPath = await createAutomaticBackup(
        db,
        path.join(userDataPath, 'backups'),
      )
      replacementStarted = true
      replaceDatabaseFile(db, stagingPath, rollbackPath)
    } catch (error) {
      if (fs.existsSync(stagingPath)) fs.rmSync(stagingPath)
      if (replacementStarted) {
        setTimeout(() => {
          app.relaunch()
          app.exit(0)
        }, 800)
      } else if (fs.existsSync(rollbackPath)) {
        fs.rmSync(rollbackPath)
      }
      throw error
    }

    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 300)

    return {
      canceled: false,
      restarting: true,
      safetyBackupPath,
    }
  })
}

module.exports = { registerIpcHandlers }
