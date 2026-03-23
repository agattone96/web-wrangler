import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import type { App, Profile, Space, AppSettings, CatalogApp, GlobalSettings, WindowState } from '../shared/types'
import { DEFAULT_GLOBAL_SETTINGS } from '../shared/types'

let db: Database.Database

type AppRow = {
  id: string
  name: string
  url: string
  icon_path: string | null
  space_id: string | null
  created_at: number
}

type ProfileRow = {
  id: string
  app_id: string
  name: string
  color: string
  created_at: number
}

type SpaceRow = {
  id: string
  name: string
  color: string
  icon: string
  sort_order: number
}

type AppSettingsRow = {
  app_id: string
  zoom_level: number
  dark_mode: number
  block_ads: number
  custom_css: string
  custom_js: string
  user_agent: string
  open_at_login: number
  notifications: number
  proxy_url: string
}

type CatalogRow = {
  id: string
  name: string
  url: string
  icon_url: string
  category: string
  description: string
}

type WindowStateRow = {
  x: number | null
  y: number | null
  width: number
  height: number
}

type AppSettingsUpdateKey = keyof Omit<AppSettings, 'appId'>
type GlobalSettingsRecord = Record<keyof GlobalSettings, GlobalSettings[keyof GlobalSettings]>

export function initDb(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'apps.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate()
  seedCatalog()
}

