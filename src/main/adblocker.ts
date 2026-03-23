import { ElectronBlocker } from '@ghostery/adblocker-electron'
import { Session } from 'electron'
import fetch from 'cross-fetch'

let blockerPromise: Promise<ElectronBlocker> | null = null
const enabledSessions = new Set<string>()

export async function setupAdblocker(sess: Session): Promise<void> {
  const sessionId = sess.storagePath ?? sess.getUserAgent()
  if (enabledSessions.has(sessionId)) return
  enabledSessions.add(sessionId)

  try {
    if (!blockerPromise) {
      blockerPromise = ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
    }
    const blocker = await blockerPromise
    blocker.enableBlockingInSession(sess)
  } catch (err) {
    console.error('[adblocker] failed to initialize:', err)
    enabledSessions.delete(sessionId) // Allow retry if failed
  }
}

export function disableAdblocker(sess: Session): void {
  const sessionId = sess.storagePath ?? sess.getUserAgent()
  if (enabledSessions.has(sessionId)) {
    enabledSessions.delete(sessionId)
  }
  if (blockerPromise) {
    blockerPromise.then(b => b.disableBlockingInSession(sess))
  }
}
