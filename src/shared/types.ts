// Shared type definitions between main and renderer

export interface App {
  id: string
  name: string
  url: string
  iconPath: string | null
  spaceId: string | null
  createdAt: number
}

export interface Profile {
  id: string
  appId: string
  name: string
  color: string
  createdAt: number
}

export interface Space {
  id: string
  name: string
  color: string
  icon: string
  sortOrder: number
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

export type WindowState = {
  x?: number
  y?: number
  width: number
  height: number
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
  SEARCH_CATALOG: 'catalog:search',

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
