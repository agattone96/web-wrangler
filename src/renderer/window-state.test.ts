import { describe, expect, it, vi } from 'vitest'
import { getMainWindowState, persistWindowBounds } from '../main/window-state'

describe('main window state helpers', () => {
  it('always loads the main window state from the canonical key', () => {
    const load = vi.fn(() => ({ width: 1200, height: 800, x: 40, y: 60 }))
    expect(getMainWindowState(load)).toEqual({ width: 1200, height: 800, x: 40, y: 60 })
    expect(load).toHaveBeenCalledWith('main')
  })

  it('persists bounds through the provided saver', () => {
    const save = vi.fn()
    const win = {
      isDestroyed: () => false,
      getBounds: () => ({ x: 10, y: 20, width: 900, height: 700 }),
    }

    persistWindowBounds(win as never, save, 'main')

    expect(save).toHaveBeenCalledWith('main', { x: 10, y: 20, width: 900, height: 700 })
  })
})
