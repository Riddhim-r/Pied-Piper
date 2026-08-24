const fs = require('node:fs')
const path = require('node:path')

/**
 * Runs an automated periodic database backup.
 * Creates timestamped snapshots in appData/backups directory every 3 days.
 */
function runPeriodicBackup(database, userDataPath) {
  try {
    const backupDir = path.join(userDataPath, 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const lastBackupFile = path.join(backupDir, '.last_backup')
    const NOW = Date.now()
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

    if (fs.existsSync(lastBackupFile)) {
      const lastTime = Number(fs.readFileSync(lastBackupFile, 'utf8') || '0')
      if (NOW - lastTime < THREE_DAYS_MS) {
        return
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    const backupPath = path.join(backupDir, `pied-piper-backup-${dateStr}.db`)

    database.backup(backupPath)
      .then(() => {
        fs.writeFileSync(lastBackupFile, String(NOW), 'utf8')
        console.log(`[BackupService] Database backed up successfully to: ${backupPath}`)
      })
      .catch((err) => {
        console.error('[BackupService] Automated database backup failed:', err)
      })
  } catch (error) {
    console.error('[BackupService] Periodic backup error:', error)
  }
}

module.exports = {
  runPeriodicBackup,
}
