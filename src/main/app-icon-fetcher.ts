import https from 'https'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export async function fetchFavicon(url: string, appId: string): Promise<string | null> {
  try {
    const origin = new URL(url).origin
    const iconDir = path.join(app.getPath('userData'), 'icons')
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true })
    }
    const destPath = path.join(iconDir, `${appId}.png`)

    // We try Google's service first as it's very reliable
    // sz=128 for higher quality if available
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=128`
    const downloaded = await downloadToFile(googleFaviconUrl, destPath)
    if (downloaded) return destPath

    // Fallback: direct favicon.ico
    const directUrl = `${origin}/favicon.ico`
    const downloadedDirect = await downloadToFile(directUrl, destPath)
    if (downloadedDirect) return destPath

    return null
  } catch (err) {
    console.error(`[fetchFavicon] Error for ${url}:`, err)
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
