/**
 * Injects a CSS filter to simulate dark mode based on system preference.
 */
export function initializeDarkMode(): void {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)'
      // Also invert back images, videos, and canvas to keep them natural
      const styleId = 'web-wrangler-dark-mode-fix'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          img, video, canvas, iframe, [style*="background-image"] {
            filter: invert(1) hue-rotate(180deg) !important;
          }
        `
        document.head.appendChild(style)
      }
    } else {
      document.documentElement.style.filter = ''
      const style = document.getElementById('web-wrangler-dark-mode-fix')
      if (style) style.remove()
    }
  }

  // Initial application
  applyDarkMode(darkModeMediaQuery.matches)

  // Listen for changes
  darkModeMediaQuery.addEventListener('change', (e) => {
    applyDarkMode(e.matches)
  })
}
