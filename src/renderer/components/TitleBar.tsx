import { useStore } from '../store'
import './TitleBar.css'

export default function TitleBar() {
  const { searchQuery, setSearchQuery, setShowGlobalSettings } = useStore()

  return (
    <header className="app-titlebar drag-region">
      <div className="titlebar-left">
        <div className="titlebar-logo">
          <span className="logo-icon">W</span>
          <span className="logo-text">WebWrangler</span>
        </div>
      </div>

      <div className="titlebar-center no-drag">
        <div className="search-wrap">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="input search-input"
            placeholder="Search all apps…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
      </div>

      <div className="titlebar-actions no-drag">
        <button className="btn-icon" onClick={() => setShowGlobalSettings(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
        </button>
      </div>
    </header>
  )
}
