import { useState, useEffect } from 'react'
import { useStore } from '../store'
import './ProfileSwitcher.css'

interface Props {
  appId: string
  onClose: () => void
}

export default function ProfileSwitcher({ appId, onClose }: Props) {
  const { apps, profiles: allProfiles, setProfilesForApp, addProfile, removeProfile } = useStore()
  const app = apps.find((a) => a.id === appId)
  const profiles = allProfiles[appId] ?? []

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#FF007F')
  const [adding, setAdding] = useState(false)
  const [launching, setLaunching] = useState<string | null>(null)

  useEffect(() => {
    window.api.listProfiles(appId).then((p) => setProfilesForApp(appId, p))
  }, [appId, setProfilesForApp])

  async function handleLaunch(profileId: string) {
    setLaunching(profileId)
    try { await window.api.openApp(appId, profileId) } finally { setLaunching(null); onClose() }
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const profile = await window.api.createProfile({ appId, name: newName.trim(), color: newColor })
      addProfile(profile)
      setNewName('')
    } finally { setAdding(false) }
  }

  async function handleDelete(profileId: string) {
    if (profiles.length <= 1) return alert('An app must have at least one profile.')
    await window.api.deleteProfile(profileId)
    removeProfile(profileId, appId)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal profile-switcher-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Profiles — {app?.name}</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 14 }}>
            Each profile has a separate browsing session — different accounts, cookies, and storage.
          </p>

          <div className="profile-list">
            {profiles.map((p) => (
              <div key={p.id} className="profile-row">
                <div className="profile-swatch" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                <span className="profile-name">{p.name}</span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleLaunch(p.id)}
                  disabled={!!launching}
                >
                  {launching === p.id ? <span className="spinner" /> : 'Open'}
                </button>
                <button className="btn-icon btn-danger-icon" onClick={() => handleDelete(p.id)} title="Delete">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="sep" />
          <p className="text-dim" style={{ fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>New Profile</p>
          <div className="new-profile-row">
            <input
              type="color"
              className="color-picker"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
            <input
              className="input"
              placeholder="Profile name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={adding || !newName.trim()}>
              {adding ? <span className="spinner" /> : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
