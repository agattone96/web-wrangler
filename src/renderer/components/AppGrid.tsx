import { useState, useMemo } from 'react'
import { useStore } from '../store'
import AppCard from './AppCard'
import ProfileSwitcher from './ProfileSwitcher'
import './AppGrid.css'

export default function AppGrid() {
  const {
    apps, spaces, activeSpaceId,
    setShowAddApp, setShowCatalog, setSettingsTargetApp,
    searchQuery, setSearchQuery,
    selectedAppId, setSelectedApp,
  } = useStore()

  const [profileSwitcherAppId, setProfileSwitcherAppId] = useState<string | null>(null)

  const activeSpaceName = useMemo(() => {
    if (!activeSpaceId) return 'All Apps'
    return spaces.find((s) => s.id === activeSpaceId)?.name ?? 'Apps'
  }, [activeSpaceId, spaces])

  const filtered = useMemo(() => {
    let result = activeSpaceId
      ? apps.filter((a) => a.spaceId === activeSpaceId)
      : apps
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || a.url.toLowerCase().includes(q)
      )
    }
    return result
  }, [apps, activeSpaceId, searchQuery])

  return (
    <div className="app-grid-container">
      {/* Topbar */}
      {/* Topbar removed - now in unified TitleBar */}
      <div className="app-grid-top-spacer" style={{ height: 16 }} />

      <div className="neon-line" />

      {/* Grid */}
      <div className="app-grid-scroll">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="icon">{searchQuery ? '🔍' : '✦'}</span>
            <h3>{searchQuery ? 'No results found' : 'No apps yet'}</h3>
            <p>
              {searchQuery
                ? 'Try a different search term.'
                : 'Add your first web app and wrangle the web.'}
            </p>
            {!searchQuery && (
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowAddApp(true)}>
                Add App
              </button>
            )}
          </div>
        ) : (
          <div className="app-grid">
            {filtered.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                isSelected={selectedAppId === app.id}
                onSelect={() => setSelectedApp(app.id === selectedAppId ? null : app.id)}
                onOpenProfiles={() => setProfileSwitcherAppId(app.id)}
                onOpenSettings={() => setSettingsTargetApp(app.id)}
              />
            ))}
          </div>
        )}
      </div>

      {profileSwitcherAppId && (
        <ProfileSwitcher
          appId={profileSwitcherAppId}
          onClose={() => setProfileSwitcherAppId(null)}
        />
      )}
    </div>
  )
}
