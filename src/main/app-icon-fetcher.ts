import https from 'https'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export async function fetchFavicon(url: string, appId: string): Promise<string | null> {
  try {
    const origin = new URL(url).origin
    const iconDir = path.join(app.getPath('userData'), 'icons')
    fs.mkdirSync(iconDir, { recursive: true })
    const destPath = path.join(iconDir, `${appId}.png`)

    // Try Google's favicon service first (reliable, always returns something)
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=64`
    const downloaded = await downloadToFile(googleFaviconUrl, destPath)
    if (downloaded) return destPath

    // Fallback: try /favicon.ico directly
    const directUrl = `${origin}/favicon.ico`
    const downloaded2 = await downloadToFile(directUrl, destPath)
    if (downloaded2) return destPath

    return null
  } catch {
    return null
  }
}

function downloadToFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(dest)
    const req = protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close()
        fs.unlink(dest, () => {})
        resolve(false)
        return
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve(true) })
    })
    req.on('error', () => { file.close(); fs.unlink(dest, () => {}); resolve(false) })
    req.setTimeout(5000, () => { req.destroy(); resolve(false) })
  })
}
