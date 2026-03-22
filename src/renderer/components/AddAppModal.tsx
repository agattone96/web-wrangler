import { useState } from 'react'
import { useStore } from '../store'
import './AddAppModal.css'

export default function AddAppModal() {
  const { setShowAddApp, addApp } = useStore()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [spaceId, setSpaceId] = useState('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { spaces } = useStore()

  function normalizeUrl(raw: string): string {
    let s = raw.trim()
    if (!s) return s
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s
    return s
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const finalUrl = normalizeUrl(url)
    if (!name.trim() || !finalUrl) { setError('Name and URL are required.'); return }
    try { new URL(finalUrl) } catch { setError('Invalid URL.'); return }

    setLoading(true)
    try {
      const app = await window.api.installApp({ name: name.trim(), url: finalUrl, spaceId })
      addApp(app)
      setShowAddApp(false)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add app.')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={() => setShowAddApp(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Web App</h2>
          <button className="btn-icon" onClick={() => setShowAddApp(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="text-muted add-app-intro">
              Turn any website into a standalone desktop app. Icons are fetched automatically.
            </p>

            <div className="add-app-fields">
              <div className="input-group">
                <label htmlFor="app-name">App Name</label>
                <input
                  id="app-name"
                  className="input"
                  placeholder="e.g. Gmail"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label htmlFor="app-url">URL</label>
                <input
                  id="app-url"
                  className="input"
                  placeholder="e.g. https://mail.google.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              {spaces.length > 0 && (
                <div className="input-group">
                  <label htmlFor="app-space">Space</label>
                  <select
                    id="app-space"
                    className="input"
                    value={spaceId}
                    onChange={(e) => setSpaceId(e.target.value)}
                  >
                    {spaces.map((s) => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="add-app-error">{error}</p>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddApp(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Adding…</> : 'Add App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
