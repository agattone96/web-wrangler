import Store from 'electron-store'

interface AppSession {
  appId: string
  profileId: string
}

export interface Schema {
  lastOpenedApps: AppSession[]
  windowBounds: {
    width: number
    height: number
    x: number | undefined
    y: number | undefined
  }
}

const store = new Store<Schema>({
  defaults: {
    lastOpenedApps: [],
    windowBounds: {
      width: 1024,
      height: 768,
      x: undefined,
      y: undefined,
    },
  },
})

export default store
