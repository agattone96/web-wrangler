import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type {
  App,
  Profile,
  Space,
  AppSettings,
  AppSettingsUpdateResult,
  CatalogApp,
  GlobalSettings,
  PreloadApi,
  InstallAppInput,
  CreateProfileInput,
  CreateSpaceInput,
  CatalogQuery
} from '../shared/types'

// Expose safe IPC bridge to renderer
const api: PreloadApi = {
  // Apps
  listApps: (): Promise<App[]> => ipcRenderer.invoke(IPC.LIST_APPS),
  installApp: (data: InstallAppInput): Promise<App> =>
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
  createProfile: (data: CreateProfileInput): Promise<Profile> =>
    ipcRenderer.invoke(IPC.CREATE_PROFILE, data),
  updateProfile: (id: string, data: Partial<Pick<Profile, 'name' | 'color'>>): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_PROFILE, id, data),
  deleteProfile: (id: string): Promise<void> => ipcRenderer.invoke(IPC.DELETE_PROFILE, id),

  // Spaces
  listSpaces: (): Promise<Space[]> => ipcRenderer.invoke(IPC.LIST_SPACES),
  createSpace: (data: CreateSpaceInput): Promise<Space> =>
    ipcRenderer.invoke(IPC.CREATE_SPACE, data),
  updateSpace: (id: string, data: Partial<Omit<Space, 'id'>>): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_SPACE, id, data),
  deleteSpace: (id: string): Promise<void> => ipcRenderer.invoke(IPC.DELETE_SPACE, id),

  // App Settings
  getAppSettings: (appId: string): Promise<AppSettings> => ipcRenderer.invoke(IPC.GET_APP_SETTINGS, appId),
  updateAppSettings: (appId: string, data: Partial<Omit<AppSettings, 'appId'>>): Promise<AppSettingsUpdateResult> =>
    ipcRenderer.invoke(IPC.UPDATE_APP_SETTINGS, appId, data),

  // Global Settings
  getGlobalSettings: (): Promise<GlobalSettings> => ipcRenderer.invoke(IPC.GET_GLOBAL_SETTINGS),
  updateGlobalSettings: (data: Partial<GlobalSettings>): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_GLOBAL_SETTINGS, data),

  // Catalog
  listCatalog: (query?: CatalogQuery): Promise<CatalogApp[]> =>
    ipcRenderer.invoke(IPC.LIST_CATALOG, query),

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
}

contextBridge.exposeInMainWorld('api', api)
