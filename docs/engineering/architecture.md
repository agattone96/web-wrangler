# Architecture

## Top-Level System Overview

WebWrangler is a local desktop application built with Electron. It has three primary runtime layers:

- Main process: owns persistence, windowing, IPC, request filtering, and app lifecycle.
- Preload scripts: expose a narrow renderer API and relay dark-mode control into guest pages.
- Renderer process: React-based dashboard for managing installed web apps and settings.

There is no first-party backend service in the repository.

## Major Components

### Main Process

Key modules:

- [`src/main/index.ts`](/Users/allisongattone/web-wrangler/src/main/index.ts): app bootstrap, IPC handlers, menu, tray, CSP, single-instance lock
- [`src/main/db.ts`](/Users/allisongattone/web-wrangler/src/main/db.ts): SQLite schema, migrations, seed data, persistence helpers
- [`src/main/window-manager.ts`](/Users/allisongattone/web-wrangler/src/main/window-manager.ts): guest-window lifecycle and per-window runtime settings
- [`src/main/adblocker.ts`](/Users/allisongattone/web-wrangler/src/main/adblocker.ts): Ghostery-backed guest-session blocker with static-filter fallback
- [`src/main/request-filter.ts`](/Users/allisongattone/web-wrangler/src/main/request-filter.ts): static tracker/ad domain fallback filter
- [`src/main/app-settings-runtime.ts`](/Users/allisongattone/web-wrangler/src/main/app-settings-runtime.ts): classification of live vs reopen-required settings
- [`src/main/store.ts`](/Users/allisongattone/web-wrangler/src/main/store.ts): Electron-store persistence for last opened app sessions

### Preload Layer

- [`src/preload/index.ts`](/Users/allisongattone/web-wrangler/src/preload/index.ts): exposes trusted IPC bridge as `window.api`
- [`src/preload/app-preload.ts`](/Users/allisongattone/web-wrangler/src/preload/app-preload.ts): guest-page dark-mode event bridge
- [`src/preload/dark-mode.ts`](/Users/allisongattone/web-wrangler/src/preload/dark-mode.ts): DarkReader setup helper used by guest pages

### Renderer

- [`src/renderer/App.tsx`](/Users/allisongattone/web-wrangler/src/renderer/App.tsx): bootstrap and modal composition
- [`src/renderer/store.ts`](/Users/allisongattone/web-wrangler/src/renderer/store.ts): Zustand app state
- Component modules under `src/renderer/components`: app grid, settings, catalog, spaces, profiles, title bar, sidebar

## Runtime Boundaries

- Renderer cannot access Node.js APIs directly because `nodeIntegration` is disabled.
- Renderer talks to main only through `window.api`, provided by a context-isolated preload.
- Guest windows are sandboxed and use a dedicated preload separate from the dashboard preload.
- Persistence is local: SQLite plus Electron store.

## Data Flow

### Dashboard Bootstrap

1. App ready event initializes DB and handlers.
2. Main window loads renderer.
3. Renderer calls `listApps`, `listSpaces`, and `getGlobalSettings` through preload IPC.
4. Returned data is stored in Zustand and used to render the dashboard.

### Install App

1. Renderer submits add-app or catalog install request.
2. IPC handler creates an `App` record with UUID and timestamp.
3. DB inserts the app and its default settings row.
4. Main creates a default `Profile`.
5. Favicon fetch runs asynchronously; successful result updates the app record.
6. Renderer app state is updated with the returned app.

### Open Guest App

1. Renderer invokes `openApp(appId, profileId)`.
2. Main resolves persisted app metadata and profile.
3. Window manager derives deterministic session partition and window-state key.
4. Guest `BrowserWindow` is created or existing window is focused.
5. On page load completion, settings such as zoom, dark mode, custom CSS, and custom JS are applied.
6. Main notifies the renderer that the app is open.

### Update Settings

1. Renderer saves app settings.
2. Main classifies changed fields using `getAppSettingsUpdateResult`.
3. DB persists the settings.
4. If any live-applicable fields changed, open windows for that app are updated in place.
5. Renderer displays reopen-required field warnings when needed.

## Control Flow

### App Startup

1. Acquire single-instance lock.
2. On `app.whenReady()`, initialize DB, IPC, custom protocol, CSP, menu, and main window.
3. Restore last-opened app windows from Electron store.
4. Reconcile tray state from global settings.

### App Shutdown

1. Persist main-window bounds if available.
2. Enumerate open guest windows.
3. Save `{appId, profileId}` pairs to Electron store as `lastOpenedApps`.

## Integration Points

- Electron IPC between renderer and main.
- SQLite via `better-sqlite3`.
- Electron session partitions for guest app isolation.
- Remote websites loaded directly in guest windows.
- Remote favicon sources fetched through the app.
- DarkReader JS bundled locally and injected into guest pages.

## Critical Operation Sequences

### Sequence: Guest Window Creation

1. Resolve app/profile.
2. Build session partition as `persist:${appId}-${profileId}`.
3. Create sandboxed guest window with `app-preload.js`.
4. Optionally enable Ghostery-backed blocking for the guest session, with static filtering as fallback, plus proxy/user agent settings.
5. Load guest URL.
6. On finish, apply zoom, DarkReader, custom CSS, and custom JS.

### Sequence: Space Deletion

1. Renderer requests deletion.
2. Main rejects deletion for `default`.
3. DB reassigns any apps in the deleted space to `default`.
4. DB removes the old space.
5. Renderer removes space from local UI state.

## Failure Surfaces

- Renderer bootstrap can fail if IPC or DB access fails.
- Guest site loading can fail due to network errors or bad URLs.
- Injected JS/CSS may break remote pages.
- Request filtering may interfere with legitimate site behavior.
- Persisted but unenforced settings create architecture/documentation drift.
- CSP for the main renderer is permissive relative to Electron hardening best practices.

## Architectural Constraints

- The renderer origin must remain stable enough for IPC sender validation.
- Database schema is initialized in-process without a separate migration framework.
- The app assumes local durability and does not model sync conflicts because there is no backend.
- Window identity is tied to `appId::profileId`; changing that key scheme is a compatibility-sensitive data-model change.
