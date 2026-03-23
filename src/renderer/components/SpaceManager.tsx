import { useState } from 'react'
import { useStore } from '../store'
import type { CreateSpaceInput } from '@shared/types'
import './SpaceManager.css'

const ICONS = ['🌐','🏠','💼','🎮','🎨','📚','🛠️','🎵','📊','🌿','⚡','🔬','🎯','💡','🔥','🌟']
const COLORS = ['#FF007F','#FF1493','#8A70D6','#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16']

interface Props { onClose: () => void }

export default function SpaceManager({ onClose }: Props) {
  const { spaces, addSpace, removeSpace } = useStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#FF007F')
  const [icon, setIcon] = useState('🌐')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setAdding(true)
    try {
      const spaceInput: CreateSpaceInput = { name: name.trim(), color, icon }
      const space = await window.api.createSpace(spaceInput)
      addSpace(space)
      setName('')
    } finally { setAdding(false) }
  }

  async function handleDelete(id: string) {
    if (id === 'default') return alert('Cannot delete the default space.')
    if (!confirm('Delete this space? Apps in it will move to Main.')) return
    await window.api.deleteSpace(id)
    removeSpace(id)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal space-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Spaces</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Existing spaces */}
          <div className="space-list">
            {spaces.map((space) => (
              <div key={space.id} className="space-row">
                <span className="space-icon">{space.icon}</span>
                <span className="space-dot" style={{ background: space.color, boxShadow: `0 0 6px ${space.color}` }} />
                <span className="space-name flex-1 truncate">{space.name}</span>
                <button
                  className="btn-icon btn-danger-icon"
                  onClick={() => handleDelete(space.id)}
                  disabled={space.id === 'default'}
                  title={space.id === 'default' ? 'Cannot delete default space' : 'Delete space'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="sep" />
          <p className="text-dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 12 }}>
            New Space
          </p>

          {/* Icon picker */}
          <div className="icon-picker">
            {ICONS.map((i) => (
              <button
                key={i}
                className={`icon-option ${icon === i ? 'selected' : ''}`}
                onClick={() => setIcon(i)}
              >{i}</button>
            ))}
          </div>

          {/* Color picker */}
          <div className="color-swatches">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${color === c ? 'selected' : ''}`}
                style={{ background: c, boxShadow: color === c ? `0 0 8px ${c}` : undefined }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <div className="new-space-row">
            <input
              className="input"
              placeholder="Space name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={adding || !name.trim()}>
              {adding ? <span className="spinner" /> : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
