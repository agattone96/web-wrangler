import type { BrowserWindow, Rectangle } from 'electron'
import type { WindowState } from '../shared/types'

export function getMainWindowState(loadWindowState: (key: string) => WindowState): WindowState {
  return loadWindowState('main')
}

export function persistWindowBounds(
  win: Pick<BrowserWindow, 'isDestroyed' | 'getBounds'>,
  saveWindowState: (key: string, state: WindowState) => void,
  key: string
): void {
  if (win.isDestroyed()) return

  const bounds = win.getBounds() as Rectangle
  saveWindowState(key, {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  })
}
