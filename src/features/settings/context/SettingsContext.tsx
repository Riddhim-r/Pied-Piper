import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'
import {
  getApplicationSettings,
  saveApplicationSettings,
} from '../services/settingsService'
import type {
  ApplicationSettings,
  ApplicationSettingsInput,
  ThemeFeatureId,
} from '../types/settings'

export const defaultSettings: ApplicationSettings = {
  applicationName: 'Pied Piper',
  featureThemes: {
    dashboard: '#efc8d5',
    helpbook: '#f4d8e2',
    'ai-prompts': '#d8e6f4',
    notes: '#eadcf4',
    encyclopedia: '#d9eee5',
    todo: '#f5e4c8',
    'recycle-bin': '#e2e2e2',
    settings: '#d8e7ee',
  },
  databaseLocation: '',
  storageUsedBytes: 0,
}

type SettingsContextValue = {
  settings: ApplicationSettings
  isLoading: boolean
  saveSettings: (input: ApplicationSettingsInput) => Promise<ApplicationSettings>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

const getFeatureFromPath = (path: string): ThemeFeatureId => {
  if (path.startsWith('/helpbook')) return 'helpbook'
  if (path.startsWith('/ai-prompts')) return 'ai-prompts'
  if (path.startsWith('/notes')) return 'notes'
  if (path.startsWith('/encyclopedia')) return 'encyclopedia'
  if (path.startsWith('/todo')) return 'todo'
  if (path.startsWith('/recycle-bin')) return 'recycle-bin'
  if (path.startsWith('/settings')) return 'settings'
  return 'dashboard'
}

const lightenHex = (hex: string) => {
  const value = hex.slice(1)
  const channels = [0, 2, 4].map((start) => Number.parseInt(value.slice(start, start + 2), 16))
  const lighter = channels.map((channel) => Math.round(channel + (255 - channel) * 0.2))
  return `#${lighter.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const [settings, setSettings] = useState(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setSettings(await getApplicationSettings())
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const feature = getFeatureFromPath(location.pathname)
    const color = settings.featureThemes[feature]
    document.documentElement.style.setProperty('--bg', color)
    document.documentElement.style.setProperty('--bg-2', lightenHex(color))
    document.title = settings.applicationName
  }, [location.pathname, settings])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isLoading,
      saveSettings: async (input) => {
        const saved = await saveApplicationSettings(input)
        setSettings(saved)
        return saved
      },
    }),
    [settings, isLoading],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useAppSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useAppSettings must be used within SettingsProvider.')
  }
  return context
}
