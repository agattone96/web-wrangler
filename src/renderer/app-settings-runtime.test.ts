import { describe, expect, it } from 'vitest'
import { getAppSettingsUpdateResult } from '../main/app-settings-runtime'

describe('getAppSettingsUpdateResult', () => {
  it('marks zoom and dark mode as live updates', () => {
    expect(getAppSettingsUpdateResult({ zoomLevel: 1.25, darkMode: true })).toEqual({
      appliedLive: true,
      reopenRequiredFields: [],
    })
  })

  it('marks proxy and user agent as reopen-required', () => {
    expect(getAppSettingsUpdateResult({ proxyUrl: 'http://127.0.0.1:8080', userAgent: 'UA' })).toEqual({
      appliedLive: false,
      reopenRequiredFields: ['proxyUrl', 'userAgent'],
    })
  })
})
