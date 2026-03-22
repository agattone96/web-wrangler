import { ElectronBlocker } from '@ghostery/adblocker-electron'
import { Session } from 'electron'
import fetch from 'cross-fetch'

// Cache the blocker so we only build it once
let blocker: ElectronBlocker | null = null
const enabledSessions = new Set<string>()

export async function setupAdblocker(sess: Session): Promise<void> {
  const sessionId = sess.storagePath ?? sess.getUserAgent()
  if (enabledSessions.has(sessionId)) return
  enabledSessions.add(sessionId)

  try {
    if (!blocker) {
      blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
    }
    blocker.enableBlockingInSession(sess)
  } catch (err) {
    console.error('[adblocker] failed to initialize:', err)
  }
}

export function disableAdblocker(sess: Session): void {
  if (blocker) {
    blocker.disableBlockingInSession(sess)
  }
}
