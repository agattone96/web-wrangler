# Changelog

All notable changes to the **WebWrangler** project will be documented in this file.

## [Unreleased]
### Changed
- Tightened shared Electron IPC typing between the main process, preload bridge, and renderer.
- Simplified catalog install-state tracking so installed apps are derived from persisted app URLs.
- Removed the GitHub Actions CI workflow in favor of local verification commands.
- Added local release and packaging ergonomics with `npm run verify`, `npm run pack`, `npm run release:check`, and a `Makefile`.

## [1.1.0] — 2026-03-22
### Added
- **Premium "Neon Cyber-Goth" Aesthetic**: Complete visual overhaul with glassmorphism and advanced neon glow effects.
- **Native Ad-blocking**: Integrated the Ghostery engine into Electron sessions.
- **Universal Dark Mode**: Localized DarkReader injection for all guest applications.
- **Smart Catalog Fallbacks**: Branded letter icons for apps missing remote favicons.
- **Comprehensive Documentation**: Added a technical build guide, a case study, and standardized repo files (README, CONTRIBUTING, LICENSE).

### Fixed
- **Rendering Resilience**: Implemented a fallback mechanism to load production assets if the Vite dev server is unreachable.
- **MacOS Branding**: Fixed app name display and high-DPI tray icon resolution.
- **ASAR Pathing**: Resolved path resolution issues inside the packaged Mac bundle.
- **Icon Quality**: Replaced low-fidelity JPEGs with premium transparent PNGs and template icons.

## [1.0.0] — 2026-03-20
### Added
- Initial release of WebWrangler.
- Core multi-profile and spaces support.
- Initial app catalog.
- Basic Electron/React architecture.

---
*Project started with passion for the modern web.*
