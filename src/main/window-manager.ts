import { BrowserWindow, session, app, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { getDb, getAppSettings, getWindowState, saveWindowState } from './db'
import type { App, Profile } from '../shared/types'
import { setupAdblocker } from './adblocker'

// track open windows: key = `${appId}::${profileId}`
const openWindows = new Map<string, BrowserWindow>()

export function getWindowKey(appId: string, profileId: string): string {
  return `${appId}::${profileId}`
}

export function getSessionPartition(appId: string, profileId: string): string {
  return `persist:${appId}-${profileId}`
}

export async function openAppWindow(appEntry: App, profile: Profile): Promise<void> {
  const key = getWindowKey(appEntry.id, profile.id)

  // Focus if already open
  const existing = openWindows.get(key)
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore()
    existing.focus()
    return
  }

  const settings = getAppSettings(appEntry.id)
  const partition = getSessionPartition(appEntry.id, profile.id)
  const sess = session.fromPartition(partition, { cache: true })

  // Set up ad blocking for this session
  if (settings.blockAds) {
    await setupAdblocker(sess)
  }

  // Proxy
  if (settings.proxyUrl) {
    await sess.setProxy({ proxyRules: settings.proxyUrl })
  }

  // User agent
  if (settings.userAgent) {
    sess.setUserAgent(settings.userAgent)
  }

  const savedState = getWindowState(key)
  const isDev = !app.isPackaged

  const win = new BrowserWindow({
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height,
    minWidth: 600,
    minHeight: 400,
    title: `${appEntry.name} — ${profile.name}`,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    backgroundColor: '#1a1a2e',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      session: sess,
      preload: path.join(__dirname, '../preload/app-preload.js'),
    },
  })

  win.once('ready-to-show', () => {
    win.show()
  })

  // Open external links in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Save window position on close
  win.on('close', () => {
    if (!win.isDestroyed()) {
      const [width, height] = win.getSize()
      const [x, y] = win.getPosition()
      saveWindowState(key, { x, y, width, height })
    }
    openWindows.delete(key)
  })

  // Apply zoom and settings
  win.webContents.on('did-finish-load', async () => {
    win.webContents.setZoomFactor(settings.zoomLevel)

    // Dark mode via bundled DarkReader
    if (settings.darkMode) {
      try {
        const darkReaderPath = path.join(__dirname, '../../node_modules/darkreader/darkreader.js')
        const darkReaderJs = fs.readFileSync(darkReaderPath, 'utf8')
        
        // Inject the library first
        await win.webContents.executeJavaScript(darkReaderJs)
        
        // Then signal the preload to enable it
        win.webContents.send('dark-mode-init', {
          brightness: 100,
          contrast: 90,
          sepia: 10
        })
      } catch (err) {
        console.error('[window-manager] Failed to apply DarkReader:', err)
      }
    }

    // Custom CSS
    if (settings.customCss) {
      win.webContents.insertCSS(settings.customCss).catch(console.error)
    }

    // Custom JS
    if (settings.customJs) {
      win.webContents.executeJavaScript(settings.customJs).catch(console.error)
    }

    // Badge count from title
    updateBadgeFromTitle(win)
  })

  win.webContents.on('page-title-updated', () => {
    updateBadgeFromTitle(win)
  })

  openWindows.set(key, win)
  await win.loadURL(appEntry.url)
}

function updateBadgeFromTitle(win: BrowserWindow): void {
  const title = win.getTitle()
  const match = title.match(/^\((\d+)\)/)
  if (match) {
    const count = parseInt(match[1], 10)
    app.setBadgeCount(count)
  }
}

export function closeAppWindow(appId: string, profileId: string): void {
  const key = getWindowKey(appId, profileId)
  const win = openWindows.get(key)
  if (win && !win.isDestroyed()) {
    win.close()
  }
}

export function isWindowOpen(appId: string, profileId: string): boolean {
  const key = getWindowKey(appId, profileId)
  const win = openWindows.get(key)
  return !!win && !win.isDestroyed()
}

export function getOpenWindows(): Map<string, BrowserWindow> {
  return openWindows
}
