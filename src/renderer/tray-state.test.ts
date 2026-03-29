import { describe, expect, it } from 'vitest'
import { shouldCreateTray, shouldDestroyTray } from '../main/tray-state'

describe('tray reconciliation', () => {
  it('creates tray only when enabled and absent', () => {
    expect(shouldCreateTray(true, false)).toBe(true)
    expect(shouldCreateTray(true, true)).toBe(false)
    expect(shouldCreateTray(false, false)).toBe(false)
  })

  it('destroys tray only when disabled and present', () => {
    expect(shouldDestroyTray(false, true)).toBe(true)
    expect(shouldDestroyTray(true, true)).toBe(false)
    expect(shouldDestroyTray(false, false)).toBe(false)
  })
})
