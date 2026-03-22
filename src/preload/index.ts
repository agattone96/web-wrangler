import { contextBridge, ipcRenderer } from 'electron'
import type { App, Profile, Space, AppSettings, CatalogApp, GlobalSettings } from '../shared/types'
const IPC = {
  LIST_APPS: 'apps:list',
  INSTALL_APP: 'apps:install',
  REMOVE_APP: 'apps:remove',
  UPDATE_APP: 'apps:update',
  OPEN_APP: 'apps:open',
  FETCH_ICON: 'apps:fetch-icon',
  LIST_PROFILES: 'profiles:list',
  CREATE_PROFILE: 'profiles:create',
  UPDATE_PROFILE: 'profiles:update',
  DELETE_PROFILE: 'profiles:delete',
  LIST_SPACES: 'spaces:list',
  CREATE_SPACE: 'spaces:create',
  UPDATE_SPACE: 'spaces:update',
  DELETE_SPACE: 'spaces:delete',
  GET_APP_SETTINGS: 'settings:get-app',
  UPDATE_APP_SETTINGS: 'settings:update-app',
  GET_GLOBAL_SETTINGS: 'settings:get-global',
  UPDATE_GLOBAL_SETTINGS: 'settings:update-global',
  LIST_CATALOG: 'catalog:list',
  APP_OPENED: 'events:app-opened',
  APP_CLOSED: 'events:app-closed',
} as const

// Expose safe IPC bridge to renderer
contextBridge.exposeInMainWorld('api', {
  // Apps
  listApps: (): Promise<App[]> => ipcRenderer.invoke(IPC.LIST_APPS),
  installApp: (data: { name: string; url: string; spaceId?: string }): Promise<App> =>
    ipcRenderer.invoke(IPC.INSTALL_APP, data),
  removeApp: (id: string): Promise<void> => ipcRenderer.invoke(IPC.REMOVE_APP, id),
  updateApp: (id: string, data: Partial<Pick<App, 'name' | 'url' | 'iconPath' | 'spaceId'>>): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_APP, id, data),
  openApp: (appId: string, profileId: string): Promise<void> =>
    ipcRenderer.invoke(IPC.OPEN_APP, appId, profileId),
  fetchIcon: (url: string, appId: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.FETCH_ICON, url, appId),

  // Profiles
  listProfiles: (appId: string): Promise<Profile[]> => ipcRenderer.invoke(IPC.LIST_PROFILES, appId),
  createProfile: (data: { appId: string; name: string; color: string }): Promise<Profile> =>
    ipcRenderer.invoke(IPC.CREATE_PROFILE, data),
  updateProfile: (id: string, data: Partial<Pick<Profile, 'name' | 'color'>>): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_PROFILE, id, data),
  deleteProfile: (id: string): Promise<void> => ipcRenderer.invoke(IPC.DELETE_PROFILE, id),

  // Spaces
  listSpaces: (): Promise<Space[]> => ipcRenderer.invoke(IPC.LIST_SPACES),
  createSpace: (data: { name: string; color: string; icon: string }): Promise<Space> =>
    ipcRenderer.invoke(IPC.CREATE_SPACE, data),
  updateSpace: (id: string, data: Partial<Omit<Space, 'id'>>): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_SPACE, id, data),
  deleteSpace: (id: string): Promise<void> => ipcRenderer.invoke(IPC.DELETE_SPACE, id),

  // App Settings
  getAppSettings: (appId: string): Promise<AppSettings> => ipcRenderer.invoke(IPC.GET_APP_SETTINGS, appId),
  updateAppSettings: (appId: string, data: Partial<Omit<AppSettings, 'appId'>>): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_APP_SETTINGS, appId, data),

  // Global Settings
  getGlobalSettings: (): Promise<GlobalSettings> => ipcRenderer.invoke(IPC.GET_GLOBAL_SETTINGS),
  updateGlobalSettings: (data: Partial<GlobalSettings>): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_GLOBAL_SETTINGS, data),

  // Catalog
  listCatalog: (search?: string, category?: string): Promise<CatalogApp[]> =>
    ipcRenderer.invoke(IPC.LIST_CATALOG, search, category),

  // Events (main → renderer)
  onAppOpened: (cb: (appId: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, appId: string) => cb(appId)
    ipcRenderer.on(IPC.APP_OPENED, handler)
    return () => ipcRenderer.off(IPC.APP_OPENED, handler)
  },
  onAppClosed: (cb: (appId: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, appId: string) => cb(appId)
    ipcRenderer.on(IPC.APP_CLOSED, handler)
    return () => ipcRenderer.off(IPC.APP_CLOSED, handler)
  },
})
