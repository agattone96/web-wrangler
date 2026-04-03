import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, protocol, net, session, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { v4 as uuid } from 'uuid'
import {
  initDb, listApps, getApp, insertApp, updateApp, deleteApp,
  listProfiles, insertProfile, updateProfile, deleteProfile,
  listSpaces, insertSpace, updateSpace, deleteSpace,
  getAppSettings, updateAppSettings,
  getGlobalSettings, updateGlobalSettings,
  listCatalog, saveWindowState, getWindowState,
} from './db'
import { openAppWindow, reloadAppSettings, getOpenWindows } from './window-manager'
import { fetchFavicon } from './app-icon-fetcher'
import { IPC } from '../shared/types'
import type { App, Profile, Space, InstallAppInput, CreateProfileInput, CreateSpaceInput, CatalogQuery } from '../shared/types'
import storeRaw from './store'
import { getMainWindowState, persistWindowBounds } from './window-state'
import { getAppSettingsUpdateResult } from './app-settings-runtime'
import { shouldCreateTray, shouldDestroyTray } from './tray-state'
import { assertValidAppUrl, getSafeExternalUrl, isAllowedRendererUrl } from './url-policy'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store: any = storeRaw

const isDev = !app.isPackaged

app.name = 'WebWrangler'
app.setName('WebWrangler')

if (process.platform === 'win32') {
  app.setAppUserModelId('io.personal.web-wrangler')
}

// ─── Error Handling ────────────────────────────────────────────────────────
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled Rejection:', reason)
})

// ─── Single Instance Lock ──────────────────────────────────────────────────
if (!app.requestSingleInstanceLock()) {
  console.log('[Main] Another instance is already running. Exiting.')
  app.quit()
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Register app:// protocol for serving local files safely in production
if (!isDev) {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } },
  ])
}

function registerProtocol(): void {
  if (isDev) return
  protocol.handle('app', (request) => {
    const url = request.url.replace('app://', '')
    const filePath = path.join(app.getAppPath(), 'dist/renderer', url || 'index.html')
    return net.fetch(`file://${filePath}`)
  })
}

// ─── Main Window ──────────────────────────────────────────────────────────

function createMainWindow(): void {
  const savedState = getMainWindowState(getWindowState)

  mainWindow = new BrowserWindow({
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height,
    minWidth: 900,
    minHeight: 600,
    title: 'WebWrangler',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#0f0f1a',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  })

  // Set App Name & Dock Icon for Mac
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, isDev ? '../../../assets/icon.png' : '../assets/icon.png')
    if (fs.existsSync(iconPath)) {
      const image = nativeImage.createFromPath(iconPath)
      app.dock.setIcon(image)
    }
  }

  const getRendererPath = () => {
    return path.join(app.getAppPath(), 'dist/renderer/index.html')
  }

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173').catch(() => {
      console.warn('[Main] Dev server not reachable. Falling back to local build.')
      mainWindow!.loadFile(getRendererPath())
    })
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(getRendererPath())
  }

  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Window ready to show')
    mainWindow!.show()
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedRendererUrl(url, isDev)) {
      event.preventDefault()
      console.warn(`[Main] Blocked renderer navigation to: ${url}`)
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const safeExternalUrl = getSafeExternalUrl(url)
    if (safeExternalUrl) {
      shell.openExternal(safeExternalUrl)
    } else {
      console.warn(`[Main] Blocked external renderer URL: ${url}`)
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-fail-load', (e, errorCode, errorDescription) => {
    console.error('[Main] Failed to load renderer:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('dom-ready', () => {
    console.log('[Main] DOM Ready')
  })

  mainWindow.on('close', (e) => {
    const settings = getGlobalSettings()
    if (settings.runInBackground) {
      e.preventDefault()
      mainWindow!.hide()
    } else {
      persistWindowBounds(mainWindow!, saveWindowState, 'main')
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ─── Tray ─────────────────────────────────────────────────────────────────

function createTray(): void {
  const iconPath = path.join(
    isDev ? path.join(__dirname, '../../../assets') : process.resourcesPath,
    'tray-icon.png'
  )

  let icon = nativeImage.createEmpty()
  if (fs.existsSync(iconPath)) {
    // 20x20 is a good "large" size for Mac tray
    icon = nativeImage.createFromPath(iconPath).resize({ width: 20, height: 20 })
    icon.setTemplateImage(true)
  }

  tray = new Tray(icon)
  tray.setToolTip('WebWrangler')
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Open WebWrangler',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
        } else {
          createMainWindow()
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit() } },
  ]))
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
      }
    } else {
      createMainWindow()
    }
  })
}

