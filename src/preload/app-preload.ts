import { ipcRenderer } from 'electron'

declare global {
  interface Window {
    DarkReader?: {
      enable: (options: { brightness: number; contrast: number; sepia: number }) => void
      disable: () => void
    }
  }
}

import { initializeDarkMode } from './dark-mode'

// Initializing universal dark mode for guest pages
initializeDarkMode()

// This preload is injected into GUEST web pages (e.g. Gmail, Notion).
// It handles initializing DarkReader (if sent from main).
// Custom CSS and JS are now handled directly by the main process via executeJavaScript and insertCSS for better security.

// Listen for DarkReader initialization from main process
ipcRenderer.on('dark-mode-init', (_e, { brightness, contrast, sepia }) => {
  if (window.DarkReader) {
    window.DarkReader.enable({ brightness, contrast, sepia })
  }
})

ipcRenderer.on('dark-mode-disable', () => {
  if (window.DarkReader) {
    window.DarkReader.disable()
  }
})
