# WebWrangler: The Technical Build

I built **WebWrangler** as a premium, privacy-focused, and highly performant web application browser. My vision was to create a tool that isn't just a container for websites, but a dedicated productivity workspace with a cutting-edge "Neon Cyber-Goth" aesthetic.

## 1. Core Architecture
I architected the application using **Electron** as the foundational shell, with **React** and **TypeScript** powering the UI.
- **Main Process**: Handled through `src/main/index.ts`, managing window lifecycles, IPC, and the database.
- **Renderer Process**: A modern React app built with **Vite**, utilizing a custom design system built entirely with **Vanilla CSS** for maximum performance and visual precision.
- **Persistence**: I integrated **SQLite** (`better-sqlite3`) for local data storage, handling app configurations, user spaces, and the app catalog without relying on any external cloud dependencies.

## 2. The "Neon Cyber-Goth" Design System
I wanted the UI to feel alive and premium. I implemented:
- **Glassmorphism**: Extensive use of `backdrop-filter: blur()` and semi-transparent surfaces to create deep, layered interfaces.
- **Neon Aesthetic**: A carefully curated palette of neon pink, blue, and orchid, accented with pulsing glow effects and sublte micro-animations.
- **Dynamic Interactions**: Hover states on cards use radial gradients to create "flashlight" effects, and active sidebar items pulse to indicate focus.

## 3. High-Fidelity Asset Management
I replaced standard graphics with premium, high-resolution assets:
- **App Icon**: I generated a 3D glassmorphic neon "W" icon (512x512) that stands out in the dock.
- **Tray Icon**: I developed a minimalist "Template" icon for the macOS menu bar that automatically adapts to system light/dark modes.
- **Catalog Fallbacks**: I built a failsafe in the `CatalogBrowser` ensuring that if an external app favicon is missing, a stylized, branded letter-fallback appears instead.

## 4. Privacy & Security Enhancements
Privacy was a top priority in my build:
- **Integrated Ad-blocking**: I integrated the `@ghostery/adblocker-electron` engine to provide native, high-performance blocking of trackers and ads across all guest windows.
- **Dark Mode Injection**: I bundled `darkreader` locally and engineered a custom script-injection system via `app-preload.ts`, allowing users to force a professional dark mode on any website without external extensions.
- **Local Preloads**: Guest windows are isolated with dedicated preload scripts, ensuring that custom CSS/JS injection remains secure and private.

## 5. Build & Distribution
I streamlined the build pipeline for both development and production:
- **Hybrid Dev Fallback**: I implemented a smart routing system in the main process. If the Vite dev server isn't running, the app automatically fails over to the local production build in `dist/renderer`, preventing "black screen" errors.
- **ASAR Pathing**: I refined the path resolution to use `app.getAppPath()`, ensuring that all assets and built files are found reliably when packaged inside a Mac `.app` bundle.
- **Packaging**: I configured `electron-builder` to handle high-DPI icons and DMG creation, ensuring a smooth end-user installation experience.

This project represents a full-stack effort to combine hardcore security features with a visually stunning, high-performance desktop experience.