function reconcileTray(showInMenuBar: boolean): void {
  if (shouldCreateTray(showInMenuBar, !!tray)) {
    createTray()
    return
  }

  if (shouldDestroyTray(showInMenuBar, !!tray)) {
    tray?.destroy()
    tray = null
  }
}

function notifyAppClosed(appId: string): void {
  mainWindow?.webContents.send(IPC.APP_CLOSED, appId)
}

// ─── Menu ─────────────────────────────────────────────────────────────────

function createMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: 'WebWrangler',
      submenu: [
        { role: 'about' } as const,
        { type: 'separator' } as const,
        { role: 'services' } as const,
        { type: 'separator' } as const,
        { role: 'hide' } as const,
        { role: 'hideOthers' } as const,
        { role: 'unhide' } as const,
        { type: 'separator' } as const,
        { role: 'quit' } as const
      ]
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' },
        { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'close' }]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ─── IPC Handlers ──────────────────────────────────────────────────────────

function validateSender(event: Electron.IpcMainInvokeEvent): boolean {
  const { senderFrame } = event
  if (!senderFrame) return false

  const url = senderFrame.url
  if (isDev) {
    return url.startsWith('http://127.0.0.1:5173') || url.startsWith('app://')
  }
  return url.startsWith('app://')
}

function registerIpcHandlers(): void {
  // Apps
  ipcMain.handle(IPC.LIST_APPS, (e) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return listApps()
  })

  ipcMain.handle(IPC.INSTALL_APP, async (e, data: InstallAppInput) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    const validatedUrl = assertValidAppUrl(data.url)
    const id = uuid()
    const appEntry: App = {
      id,
      name: data.name,
      url: validatedUrl.toString(),
      iconPath: null,
      spaceId: data.spaceId ?? 'default',
      createdAt: Date.now(),
    }
    insertApp(appEntry)
    const globalSettings = getGlobalSettings()
    updateAppSettings(id, {
      blockAds: globalSettings.blockAdsGlobal,
      darkMode: globalSettings.darkModeGlobal,
    })

    // Auto-fetch favicon in background
    fetchFavicon(validatedUrl.toString(), id).then((iconPath) => {
      if (iconPath) updateApp(id, { iconPath })
    })

    // Auto-create default profile
    const defaultProfile: Profile = {
      id: uuid(),
      appId: id,
      name: 'Default',
      color: '#6366f1',
      createdAt: Date.now(),
    }
    insertProfile(defaultProfile)

    return appEntry
  })

  ipcMain.handle(IPC.REMOVE_APP, (e, id: string) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return deleteApp(id)
  })

  ipcMain.handle(IPC.UPDATE_APP, (e, id: string, data: Parameters<typeof updateApp>[1]) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    if (data.url !== undefined) {
      data = { ...data, url: assertValidAppUrl(data.url).toString() }
    }
    return updateApp(id, data)
  })

  ipcMain.handle(IPC.OPEN_APP, async (e, appId: string, profileId: string) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    const appEntry = getApp(appId)
    const profiles = listProfiles(appId)
    const profile = profiles.find(p => p.id === profileId) ?? profiles[0]
    if (!appEntry || !profile) throw new Error('App or profile not found')
    await openAppWindow(appEntry, profile, { onClosed: notifyAppClosed })
    mainWindow?.webContents.send(IPC.APP_OPENED, appId)
  })

  ipcMain.handle(IPC.FETCH_ICON, async (e, url: string, appId: string) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return fetchFavicon(assertValidAppUrl(url).toString(), appId)
  })

  // Profiles
  ipcMain.handle(IPC.LIST_PROFILES, (e, appId: string) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return listProfiles(appId)
  })

  ipcMain.handle(IPC.CREATE_PROFILE, (e, data: CreateProfileInput) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    const profile: Profile = {
      id: uuid(),
      appId: data.appId,
      name: data.name,
      color: data.color,
      createdAt: Date.now(),
    }
    insertProfile(profile)
    return profile
  })

  ipcMain.handle(IPC.UPDATE_PROFILE, (e, id: string, data: Parameters<typeof updateProfile>[1]) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return updateProfile(id, data)
  })

  ipcMain.handle(IPC.DELETE_PROFILE, (e, id: string) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return deleteProfile(id)
  })

  // Spaces
  ipcMain.handle(IPC.LIST_SPACES, (e) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return listSpaces()
  })

  ipcMain.handle(IPC.CREATE_SPACE, (e, data: CreateSpaceInput) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    const spaces = listSpaces()
    const space: Space = {
      id: uuid(),
      name: data.name,
      color: data.color,
      icon: data.icon,
      sortOrder: spaces.length,
    }
    insertSpace(space)
    return space
  })

  ipcMain.handle(IPC.UPDATE_SPACE, (e, id: string, data: Parameters<typeof updateSpace>[1]) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return updateSpace(id, data)
  })

  ipcMain.handle(IPC.DELETE_SPACE, (e, id: string) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return deleteSpace(id)
  })

  // App Settings
  ipcMain.handle(IPC.GET_APP_SETTINGS, (e, appId: string) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return getAppSettings(appId)
  })

  ipcMain.handle(IPC.UPDATE_APP_SETTINGS, async (e, appId: string, data: Parameters<typeof updateAppSettings>[1]) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    const result = getAppSettingsUpdateResult(data)
    updateAppSettings(appId, data)
    if (result.appliedLive) {
      await reloadAppSettings(appId)
    }
    return result
  })

  // Global Settings
  ipcMain.handle(IPC.GET_GLOBAL_SETTINGS, (e) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return getGlobalSettings()
  })

  ipcMain.handle(IPC.UPDATE_GLOBAL_SETTINGS, (e, data: Parameters<typeof updateGlobalSettings>[0]) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    updateGlobalSettings(data)
    const nextSettings = getGlobalSettings()
    reconcileTray(nextSettings.showInMenuBar)
    return nextSettings
  })

  // Catalog
  ipcMain.handle(IPC.LIST_CATALOG, (e, query?: CatalogQuery) => {
    if (!validateSender(e)) throw new Error('Unauthorized IPC call')
    return listCatalog(query?.search, query?.category)
  })
}

