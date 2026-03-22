import { useState, useEffect } from 'react'
import { useStore } from '../store'
import type { GlobalSettings } from '@shared/types'
import './GlobalSettingsModal.css'

const THEMES = [
  { value: 'system', label: '⚙ System' },
  { value: 'light', label: '☀ Light' },
  { value: 'dark', label: '🌙 Dark' },
] as const

export default function GlobalSettingsModal() {
  const { setShowGlobalSettings, setGlobalSettings } = useStore()
  const [settings, setSettings] = useState<GlobalSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pinInput, setPinInput] = useState('')

  useEffect(() => {
    window.api.getGlobalSettings().then((s) => { setSettings(s); setPinInput(s.lockPin) })
  }, [])

  function patch<K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    const final = { ...settings, lockPin: pinInput }
    await window.api.updateGlobalSettings(final)
    setGlobalSettings(final)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function onClose() { setShowGlobalSettings(false) }

  if (!settings) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal global-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Global Settings</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Behavior */}
          <p className="gs-section-label">Behavior</p>
          <div className="setting-row">
            <div>
              <div className="setting-label">Run in Background</div>
              <div className="setting-desc">Keep running when main window is closed</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={settings.runInBackground} onChange={(e) => patch('runInBackground', e.target.checked)} />
              <div className="toggle-track" />
            </label>
          </div>
          <div className="sep" />
          <div className="setting-row">
            <div>
              <div className="setting-label">Show in Menu Bar</div>
              <div className="setting-desc">Display tray icon in menu bar</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={settings.showInMenuBar} onChange={(e) => patch('showInMenuBar', e.target.checked)} />
              <div className="toggle-track" />
            </label>
          </div>

          <div className="sep" style={{ margin: '16px 0' }} />

          {/* Defaults */}
          <p className="gs-section-label">Defaults</p>
          <div className="setting-row">
            <div>
              <div className="setting-label">Block Ads Globally</div>
              <div className="setting-desc">Default for new apps</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={settings.blockAdsGlobal} onChange={(e) => patch('blockAdsGlobal', e.target.checked)} />
              <div className="toggle-track" />
            </label>
          </div>
          <div className="sep" />
          <div className="setting-row">
            <div>
              <div className="setting-label">Dark Mode by Default</div>
              <div className="setting-desc">New apps start in dark mode</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={settings.darkModeGlobal} onChange={(e) => patch('darkModeGlobal', e.target.checked)} />
              <div className="toggle-track" />
            </label>
          </div>
          <div className="sep" />
          <div className="setting-row">
            <div className="setting-label">Theme</div>
            <div className="tabs" style={{ width: 'auto', flex: 'unset' }}>
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  className={`tab ${settings.theme === t.value ? 'active' : ''}`}
                  onClick={() => patch('theme', t.value)}
                  style={{ padding: '5px 12px' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sep" style={{ margin: '16px 0' }} />

          {/* App Lock */}
          <p className="gs-section-label">App Lock</p>
          <div className="setting-row">
            <div>
              <div className="setting-label">Enable App Lock</div>
              <div className="setting-desc">Require PIN to open WebWrangler</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={settings.enableAppLock} onChange={(e) => patch('enableAppLock', e.target.checked)} />
              <div className="toggle-track" />
            </label>
          </div>
          {settings.enableAppLock && (
            <>
              <div className="sep" />
              <div className="input-group">
                <label>PIN</label>
                <input
                  className="input"
                  type="password"
                  placeholder="4-digit PIN"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="sep" />
              <div className="input-group">
                <label>Lock Timeout: {settings.lockTimeout === 0 ? 'Immediately' : `${settings.lockTimeout} min`}</label>
                <input
                  type="range" min="0" max="60" step="5"
                  value={settings.lockTimeout}
                  onChange={(e) => patch('lockTimeout', parseInt(e.target.value))}
                  className="zoom-slider"
                />
              </div>
            </>
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
