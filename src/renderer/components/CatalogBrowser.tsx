import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import type { CatalogApp } from '@shared/types'
import './CatalogBrowser.css'

const CATEGORIES = ['All', 'Productivity', 'Communication', 'Development', 'AI', 'Design', 'Finance', 'Entertainment', 'Social', 'Other']

export default function CatalogBrowser() {
  const { setShowCatalog, addApp, spaces } = useStore()
  const [catalog, setCatalog] = useState<CatalogApp[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [installing, setInstalling] = useState<string | null>(null)
  const { apps } = useStore()

  useEffect(() => {
    window.api.listCatalog({
      search: search || undefined,
      category: category !== 'All' ? category : undefined
    })
      .then(setCatalog)
  }, [search, category])

  const installedUrls = useMemo(() => new Set(apps.map((app) => app.url)), [apps])

  async function handleInstall(item: CatalogApp) {
    if (installedUrls.has(item.url) || installing === item.id) return
    setInstalling(item.id)
    try {
      const spaceId = spaces[0]?.id ?? 'default'
      const app = await window.api.installApp({ name: item.name, url: item.url, spaceId })
      addApp(app)
    } finally { setInstalling(null) }
  }

  const [iconErrors, setIconErrors] = useState<Set<string>>(new Set())

  return (
    <div className="modal-backdrop" onClick={() => setShowCatalog(false)}>
      <div className="modal catalog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>App Catalog</h2>
          <button className="btn-icon" onClick={() => setShowCatalog(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Search + category bar */}
        <div className="catalog-toolbar">
          <div className="search-wrap" style={{ flex: 1 }}>
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="input search-input"
              placeholder="Search catalog…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="catalog-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >{cat}</button>
          ))}
        </div>

        <div className="neon-line" />

        {/* Grid */}
        <div className="catalog-grid-scroll">
          {catalog.length === 0 ? (
            <div className="empty-state">
              <span className="icon">🔍</span>
              <h3>No results</h3>
            </div>
          ) : (
            <div className="catalog-grid">
              {catalog.map((item) => {
                const isInstalled = installedUrls.has(item.url)
                const hasIconError = iconErrors.has(item.id)
                return (
                  <div key={item.id} className={`catalog-card card ${isInstalled ? 'catalog-installed' : ''}`}>
                    <div className="catalog-card-icon">
                      {item.iconUrl && !hasIconError ? (
                        <img 
                          src={item.iconUrl} 
                          alt={item.name} 
                          onError={() => setIconErrors(prev => new Set([...prev, item.id]))} 
                        />
                      ) : (
                        <span className="catalog-fallback">{item.name[0]}</span>
                      )}
                    </div>
                    <div className="catalog-card-info">
                      <span className="catalog-card-name">{item.name}</span>
                      <span className="catalog-card-cat badge badge-orchid">{item.category}</span>
                    </div>
                    <button
                      className={`btn btn-sm ${isInstalled ? 'btn-ghost' : 'btn-primary'} catalog-install-btn`}
                      onClick={() => !isInstalled && handleInstall(item)}
                      disabled={installing === item.id || isInstalled}
                    >
                      {installing === item.id ? <span className="spinner" /> : isInstalled ? '✓ Added' : 'Add'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
