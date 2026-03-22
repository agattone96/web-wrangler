import { useState, useEffect } from 'react'
import { useStore } from '../store'
import type { App } from '@shared/types'
import './AppCard.css'

interface Props {
  app: App
  isSelected: boolean
  onSelect: () => void
  onOpenProfiles: () => void
  onOpenSettings: () => void
}

export default function AppCard({ app, isSelected, onSelect, onOpenProfiles, onOpenSettings }: Props) {
  const { openAppIds, removeApp, profiles, setProfilesForApp } = useStore()
  const isOpen = openAppIds.has(app.id)
  const [imgError, setImgError] = useState(false)
  const [launching, setLaunching] = useState(false)

  // Load profiles for this app lazily
  useEffect(() => {
    if (!profiles[app.id]) {
      window.api.listProfiles(app.id).then((p) => setProfilesForApp(app.id, p))
    }
  }, [app.id, profiles, setProfilesForApp])

  const defaultProfileId = profiles[app.id]?.[0]?.id

  async function handleLaunch(e: React.MouseEvent) {
    e.stopPropagation()
    if (!defaultProfileId) return
    setLaunching(true)
    try {
      await window.api.openApp(app.id, defaultProfileId)
    } finally {
      setLaunching(false)
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Remove "${app.name}"?`)) return
    await window.api.removeApp(app.id)
    removeApp(app.id)
  }

  function getDomain() {
    try { return new URL(app.url).hostname.replace('www.', '') } catch { return app.url }
  }

  const iconSrc = app.iconPath ? `file://${app.iconPath}` : null
  const showFallback = !iconSrc || imgError

  return (
    <div
      className={`app-card card ${isSelected ? 'selected' : ''} ${isOpen ? 'open' : ''}`}
      onClick={onSelect}
    >
      {/* Open indicator */}
      {isOpen && <div className="app-card-open-dot" />}

      <div className="app-card-body">
        {/* Icon */}
        <div className="app-card-icon">
          {showFallback ? (
            <div className="app-card-icon-fallback">
              {app.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <img
              src={iconSrc!}
              alt={app.name}
              onError={() => setImgError(true)}
              draggable={false}
            />
          )}
        </div>

        {/* Info */}
        <div className="app-card-info">
          <span className="app-card-name truncate">{app.name}</span>
          <span className="app-card-domain truncate text-dim">{getDomain()}</span>
        </div>
      </div>

      {/* Actions overlay */}
      <div className="app-card-actions">
        <button
          className="btn btn-primary btn-sm app-card-launch"
          onClick={handleLaunch}
          disabled={launching || !defaultProfileId}
        >
          {launching ? (
            <span className="spinner" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
          {isOpen ? 'Focus' : 'Open'}
        </button>

        <div className="app-card-action-row">
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onOpenProfiles() }} title="Profiles">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </button>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onOpenSettings() }} title="Settings">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          </button>
          <button className="btn-icon btn-danger-icon" onClick={handleDelete} title="Remove">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
