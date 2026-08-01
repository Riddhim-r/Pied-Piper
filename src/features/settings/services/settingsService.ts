import { desktopApi } from '../../../lib/desktopApi'
import type {
  ApplicationSettings,
  ApplicationSettingsInput,
} from '../types/settings'

export const getApplicationSettings = async () => {
  return desktopApi.getApplicationSettings() as Promise<ApplicationSettings>
}

export const saveApplicationSettings = async (settings: ApplicationSettingsInput) => {
  return desktopApi.saveApplicationSettings(settings) as Promise<ApplicationSettings>
}

export const exportDatabase = () => desktopApi.exportDatabase()

export const importDatabase = () => desktopApi.importDatabase()

export const createDatabaseBackup = () => desktopApi.createDatabaseBackup()
