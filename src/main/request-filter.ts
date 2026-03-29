import { Session } from 'electron'

const BLOCKED_DOMAINS = [
  'google-analytics.com',
  'www.google-analytics.com',
  'doubleclick.net',
  'adservice.google.com',
  'quantserve.com',
  'scorecardresearch.com',
  'facebook.net',
  'facebook.com/tr', // common tracking pixel
  'ads-twitter.com',
  't.co',
  'analytics.twitter.com',
]

/**
 * Sets up a simple request filter to block known ad/tracker domains.
 */
export function setupRequestFilter(sess: Session): void {
  const filter = {
    urls: ['<all_urls>'],
  }

  sess.webRequest.onBeforeRequest(filter, (details, callback) => {
    try {
      const urlObj = new URL(details.url.toLowerCase())
      const hostname = urlObj.hostname
      
      const isBlocked = BLOCKED_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      )

      if (isBlocked) {
        console.log(`[RequestFilter] Blocked: ${details.url}`)
        callback({ cancel: true })
      } else {
        callback({ cancel: false })
      }
    } catch {
      callback({ cancel: false })
    }
  })
}
