import { BrowserWindow, session, app, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { getAppSettings, getWindowState, saveWindowState } from './db'
import { App, Profile, WindowState } from '../shared/types'
import { disableAdblocker, setupAdblocker } from './adblocker'
import { persistWindowBounds } from './window-state'
import { assertValidAppUrl, getSafeExternalUrl } from './url-policy'

// track open windows: key = `${appId}::${profileId}`
const openWindows = new Map<string, BrowserWindow>()
const pendingWindows = new Set<string>()
const injectedCssKeys = new Map<string, string>()

interface OpenAppWindowOptions {
  onClosed?: (appId: string) => void
}

function applyPermissionPolicy(sess: Electron.Session, key: string): void {
  sess.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    console.warn(`[window-manager] Denied permission check "${permission}" for ${key} from ${requestingOrigin}`)
    return false
  })

  sess.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    const requestingUrl = details?.requestingUrl ?? 'unknown'
    console.warn(`[window-manager] Denied permission "${permission}" for ${key} from ${requestingUrl}`)
    callback(false)
  })
}

export function getWindowKey(appId: string, profileId: string): string {
  return `${appId}::${profileId}`
}

export function getSessionPartition(appId: string, profileId: string): string {
  return `persist:${appId}-${profileId}`
}

export async function openAppWindow(appEntry: App, profile: Profile, options: OpenAppWindowOptions = {}): Promise<void> {
  const key = getWindowKey(appEntry.id, profile.id)

  // Focus if already open
  const existing = openWindows.get(key)
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore()
    existing.focus()
    return
  }

  // Prevent multiple simultaneous open requests for the same window
  if (pendingWindows.has(key)) return
  pendingWindows.add(key)

  try {
    const settings = getAppSettings(appEntry.id)
    const partition = getSessionPartition(appEntry.id, profile.id)
    const sess = session.fromPartition(partition, { cache: true })
    applyPermissionPolicy(sess, key)

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

    const savedState: WindowState = getWindowState(key)

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
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        session: sess,
        sandbox: true,
        preload: path.join(__dirname, '../preload/app-preload.js'),
      },
    })

    win.once('ready-to-show', () => {
      win.show()
    })

    // Open external links in the default browser
    win.webContents.setWindowOpenHandler(({ url }) => {
      const safeExternalUrl = getSafeExternalUrl(url)
      if (safeExternalUrl) {
        shell.openExternal(safeExternalUrl)
      } else {
        console.warn(`[window-manager] Blocked external URL for ${key}: ${url}`)
      }
      return { action: 'deny' }
    })

    let closeNotified = false
    const handleWindowClosed = () => {
      if (closeNotified) return
      closeNotified = true
      openWindows.delete(key)
      injectedCssKeys.delete(key)
      options.onClosed?.(appEntry.id)
    }

    // Save window position on close
    win.on('close', () => {
      persistWindowBounds(win, saveWindowState, key)
    })

    win.on('closed', handleWindowClosed)

    // Ensure cleanup on crash
    win.webContents.on('render-process-gone', () => {
      console.warn(`[window-manager] Render process gone for ${key}`)
      handleWindowClosed()
      if (!win.isDestroyed()) {
        win.close()
      }
    })

    win.webContents.on('unresponsive', () => {
      console.warn(`[window-manager] Window unresponsive: ${key}`)
    })

    // Apply zoom and settings
    win.webContents.on('did-finish-load', async () => {
      win.webContents.setZoomFactor(settings.zoomLevel)

      if (settings.darkMode) {
        await injectDarkReader(win)
      }

      // Custom CSS
      if (settings.customCss) {
        const cssKey = await win.webContents.insertCSS(settings.customCss)
        injectedCssKeys.set(key, cssKey)
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
    await win.loadURL(assertValidAppUrl(appEntry.url).toString())
  } catch (err) {
    console.error(`[window-manager] Failed to open window for app ${appEntry.id}:`, err)
  } finally {
    pendingWindows.delete(key)
  }
}

function updateBadgeFromTitle(win: BrowserWindow): void {
  const title = win.getTitle()
  const match = title.match(/^\((\d+)\)/)
  if (match) {
    const count = parseInt(match[1], 10)
    app.setBadgeCount(count)
    if (app.dock) app.dock.setBadge(count.toString())
  } else {
    app.setBadgeCount(0)
    if (app.dock) app.dock.setBadge('')
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

/**
 * Re-applies settings to all open windows for a specific app.
 * Used when settings are updated in the main dashboard.
 */
export async function reloadAppSettings(appId: string): Promise<void> {
  const settings = getAppSettings(appId)
  
  for (const [key, win] of openWindows.entries()) {
    if (key.startsWith(`${appId}::`) && !win.isDestroyed()) {
      // 1. Zoom
      win.webContents.setZoomFactor(settings.zoomLevel)

      // 2. Ad blocking
      if (settings.blockAds) {
        await setupAdblocker(win.webContents.session)
      } else {
        disableAdblocker(win.webContents.session)
      }

      // 3. Dark Mode
      if (settings.darkMode) {
        await injectDarkReader(win)
      } else {
        // To disable DarkReader, we'd need a way to tell the preload to stop it.
        // For now, we'll signal the preload to disable it.
        win.webContents.send('dark-mode-disable')
      }

      // 4. Custom CSS
      const cssKey = injectedCssKeys.get(key)
      if (cssKey) {
        await win.webContents.removeInsertedCSS(cssKey).catch(console.error)
        injectedCssKeys.delete(key)
      }

      if (settings.customCss) {
        const nextCssKey = await win.webContents.insertCSS(settings.customCss)
        injectedCssKeys.set(key, nextCssKey)
      }
    }
  }
}

async function injectDarkReader(win: BrowserWindow): Promise<void> {
  try {
    const isDev = !app.isPackaged
    const darkReaderPath = isDev 
      ? path.join(app.getAppPath(), 'node_modules/darkreader/darkreader.js')
      : path.join(process.resourcesPath, 'assets/darkreader.js')
    
    if (fs.existsSync(darkReaderPath)) {
      const darkReaderJs = fs.readFileSync(darkReaderPath, 'utf8')
      await win.webContents.executeJavaScript(darkReaderJs)
      win.webContents.send('dark-mode-init', {
        brightness: 100,
        contrast: 90,
        sepia: 10
      })
    }
  } catch (err) {
    console.error('[window-manager] Failed to inject DarkReader:', err)
  }
}
