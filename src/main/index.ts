import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, protocol, net, session } from 'electron'
import path from 'path'
import fs from 'fs'
import { v4 as uuid } from 'uuid'
import {
  initDb, listApps, getApp, insertApp, updateApp, deleteApp,
  listProfiles, insertProfile, updateProfile, deleteProfile,
  listSpaces, insertSpace, updateSpace, deleteSpace,
  getAppSettings, updateAppSettings,
  getGlobalSettings, updateGlobalSettings,
  listCatalog, getWindowState, saveWindowState,
} from './db'
import { openAppWindow, reloadAppSettings } from './window-manager'
import { fetchFavicon } from './app-icon-fetcher'
import { IPC } from '../shared/types'
import type { App, Profile, Space, InstallAppInput, CreateProfileInput, CreateSpaceInput, CatalogQuery } from '../shared/types'

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
  const savedState = getWindowState('main')

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
      const [width, height] = mainWindow!.getSize()
      const [x, y] = mainWindow!.getPosition()
      saveWindowState('main', { x, y, width, height })
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

function registerIpcHandlers(): void {
  // Apps
  ipcMain.handle(IPC.LIST_APPS, () => listApps())

  ipcMain.handle(IPC.INSTALL_APP, async (_e, data: InstallAppInput) => {
    const id = uuid()
    const appEntry: App = {
      id,
      name: data.name,
      url: data.url,
      iconPath: null,
      spaceId: data.spaceId ?? 'default',
      createdAt: Date.now(),
    }
    insertApp(appEntry)

    // Auto-fetch favicon in background
    fetchFavicon(data.url, id).then((iconPath) => {
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

  ipcMain.handle(IPC.REMOVE_APP, (_e, id: string) => deleteApp(id))

  ipcMain.handle(IPC.UPDATE_APP, (_e, id: string, data: Parameters<typeof updateApp>[1]) =>
    updateApp(id, data))

  ipcMain.handle(IPC.OPEN_APP, async (_e, appId: string, profileId: string) => {
    const appEntry = getApp(appId)
    const profiles = listProfiles(appId)
    const profile = profiles.find(p => p.id === profileId) ?? profiles[0]
    if (!appEntry || !profile) throw new Error('App or profile not found')
    await openAppWindow(appEntry, profile)
    mainWindow?.webContents.send(IPC.APP_OPENED, appId)
  })

  ipcMain.handle(IPC.FETCH_ICON, async (_e, url: string, appId: string) =>
    fetchFavicon(url, appId))

  // Profiles
  ipcMain.handle(IPC.LIST_PROFILES, (_e, appId: string) => listProfiles(appId))

  ipcMain.handle(IPC.CREATE_PROFILE, (_e, data: CreateProfileInput) => {
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

  ipcMain.handle(IPC.UPDATE_PROFILE, (_e, id: string, data: Parameters<typeof updateProfile>[1]) =>
    updateProfile(id, data))

  ipcMain.handle(IPC.DELETE_PROFILE, (_e, id: string) => deleteProfile(id))

  // Spaces
  ipcMain.handle(IPC.LIST_SPACES, () => listSpaces())

  ipcMain.handle(IPC.CREATE_SPACE, (_e, data: CreateSpaceInput) => {
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

  ipcMain.handle(IPC.UPDATE_SPACE, (_e, id: string, data: Parameters<typeof updateSpace>[1]) =>
    updateSpace(id, data))

  ipcMain.handle(IPC.DELETE_SPACE, (_e, id: string) => deleteSpace(id))

  // App Settings
  ipcMain.handle(IPC.GET_APP_SETTINGS, (_e, appId: string) => getAppSettings(appId))

  ipcMain.handle(IPC.UPDATE_APP_SETTINGS, async (_e, appId: string, data: Parameters<typeof updateAppSettings>[1]) => {
    updateAppSettings(appId, data)
    await reloadAppSettings(appId)
  })

  // Global Settings
  ipcMain.handle(IPC.GET_GLOBAL_SETTINGS, () => getGlobalSettings())

  ipcMain.handle(IPC.UPDATE_GLOBAL_SETTINGS, (_e, data: Parameters<typeof updateGlobalSettings>[0]) =>
    updateGlobalSettings(data))

  // Catalog
  ipcMain.handle(IPC.LIST_CATALOG, (_e, query?: CatalogQuery) =>
    listCatalog(query?.search, query?.category))
}

// ─── App Lifecycle ──────────────────────────────────────────────────────────

function setupCsp(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data: app:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
          "connect-src 'self' https: wss:; " +
          "img-src 'self' data: https: file:; " +
          "style-src 'self' 'unsafe-inline' https:; " +
          "font-src 'self' https: data:;"
        ]
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

  const settings = getGlobalSettings()
  if (settings.showInMenuBar) createTray()
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
    const [width, height] = mainWindow.getSize()
    const [x, y] = mainWindow.getPosition()
    saveWindowState('main', { x, y, width, height })
  }
})
