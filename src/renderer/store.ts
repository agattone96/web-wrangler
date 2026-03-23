import { create } from 'zustand'
import type { App, Profile, Space, GlobalSettings } from '@shared/types'

interface AppStore {
  // Data
  apps: App[]
  profiles: Record<string, Profile[]>   // keyed by appId
  spaces: Space[]
  globalSettings: GlobalSettings | null

  // UI State
  activeSpaceId: string | null          // null = All Apps
  selectedAppId: string | null
  openAppIds: Set<string>               // apps currently open in windows

  // Modals
  showAddApp: boolean
  showCatalog: boolean
  showGlobalSettings: boolean
  settingsTargetAppId: string | null    // app whose settings are open

  // Search
  searchQuery: string

  // Actions — Data
  setApps: (apps: App[]) => void
  addApp: (app: App) => void
  removeApp: (id: string) => void
  updateLocalApp: (id: string, data: Partial<App>) => void

  setProfilesForApp: (appId: string, profiles: Profile[]) => void
  addProfile: (profile: Profile) => void
  removeProfile: (id: string, appId: string) => void

  setSpaces: (spaces: Space[]) => void
  addSpace: (space: Space) => void
  removeSpace: (id: string) => void

  setGlobalSettings: (s: GlobalSettings) => void

  // Actions — UI
  setActiveSpace: (id: string | null) => void
  setSelectedApp: (id: string | null) => void
  markAppOpen: (id: string) => void
  markAppClosed: (id: string) => void

  setShowAddApp: (v: boolean) => void
  setShowCatalog: (v: boolean) => void
  setShowGlobalSettings: (v: boolean) => void
  setSettingsTargetApp: (id: string | null) => void

  setSearchQuery: (q: string) => void
}

export const useStore = create<AppStore>((set) => ({
  apps: [],
  profiles: {},
  spaces: [],
  globalSettings: null,

  activeSpaceId: null,
  selectedAppId: null,
  openAppIds: new Set(),

  showAddApp: false,
  showCatalog: false,
  showGlobalSettings: false,
  settingsTargetAppId: null,
  searchQuery: '',

  setApps: (apps) => set({ apps }),
  addApp: (app) => set((s) => ({ apps: [...s.apps, app] })),
  removeApp: (id) => set((s) => ({ apps: s.apps.filter((a) => a.id !== id) })),
  updateLocalApp: (id, data) =>
    set((s) => ({ apps: s.apps.map((a) => (a.id === id ? { ...a, ...data } : a)) })),

  setProfilesForApp: (appId, profiles) =>
    set((s) => ({ profiles: { ...s.profiles, [appId]: profiles } })),
  addProfile: (profile) =>
    set((s) => ({
      profiles: {
        ...s.profiles,
        [profile.appId]: [...(s.profiles[profile.appId] ?? []), profile],
      },
    })),
  removeProfile: (id, appId) =>
    set((s) => ({
      profiles: {
        ...s.profiles,
        [appId]: (s.profiles[appId] ?? []).filter((p) => p.id !== id),
      },
    })),

  setSpaces: (spaces) => set({ spaces }),
  addSpace: (space) => set((s) => ({ spaces: [...s.spaces, space] })),
  removeSpace: (id) => set((s) => ({ spaces: s.spaces.filter((sp) => sp.id !== id) })),

  setGlobalSettings: (globalSettings) => set({ globalSettings }),

  setActiveSpace: (id) => set({ activeSpaceId: id }),
  setSelectedApp: (id) => set({ selectedAppId: id }),
  markAppOpen: (id) =>
    set((s) => { const next = new Set(s.openAppIds); next.add(id); return { openAppIds: next } }),
  markAppClosed: (id) =>
    set((s) => { const next = new Set(s.openAppIds); next.delete(id); return { openAppIds: next } }),

  setShowAddApp: (v) => set({ showAddApp: v }),
  setShowCatalog: (v) => set({ showCatalog: v }),
  setShowGlobalSettings: (v) => set({ showGlobalSettings: v }),
  setSettingsTargetApp: (id) => set({ settingsTargetAppId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
