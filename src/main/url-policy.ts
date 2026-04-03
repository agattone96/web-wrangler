const APP_URL_PROTOCOLS = new Set(['https:'])
const EXTERNAL_URL_PROTOCOLS = new Set(['https:', 'mailto:'])

function parseUrl(raw: string, errorMessage: string): URL {
  try {
    return new URL(raw)
  } catch {
    throw new Error(errorMessage)
  }
}

export function assertValidAppUrl(raw: string): URL {
  const url = parseUrl(raw, 'App URL must be a valid absolute URL.')
  if (!APP_URL_PROTOCOLS.has(url.protocol)) {
    throw new Error('Only HTTPS app URLs are allowed.')
  }
  return url
}

export function getSafeExternalUrl(raw: string): string | null {
  let url: URL
  try {
    url = parseUrl(raw, 'External URL must be a valid absolute URL.')
  } catch {
    return null
  }
  if (!EXTERNAL_URL_PROTOCOLS.has(url.protocol)) {
    return null
  }
  return url.toString()
}

export function isAllowedRendererUrl(raw: string, isDev: boolean): boolean {
  return (isDev && raw.startsWith('http://127.0.0.1:5173')) || raw.startsWith('app://')
}

export function shouldAllowPermission(): boolean {
  return false
}