function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS spaces (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      color       TEXT NOT NULL DEFAULT '#6366f1',
      icon        TEXT NOT NULL DEFAULT '🌐',
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS apps (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      url         TEXT NOT NULL,
      icon_path   TEXT,
      space_id    TEXT,
      created_at  INTEGER NOT NULL,
      FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id          TEXT PRIMARY KEY,
      app_id      TEXT NOT NULL,
      name        TEXT NOT NULL,
      color       TEXT NOT NULL DEFAULT '#6366f1',
      created_at  INTEGER NOT NULL,
      FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      app_id          TEXT PRIMARY KEY,
      zoom_level      REAL NOT NULL DEFAULT 1.0,
      dark_mode       INTEGER NOT NULL DEFAULT 0,
      block_ads       INTEGER NOT NULL DEFAULT 1,
      custom_css      TEXT NOT NULL DEFAULT '',
      custom_js       TEXT NOT NULL DEFAULT '',
      user_agent      TEXT NOT NULL DEFAULT '',
      open_at_login   INTEGER NOT NULL DEFAULT 0,
      notifications   INTEGER NOT NULL DEFAULT 1,
      proxy_url       TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS catalog (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      url         TEXT NOT NULL,
      icon_url    TEXT NOT NULL DEFAULT '',
      category    TEXT NOT NULL DEFAULT 'Other',
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS global_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS window_states (
      key   TEXT PRIMARY KEY,
      x     INTEGER,
      y     INTEGER,
      width INTEGER NOT NULL DEFAULT 1200,
      height INTEGER NOT NULL DEFAULT 800
    );
  `)

  // Insert default space if none exist
  const spaceCount = (db.prepare('SELECT COUNT(*) as c FROM spaces').get() as { c: number }).c
  if (spaceCount === 0) {
    db.prepare(`INSERT INTO spaces (id, name, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)`)
      .run('default', 'Main', '#6366f1', '🏠', 0)
  }

  // Seed default global settings
  const keys = Object.keys(DEFAULT_GLOBAL_SETTINGS) as (keyof GlobalSettings)[]
  const upsert = db.prepare(`INSERT OR IGNORE INTO global_settings (key, value) VALUES (?, ?)`)
  for (const key of keys) {
    upsert.run(key, JSON.stringify(DEFAULT_GLOBAL_SETTINGS[key]))
  }
}

// ─── Apps ───────────────────────────────────────────────────────────────────

export function listApps(): App[] {
  return (db.prepare('SELECT * FROM apps ORDER BY created_at ASC').all() as AppRow[]).map(rowToApp)
}

export function getApp(id: string): App | null {
  const row = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as AppRow | undefined
  return row ? rowToApp(row) : null
}

export function insertApp(app: App): void {
  db.prepare(`
    INSERT INTO apps (id, name, url, icon_path, space_id, created_at)
    VALUES (@id, @name, @url, @iconPath, @spaceId, @createdAt)
  `).run({ id: app.id, name: app.name, url: app.url, iconPath: app.iconPath, spaceId: app.spaceId, createdAt: app.createdAt })

  // Insert default settings for this app
  db.prepare(`
    INSERT OR IGNORE INTO app_settings (app_id) VALUES (?)
  `).run(app.id)
}

export function updateApp(id: string, data: Partial<Pick<App, 'name' | 'url' | 'iconPath' | 'spaceId'>>): void {
  const fields: string[] = []
  const values: Array<string | null> = []
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.url !== undefined) { fields.push('url = ?'); values.push(data.url) }
  if (data.iconPath !== undefined) { fields.push('icon_path = ?'); values.push(data.iconPath) }
  if (data.spaceId !== undefined) { fields.push('space_id = ?'); values.push(data.spaceId) }
  if (fields.length === 0) return
  values.push(id)
  db.prepare(`UPDATE apps SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export function deleteApp(id: string): void {
  db.prepare('DELETE FROM apps WHERE id = ?').run(id)
}

function rowToApp(row: AppRow): App {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    iconPath: row.icon_path,
    spaceId: row.space_id,
    createdAt: row.created_at,
  }
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export function listProfiles(appId: string): Profile[] {
  return (db.prepare('SELECT * FROM profiles WHERE app_id = ? ORDER BY created_at ASC').all(appId) as ProfileRow[]).map(rowToProfile)
}

export function insertProfile(profile: Profile): void {
  db.prepare(`
    INSERT INTO profiles (id, app_id, name, color, created_at)
    VALUES (@id, @appId, @name, @color, @createdAt)
  `).run({ id: profile.id, appId: profile.appId, name: profile.name, color: profile.color, createdAt: profile.createdAt })
}

export function updateProfile(id: string, data: Partial<Pick<Profile, 'name' | 'color'>>): void {
  const fields: string[] = []
  const values: string[] = []
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color) }
  if (fields.length === 0) return
  values.push(id)
  db.prepare(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export function deleteProfile(id: string): void {
  db.prepare('DELETE FROM profiles WHERE id = ?').run(id)
}

function rowToProfile(row: ProfileRow): Profile {
  return { id: row.id, appId: row.app_id, name: row.name, color: row.color, createdAt: row.created_at }
}

// ─── Spaces ──────────────────────────────────────────────────────────────────

export function listSpaces(): Space[] {
  return (db.prepare('SELECT * FROM spaces ORDER BY sort_order ASC').all() as SpaceRow[]).map(rowToSpace)
}

export function insertSpace(space: Space): void {
  db.prepare(`
    INSERT INTO spaces (id, name, color, icon, sort_order)
    VALUES (@id, @name, @color, @icon, @sortOrder)
  `).run({ id: space.id, name: space.name, color: space.color, icon: space.icon, sortOrder: space.sortOrder })
}

export function updateSpace(id: string, data: Partial<Omit<Space, 'id'>>): void {
  const fields: string[] = []
  const values: Array<string | number> = []
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color) }
  if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon) }
  if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(data.sortOrder) }
  if (fields.length === 0) return
  values.push(id)
  db.prepare(`UPDATE spaces SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export function deleteSpace(id: string): void {
  if (id === 'default') return
  db.prepare("UPDATE apps SET space_id = 'default' WHERE space_id = ?").run(id)
  db.prepare('DELETE FROM spaces WHERE id = ?').run(id)
}

function rowToSpace(row: SpaceRow): Space {
  return { id: row.id, name: row.name, color: row.color, icon: row.icon, sortOrder: row.sort_order }
}

// ─── App Settings ────────────────────────────────────────────────────────────

export function getAppSettings(appId: string): AppSettings {
  const row = db.prepare('SELECT * FROM app_settings WHERE app_id = ?').get(appId) as AppSettingsRow | undefined
  if (!row) return {
    appId, zoomLevel: 1.0, darkMode: false, blockAds: true,
    customCss: '', customJs: '', userAgent: '', openAtLogin: false,
    notifications: true, proxyUrl: '',
  }
  return {
    appId: row.app_id,
    zoomLevel: row.zoom_level,
    darkMode: !!row.dark_mode,
    blockAds: !!row.block_ads,
    customCss: row.custom_css,
    customJs: row.custom_js,
    userAgent: row.user_agent,
    openAtLogin: !!row.open_at_login,
    notifications: !!row.notifications,
    proxyUrl: row.proxy_url,
  }
}

export function updateAppSettings(appId: string, data: Partial<Omit<AppSettings, 'appId'>>): void {
  const fields: string[] = []
  const values: Array<string | number> = []
  const map: Record<AppSettingsUpdateKey, string> = {
    zoomLevel: 'zoom_level', darkMode: 'dark_mode', blockAds: 'block_ads',
    customCss: 'custom_css', customJs: 'custom_js', userAgent: 'user_agent',
    openAtLogin: 'open_at_login', notifications: 'notifications', proxyUrl: 'proxy_url',
  }
  for (const [jsKey, sqlKey] of Object.entries(map) as [AppSettingsUpdateKey, string][]) {
    const value = data[jsKey]
    if (value !== undefined) {
      fields.push(`${sqlKey} = ?`)
      values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value)
    }
  }
  if (fields.length === 0) return
  values.push(appId)
  db.prepare(`UPDATE app_settings SET ${fields.join(', ')} WHERE app_id = ?`).run(...values)
}

// ─── Global Settings ─────────────────────────────────────────────────────────

export function getGlobalSettings(): GlobalSettings {
  const rows = db.prepare('SELECT key, value FROM global_settings').all() as { key: string; value: string }[]
  const result: Partial<GlobalSettingsRecord> = { ...DEFAULT_GLOBAL_SETTINGS }
  for (const row of rows) {
    const key = row.key as keyof GlobalSettings
    result[key] = JSON.parse(row.value) as GlobalSettingsRecord[typeof key]
  }
  return result as GlobalSettings
}

export function updateGlobalSettings(data: Partial<GlobalSettings>): void {
  const upsert = db.prepare(`INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)`)
  for (const [key, value] of Object.entries(data)) {
    upsert.run(key, JSON.stringify(value))
  }
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export function listCatalog(search?: string, category?: string): CatalogApp[] {
  let query = 'SELECT * FROM catalog'
  const conditions: string[] = []
  const params: string[] = []
  if (search) { conditions.push("name LIKE ?"); params.push(`%${search}%`) }
  if (category) { conditions.push('category = ?'); params.push(category) }
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ')
  query += ' ORDER BY name ASC'
  return (db.prepare(query).all(...params) as CatalogRow[]).map(row => ({
    id: row.id, name: row.name, url: row.url, iconUrl: row.icon_url,
    category: row.category, description: row.description,
  }))
}

export function isCatalogSeeded(): boolean {
  const count = (db.prepare('SELECT COUNT(*) as c FROM catalog').get() as { c: number }).c
  return count > 0
}

// ─── Window State ─────────────────────────────────────────────────────────────

export function getWindowState(key: string): WindowState {
  const row = db.prepare('SELECT * FROM window_states WHERE key = ?').get(key) as WindowStateRow | undefined
  return row
    ? { x: row.x ?? undefined, y: row.y ?? undefined, width: row.width, height: row.height }
    : { width: 1200, height: 800 }
}

export function saveWindowState(key: string, state: WindowState): void {
  db.prepare(`INSERT OR REPLACE INTO window_states (key, x, y, width, height) VALUES (?, ?, ?, ?, ?)`)
    .run(key, state.x ?? null, state.y ?? null, state.width, state.height)
}

function seedCatalog(): void {
  if (isCatalogSeeded()) return
  const catalogData: Omit<CatalogApp, 'description'>[] = [
    { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com', iconUrl: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico', category: 'Productivity' },
    { id: 'google-calendar', name: 'Google Calendar', url: 'https://calendar.google.com', iconUrl: 'https://calendar.google.com/googlecalendar/images/favicon_v2018_256.png', category: 'Productivity' },
    { id: 'google-docs', name: 'Google Docs', url: 'https://docs.google.com', iconUrl: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico', category: 'Productivity' },
    { id: 'google-sheets', name: 'Google Sheets', url: 'https://sheets.google.com', iconUrl: 'https://ssl.gstatic.com/docs/spreadsheets/images/spreadsheets2.ico', category: 'Productivity' },
    { id: 'google-slides', name: 'Google Slides', url: 'https://slides.google.com', iconUrl: 'https://ssl.gstatic.com/docs/presentations/images/favicon5.ico', category: 'Productivity' },
    { id: 'google-drive', name: 'Google Drive', url: 'https://drive.google.com', iconUrl: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png', category: 'Productivity' },
    { id: 'notion', name: 'Notion', url: 'https://www.notion.so', iconUrl: 'https://www.notion.so/images/favicon.ico', category: 'Productivity' },
    { id: 'linear', name: 'Linear', url: 'https://linear.app', iconUrl: 'https://linear.app/favicon.ico', category: 'Productivity' },
    { id: 'todoist', name: 'Todoist', url: 'https://todoist.com', iconUrl: 'https://todoist.com/static/favicon.ico', category: 'Productivity' },
    { id: 'airtable', name: 'Airtable', url: 'https://airtable.com', iconUrl: 'https://airtable.com/favicon.ico', category: 'Productivity' },
    { id: 'slack', name: 'Slack', url: 'https://app.slack.com', iconUrl: 'https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png', category: 'Communication' },
    { id: 'discord', name: 'Discord', url: 'https://discord.com/app', iconUrl: 'https://discord.com/assets/favicon.ico', category: 'Communication' },
    { id: 'telegram', name: 'Telegram', url: 'https://web.telegram.org', iconUrl: 'https://web.telegram.org/img/favicon.ico', category: 'Communication' },
    { id: 'whatsapp', name: 'WhatsApp', url: 'https://web.whatsapp.com', iconUrl: 'https://web.whatsapp.com/favicon.ico', category: 'Communication' },
    { id: 'teams', name: 'Microsoft Teams', url: 'https://teams.microsoft.com', iconUrl: 'https://teams.microsoft.com/favicon.ico', category: 'Communication' },
    { id: 'zoom', name: 'Zoom', url: 'https://app.zoom.us', iconUrl: 'https://st1.zoom.us/zoom.ico', category: 'Communication' },
    { id: 'github', name: 'GitHub', url: 'https://github.com', iconUrl: 'https://github.com/favicon.ico', category: 'Development' },
    { id: 'gitlab', name: 'GitLab', url: 'https://gitlab.com', iconUrl: 'https://gitlab.com/assets/favicon-72a2cad5025aa931d6ea56c3201d1f18e68a8cd39788c7c80d5b2b82aa5143ef.png', category: 'Development' },
    { id: 'google-ai-studio', name: 'Google AI Studio', url: 'https://aistudio.google.com', iconUrl: 'https://www.gstatic.com/aistudio/ai_studio_favicon_32.png', category: 'AI' },
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', iconUrl: 'https://chatgpt.com/favicon.ico', category: 'AI' },
    { id: 'claude', name: 'Claude', url: 'https://claude.ai', iconUrl: 'https://claude.ai/favicon.ico', category: 'AI' },
    { id: 'gemini', name: 'Google Gemini', url: 'https://gemini.google.com', iconUrl: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06.png', category: 'AI' },
    { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai', iconUrl: 'https://www.perplexity.ai/favicon.ico', category: 'AI' },
    { id: 'figma', name: 'Figma', url: 'https://www.figma.com', iconUrl: 'https://static.figma.com/app/icon/1/favicon.ico', category: 'Design' },
    { id: 'canva', name: 'Canva', url: 'https://www.canva.com', iconUrl: 'https://www.canva.com/favicon.ico', category: 'Design' },
    { id: 'trello', name: 'Trello', url: 'https://trello.com', iconUrl: 'https://trello.com/favicon.ico', category: 'Productivity' },
    { id: 'asana', name: 'Asana', url: 'https://app.asana.com', iconUrl: 'https://app.asana.com/favicon.ico', category: 'Productivity' },
    { id: 'jira', name: 'Jira', url: 'https://id.atlassian.com', iconUrl: 'https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png', category: 'Productivity' },
    { id: 'confluence', name: 'Confluence', url: 'https://id.atlassian.com', iconUrl: 'https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png', category: 'Productivity' },
    { id: 'outlook', name: 'Outlook', url: 'https://outlook.live.com', iconUrl: 'https://outlook.live.com/favicon.ico', category: 'Productivity' },
    { id: 'spotify', name: 'Spotify', url: 'https://open.spotify.com', iconUrl: 'https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico', category: 'Entertainment' },
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', iconUrl: 'https://www.youtube.com/favicon.ico', category: 'Entertainment' },
    { id: 'twitter', name: 'X (Twitter)', url: 'https://x.com', iconUrl: 'https://abs.twimg.com/favicons/twitter.2.ico', category: 'Social' },
    { id: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com', iconUrl: 'https://www.linkedin.com/favicon.ico', category: 'Social' },
    { id: 'reddit', name: 'Reddit', url: 'https://www.reddit.com', iconUrl: 'https://www.reddit.com/favicon.ico', category: 'Social' },
    { id: 'vercel', name: 'Vercel', url: 'https://vercel.com', iconUrl: 'https://vercel.com/favicon.ico', category: 'Development' },
    { id: 'supabase', name: 'Supabase', url: 'https://app.supabase.com', iconUrl: 'https://app.supabase.com/favicon/favicon-32x32.png', category: 'Development' },
    { id: 'cloudflare', name: 'Cloudflare', url: 'https://dash.cloudflare.com', iconUrl: 'https://dash.cloudflare.com/favicon.ico', category: 'Development' },
    { id: 'stripe', name: 'Stripe', url: 'https://dashboard.stripe.com', iconUrl: 'https://dashboard.stripe.com/favicon.ico', category: 'Finance' },
  ]

  const insert = db.prepare(`
    INSERT OR IGNORE INTO catalog (id, name, url, icon_url, category, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertMany = db.transaction((items: typeof catalogData) => {
    for (const item of items) {
      insert.run(item.id, item.name, item.url, item.iconUrl, item.category, '')
    }
  })
  insertMany(catalogData)
}
