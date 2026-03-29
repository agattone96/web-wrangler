import type { AppSettings } from '../shared/types'

export type AppSettingsUpdate = Partial<Omit<AppSettings, 'appId'>>

export interface AppSettingsUpdateResult {
  appliedLive: boolean
  reopenRequiredFields: (keyof Omit<AppSettings, 'appId'>)[]
}

const LIVE_FIELDS: Array<keyof Omit<AppSettings, 'appId'>> = [
  'zoomLevel',
  'darkMode',
  'customCss',
]

const REOPEN_REQUIRED_FIELDS: Array<keyof Omit<AppSettings, 'appId'>> = [
  'blockAds',
  'customJs',
  'userAgent',
  'openAtLogin',
  'notifications',
  'proxyUrl',
]

export function getAppSettingsUpdateResult(data: AppSettingsUpdate): AppSettingsUpdateResult {
  const changedFields = Object.keys(data) as Array<keyof Omit<AppSettings, 'appId'>>
  const reopenRequiredFields = changedFields.filter((field) => REOPEN_REQUIRED_FIELDS.includes(field))
  const appliedLive = changedFields.some((field) => LIVE_FIELDS.includes(field))

  return {
    appliedLive,
    reopenRequiredFields,
  }
}
