import { useState, useEffect } from 'react'
import { useStore } from '../store'
import type { AppSettings } from '@shared/types'
import './AppSettingsModal.css'

interface Props { appId: string }

export default function AppSettingsModal({ appId }: Props) {
  const { apps, setSettingsTargetApp } = useStore()
  const app = apps.find((a) => a.id === appId)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'advanced'>('general')

  useEffect(() => {
    window.api.getAppSettings(appId).then(setSettings)
  }, [appId])

  function patch<K extends keyof Omit<AppSettings, 'appId'>>(key: K, value: AppSettings[K]) {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    const { appId: _, ...rest } = settings
    await window.api.updateAppSettings(appId, rest)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function onClose() { setSettingsTargetApp(null) }

  if (!settings) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{app?.name ?? 'App'} Settings</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '12px 24px 0' }}>
          <div className="tabs">
            <button className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
            <button className={`tab ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Advanced</button>
          </div>
        </div>

        <div className="modal-body settings-body">
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="setting-row">
                <div>
                  <div className="setting-label">Block Ads & Trackers</div>
                  <div className="setting-desc">Uses EasyList filter lists</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={settings.blockAds} onChange={(e) => patch('blockAds', e.target.checked)} />
                  <div className="toggle-track" />
                </label>
              </div>
              <div className="sep" />
              <div className="setting-row">
                <div>
                  <div className="setting-label">Dark Mode</div>
                  <div className="setting-desc">Injects DarkReader into site</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={settings.darkMode} onChange={(e) => patch('darkMode', e.target.checked)} />
                  <div className="toggle-track" />
                </label>
              </div>
              <div className="sep" />
              <div className="setting-row">
                <div>
                  <div className="setting-label">Notifications</div>
                  <div className="setting-desc">Allow web notifications</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notifications} onChange={(e) => patch('notifications', e.target.checked)} />
                  <div className="toggle-track" />
                </label>
              </div>
              <div className="sep" />
              <div className="input-group">
                <label>Zoom Level: {Math.round(settings.zoomLevel * 100)}%</label>
                <input
                  type="range" min="0.5" max="2" step="0.05"
                  value={settings.zoomLevel}
                  onChange={(e) => patch('zoomLevel', parseFloat(e.target.value))}
                  className="zoom-slider"
                />
              </div>
              <div className="sep" />
              <div className="input-group">
                <label>Proxy URL</label>
                <input className="input" placeholder="e.g. http://127.0.0.1:8080" value={settings.proxyUrl} onChange={(e) => patch('proxyUrl', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="settings-section">
              <div className="input-group">
                <label>Custom User Agent</label>
                <input className="input" placeholder="Leave blank for default" value={settings.userAgent} onChange={(e) => patch('userAgent', e.target.value)} />
              </div>
              <div className="sep" />
              <div className="input-group">
                <label>Custom CSS</label>
                <textarea className="input code-area" rows={5} placeholder="/* injected into every page */" value={settings.customCss} onChange={(e) => patch('customCss', e.target.value)} />
              </div>
              <div className="sep" />
              <div className="input-group">
                <label>Custom JavaScript</label>
                <textarea className="input code-area" rows={5} placeholder="// executed on every page load" value={settings.customJs} onChange={(e) => patch('customJs', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
