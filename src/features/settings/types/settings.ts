export type ThemeFeatureId =
  | 'dashboard'
  | 'helpbook'
  | 'ai-prompts'
  | 'notes'
  | 'encyclopedia'
  | 'todo'
  | 'recycle-bin'
  | 'settings'

export type FeatureThemes = Record<ThemeFeatureId, string>

export type ApplicationSettings = {
  applicationName: string
  featureThemes: FeatureThemes
  databaseLocation: string
  storageUsedBytes: number
}

export type ApplicationSettingsInput = Pick<
  ApplicationSettings,
  'applicationName' | 'featureThemes'
>
