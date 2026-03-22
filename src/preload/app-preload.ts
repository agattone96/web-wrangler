import { contextBridge, ipcRenderer } from 'electron'

// This preload is injected into GUEST web pages (e.g. Gmail, Notion).
// It handles:
// 1. Receiving and applying custom CSS/JS.
// 2. Initializing DarkReader (if sent from main).

contextBridge.exposeInMainWorld('__WEB_WRANGLER__', {
  applyCustomCss: (css: string) => {
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
  },
  applyCustomJs: (js: string) => {
    try {
      eval(js)
    } catch (e) {
      console.error('[WebWrangler] Failed to execute custom JS:', e)
    }
  }
})

// Listen for DarkReader initialization from main process
ipcRenderer.on('dark-mode-init', (_e, { brightness, contrast, sepia }) => {
  // We assume DarkReader is already injected as a global script by the main process
  // because bundling it here would be too large for every window.
  if ((window as any).DarkReader) {
    (window as any).DarkReader.enable({ brightness, contrast, sepia })
  }
})
