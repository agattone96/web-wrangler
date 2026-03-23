import { useEffect, useCallback } from 'react'
import { useStore } from './store'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import AppGrid from './components/AppGrid'
import AddAppModal from './components/AddAppModal'
import CatalogBrowser from './components/CatalogBrowser'
import AppSettingsModal from './components/AppSettingsModal'
import GlobalSettingsModal from './components/GlobalSettingsModal'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

export default function App() {
  const {
    setApps, setSpaces, setGlobalSettings,
    showAddApp, showCatalog, showGlobalSettings, settingsTargetAppId,
    markAppOpen, markAppClosed,
  } = useStore()

  // ── Bootstrap: load all data from main process ──────────────
  useEffect(() => {
    console.log('[Renderer] App component mounted');
    async function load() {
      console.log('[Renderer] Starting data bootstrap...');
      try {
        const [apps, spaces, gs] = await Promise.all([
          window.api.listApps(),
          window.api.listSpaces(),
          window.api.getGlobalSettings(),
        ])
        console.log('[Renderer] Data loaded:', { appsCount: apps.length, spacesCount: spaces.length });
        setApps(apps)
        setSpaces(spaces)
        setGlobalSettings(gs)
      } catch (err) {
        console.error('[Renderer] Bootstrap failed:', err);
      }
    }
    load()
  }, [setApps, setSpaces, setGlobalSettings])

  // ── Subscribe to open/close events from main process ─────────
  useEffect(() => {
    const offOpen = window.api.onAppOpened((id: string) => markAppOpen(id))
    const offClose = window.api.onAppClosed((id: string) => markAppClosed(id))
    return () => { offOpen(); offClose() }
  }, [markAppOpen, markAppClosed])

  // ── Global keyboard shortcut: Escape closes top-most modal ───
  const { setShowAddApp, setShowCatalog, setShowGlobalSettings, setSettingsTargetApp } = useStore()
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (settingsTargetAppId) { setSettingsTargetApp(null); return }
      if (showGlobalSettings) { setShowGlobalSettings(false); return }
      if (showCatalog) { setShowCatalog(false); return }
      if (showAddApp) { setShowAddApp(false); return }
    }
  }, [showAddApp, showCatalog, showGlobalSettings, settingsTargetAppId,
      setShowAddApp, setShowCatalog, setShowGlobalSettings, setSettingsTargetApp])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <ErrorBoundary>
      <div className="app-shell scanlines">
        <TitleBar />
        <div className="app-body">
          <Sidebar />
          <main className="app-main">
            <AppGrid />
          </main>
        </div>

        {/* Modals */}
        {showAddApp && <AddAppModal />}
        {showCatalog && <CatalogBrowser />}
        {settingsTargetAppId && <AppSettingsModal appId={settingsTargetAppId} />}
        {showGlobalSettings && <GlobalSettingsModal />}
      </div>
    </ErrorBoundary>
  )
}