// ─── App Lifecycle ──────────────────────────────────────────────────────────

function setupCsp(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isRendererResponse =
      details.url.startsWith('http://127.0.0.1:5173') ||
      details.url.startsWith('app://')

    if (!isRendererResponse) {
      callback({ responseHeaders: details.responseHeaders })
      return
    }

    const rendererCsp = isDev
      ? [
          "default-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:5173",
          "connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173",
          "img-src 'self' data: app: https: file:",
          "style-src 'self' 'unsafe-inline' http://127.0.0.1:5173 https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "object-src 'none'",
          "base-uri 'none'",
          "frame-ancestors 'none'",
        ].join('; ')
      : [
          "default-src 'self' app:",
          "script-src 'self'",
          "connect-src 'self'",
          "img-src 'self' data: app: https: file:",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "object-src 'none'",
          "base-uri 'none'",
          "frame-ancestors 'none'",
        ].join('; ')

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [rendererCsp]
      }
    })
  })
}

app.whenReady().then(() => {
  initDb()
  registerIpcHandlers()
  registerProtocol()
  setupCsp()
  createMenu()
  createMainWindow()

  // Restore session
  const lastOpenedApps = store.get('lastOpenedApps') || []
  for (const sessionInfo of lastOpenedApps) {
    const appEntry = getApp(sessionInfo.appId)
    const profiles = listProfiles(sessionInfo.appId)
    const profile = profiles.find(p => p.id === sessionInfo.profileId) ?? profiles[0]
    if (appEntry && profile) {
      openAppWindow(appEntry, profile, { onClosed: notifyAppClosed }).catch(console.error)
    }
  }

  const settings = getGlobalSettings()
  reconcileTray(settings.showInMenuBar)
})

app.on('window-all-closed', () => {
  const settings = getGlobalSettings()
  if (!settings.runInBackground || process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
  } else {
    createMainWindow()
  }
})

app.on('before-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    persistWindowBounds(mainWindow, saveWindowState, 'main')
  }

  // Save last opened apps
  const openWindowsMap = getOpenWindows()
  const appsToSave: { appId: string; profileId: string }[] = []
  
  for (const key of openWindowsMap.keys()) {
    const [appId, profileId] = key.split('::')
    appsToSave.push({ appId, profileId })
  }
  store.set('lastOpenedApps', appsToSave)
})
