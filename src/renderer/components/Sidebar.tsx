import { useState } from 'react'
import { useStore } from '../store'
import SpaceManager from './SpaceManager'
import './Sidebar.css'

const ALL_APPS_ID = null

export default function Sidebar() {
  const { spaces, apps, activeSpaceId, setActiveSpace, setShowAddApp, setShowCatalog, setShowGlobalSettings } = useStore()
  const [showSpaceManager, setShowSpaceManager] = useState(false)

  const appCountForSpace = (spaceId: string | null) =>
    spaceId === null ? apps.length : apps.filter((a) => a.spaceId === spaceId).length

  return (
    <>
      <aside className="sidebar">
        {/* Title bar drag region */}
        {/* Logo and title removed — now in unified TitleBar */}
        <div style={{ height: 12 }} />

        <div className="neon-line" style={{ margin: '0 16px' }} />

        {/* Add App button */}
        <div className="sidebar-actions">
          <button className="btn btn-primary w-full" onClick={() => setShowAddApp(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add App
          </button>
          <button className="btn btn-ghost w-full" onClick={() => setShowCatalog(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Catalog
          </button>
        </div>

        {/* Spaces Nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Spaces</span>

          <button
            className={`sidebar-nav-item ${activeSpaceId === ALL_APPS_ID ? 'active' : ''}`}
            onClick={() => setActiveSpace(null)}
          >
            <span className="nav-icon">🌐</span>
            <span className="nav-label">All Apps</span>
            <span className="nav-count">{appCountForSpace(null)}</span>
          </button>

          {spaces.map((space) => (
            <button
              key={space.id}
              className={`sidebar-nav-item ${activeSpaceId === space.id ? 'active' : ''}`}
              onClick={() => setActiveSpace(space.id)}
              style={activeSpaceId === space.id ? { '--space-color': space.color } as React.CSSProperties : undefined}
            >
              <span className="nav-icon">{space.icon}</span>
              <span className="nav-label truncate">{space.name}</span>
              <span className="nav-count">{appCountForSpace(space.id)}</span>
            </button>
          ))}

          <button className="sidebar-nav-item sidebar-manage-spaces" onClick={() => setShowSpaceManager(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            <span className="nav-label">Manage Spaces</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="btn-icon" onClick={() => setShowGlobalSettings(true)} title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          </button>
          <span className="sidebar-version text-dim">v1.0.0</span>
        </div>
      </aside>

      {showSpaceManager && <SpaceManager onClose={() => setShowSpaceManager(false)} />}
    </>
  )
}
