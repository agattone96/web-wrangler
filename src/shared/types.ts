// Shared type definitions between main and renderer

export interface App {
  id: string
  name: string
  url: string
  iconPath: string | null
  spaceId: string | null
  createdAt: number
}

export interface InstallAppInput {
  name: string
  url: string
  spaceId?: string
}

export interface Profile {
  id: string
  appId: string
  name: string
  color: string
  createdAt: number
}

export interface CreateProfileInput {
  appId: string
  name: string
  color: string
}

export interface Space {
  id: string
  name: string
  color: string
  icon: string
  sortOrder: number
}

export interface CreateSpaceInput {
  name: string
  color: string
  icon: string
}

export interface AppSettings {
  appId: string
  zoomLevel: number
  darkMode: boolean
  blockAds: boolean
  customCss: string
  customJs: string
  userAgent: string
  openAtLogin: boolean
  notifications: boolean
  proxyUrl: string
}

export interface CatalogApp {
  id: string
  name: string
  url: string
  iconUrl: string
  category: string
  description: string
}

export interface CatalogQuery {
  search?: string
  category?: string
}

export type WindowState = {
  x?: number
  y?: number
  width: number
  height: number
}

export interface PreloadApi {
  listApps: () => Promise<App[]>
  installApp: (data: InstallAppInput) => Promise<App>
  removeApp: (id: string) => Promise<void>
  updateApp: (id: string, data: Partial<Pick<App, 'name' | 'url' | 'iconPath' | 'spaceId'>>) => Promise<void>
  openApp: (appId: string, profileId: string) => Promise<void>
  fetchIcon: (url: string, appId: string) => Promise<string | null>
  listProfiles: (appId: string) => Promise<Profile[]>
  createProfile: (data: CreateProfileInput) => Promise<Profile>
  updateProfile: (id: string, data: Partial<Pick<Profile, 'name' | 'color'>>) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  listSpaces: () => Promise<Space[]>
  createSpace: (data: CreateSpaceInput) => Promise<Space>
  updateSpace: (id: string, data: Partial<Omit<Space, 'id'>>) => Promise<void>
  deleteSpace: (id: string) => Promise<void>
  getAppSettings: (appId: string) => Promise<AppSettings>
  updateAppSettings: (appId: string, data: Partial<Omit<AppSettings, 'appId'>>) => Promise<AppSettingsUpdateResult>
  getGlobalSettings: () => Promise<GlobalSettings>
  updateGlobalSettings: (data: Partial<GlobalSettings>) => Promise<void>
  listCatalog: (query?: CatalogQuery) => Promise<CatalogApp[]>
  onAppOpened: (cb: (appId: string) => void) => () => void
  onAppClosed: (cb: (appId: string) => void) => () => void
}

// IPC channel names
export const IPC = {
  // Apps
  LIST_APPS: 'apps:list',
  INSTALL_APP: 'apps:install',
  REMOVE_APP: 'apps:remove',
  UPDATE_APP: 'apps:update',
  OPEN_APP: 'apps:open',
  FETCH_ICON: 'apps:fetch-icon',

  // Profiles
  LIST_PROFILES: 'profiles:list',
  CREATE_PROFILE: 'profiles:create',
  UPDATE_PROFILE: 'profiles:update',
  DELETE_PROFILE: 'profiles:delete',

  // Spaces
  LIST_SPACES: 'spaces:list',
  CREATE_SPACE: 'spaces:create',
  UPDATE_SPACE: 'spaces:update',
  DELETE_SPACE: 'spaces:delete',

  // Settings
  GET_APP_SETTINGS: 'settings:get-app',
  UPDATE_APP_SETTINGS: 'settings:update-app',
  GET_GLOBAL_SETTINGS: 'settings:get-global',
  UPDATE_GLOBAL_SETTINGS: 'settings:update-global',

  // Catalog
  LIST_CATALOG: 'catalog:list',

  // Events (main → renderer)
  APP_OPENED: 'event:app-opened',
  APP_CLOSED: 'event:app-closed',
} as const

export interface GlobalSettings {
  blockAdsGlobal: boolean
  darkModeGlobal: boolean
  enableAppLock: boolean
  lockPin: string
  lockTimeout: number // minutes; 0 = immediate
  runInBackground: boolean
  showInMenuBar: boolean
  theme: 'system' | 'light' | 'dark'
}

export interface AppSettingsUpdateResult {
  appliedLive: boolean
  reopenRequiredFields: Array<keyof Omit<AppSettings, 'appId'>>
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  blockAdsGlobal: true,
  darkModeGlobal: false,
  enableAppLock: false,
  lockPin: '',
  lockTimeout: 5,
  runInBackground: true,
  showInMenuBar: true,
  theme: 'system',
}
