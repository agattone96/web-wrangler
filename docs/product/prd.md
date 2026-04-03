# Product Requirements Document

## Product Summary

WebWrangler is a local-first Electron desktop application for organizing websites as app-like workspaces. Users can install web apps from a built-in catalog or from arbitrary URLs, group them into spaces, maintain multiple profiles per app, and launch each app into an isolated desktop window backed by a dedicated Electron session partition.

Grounded evidence:

- App install, profile, space, and settings CRUD exist in [`src/main/index.ts`](/Users/allisongattone/web-wrangler/src/main/index.ts).
- Per-app session isolation exists in [`src/main/window-manager.ts`](/Users/allisongattone/web-wrangler/src/main/window-manager.ts).
- Local persistence exists in [`src/main/db.ts`](/Users/allisongattone/web-wrangler/src/main/db.ts).

## Problem Being Solved

The project solves the overhead of managing many browser-based tools inside a single general-purpose browser. It provides:

- A persistent desktop catalog of installed web apps.
- Separation of work contexts through app-specific profiles and spaces.
- App-specific window state and behavior controls such as zoom, dark mode, proxy, and custom CSS/JS.
- A local-only storage model without a project-defined backend service.

## Target Users

Supported by the seeded catalog and current UI structure, the target users are people who use many browser-based productivity tools daily:

- Individual users who want standalone desktop windows for services such as Gmail, Slack, Notion, GitHub, Linear, ChatGPT, and similar sites.
- Users who need lightweight separation between contexts such as work vs. personal spaces.
- Users who prefer local-only storage over a synchronized cloud control plane.

Inferred:

- The primary persona is a single-device power user rather than an enterprise admin or team-managed deployment.

## Primary Jobs To Be Done

1. Turn a website into a launchable desktop app entry.
2. Group installed apps into spaces for quicker navigation.
3. Use multiple profiles for the same web app with isolated session storage.
4. Apply per-app runtime settings such as zoom, dark mode, proxy, or injected CSS/JS.
5. Reopen frequently used apps with preserved window state and optionally restore previously open sessions at startup.

## Core User Journeys

### 1. Install From Catalog

1. User opens the catalog browser.
2. User filters or searches the seeded catalog.
3. User adds an app.
4. Main process persists the app, creates default app settings, and auto-creates a default profile.
5. Favicon fetch runs in the background and updates the stored icon path when successful.

### 2. Add Arbitrary Website

1. User opens the Add App modal.
2. User enters name, URL, and target space.
3. Renderer normalizes the URL to `https://` when no scheme is provided and validates URL syntax.
4. Main process stores the app, creates a default profile, and begins favicon fetch.

### 3. Launch App Window

1. User clicks Open on an installed app card.
2. Main process resolves the app and default profile.
3. Window manager creates or focuses an app/profile-specific `BrowserWindow`.
4. A persistent Electron session partition is created for that app/profile pair.
5. Stored app settings are applied at launch or after first page load.

### 4. Tune App Behavior

1. User opens the app settings modal.
2. User updates general or advanced settings.
3. Main process classifies changed fields as live-applicable or reopen-required.
4. Persisted settings are updated.
5. Live-safe settings are re-applied to currently open windows; reopen-required settings are disclosed to the user in the UI.

### 5. Manage Spaces And Profiles

1. User creates or deletes spaces and profiles in UI.
2. Main process persists those records locally.
3. When a non-default space is deleted, affected apps are reassigned to the default space.

## Success Criteria

The codebase supports the following measurable outcomes:

- Installed apps persist across restarts.
- Each app has at least one usable profile after install.
- Launching the same app/profile twice focuses the existing window rather than duplicating it.
- Per-window geometry persists for the main window and each app/profile window.
- Local settings changes persist and are reflected on subsequent launches.
- The app can be developed, verified, packaged, and released with the local scripts defined in `package.json`.

## Functional Requirements

### Required

- The system must store installed apps, profiles, spaces, settings, catalog entries, global settings, and window states in a local SQLite database.
- The system must seed a default space and default global settings on first run.
- The system must expose CRUD operations for apps, profiles, spaces, app settings, and global settings through a preload-mediated IPC API.
- The system must create a default profile when an app is installed.
- The system must isolate browser session data by app/profile pair using persistent session partitions.
- The system must allow installing from a built-in catalog and from arbitrary URLs.
- The system must preserve window bounds for the main window and guest app windows.
- The system must validate IPC callers so only the trusted renderer origin can invoke main-process handlers.

### Deferred / Internal-Only

- The system stores app lock configuration globally, but enforcement logic is not implemented. This remains deferred configuration, not a shipped lock gate.
- The system stores per-app notification and open-at-login settings, but those controls are not part of the shipped UI and have no enforcement path in current runtime code.
- The system exposes `updateApp`, `updateProfile`, and `updateSpace` through preload and IPC, but there is no active renderer editing flow for those operations today.

### Unknown / Needs Confirmation

- Whether guest-window website permission prompts should be centrally allowed, denied, or surfaced by custom application UI.
- Whether packaged production builds are expected to support notarization, code signing, or auto-update.

## Major Risks

- Injected custom JavaScript runs inside guest pages and expands the trust surface.
- The current CSP for the main renderer permits `'unsafe-inline'` and `'unsafe-eval'`, which reduces defense-in-depth.
- The ad-blocking claim in user-facing docs exceeds what runtime code currently guarantees.
- Stored but unenforced settings can create product/documentation drift and false user expectations.
- App/profile session partitions are persistent; sensitive website data remains on disk unless manually cleared or the app data directory is removed.

## Dependencies

- Electron for desktop runtime and multi-process model.
- React and Zustand for renderer UI state.
- better-sqlite3 for local persistence.
- Vite and TypeScript for build workflow.
- electron-builder for packaging.
- `uuid` for app/profile/space identifiers.
- `darkreader` for forced dark mode injection.
- `@ghostery/adblocker-electron`

## Out Of Scope References

- Scope boundaries: [`docs/product/scope-and-non-goals.md`](/Users/allisongattone/web-wrangler/docs/product/scope-and-non-goals.md)
- Trust and security posture: [`docs/security/trust-model.md`](/Users/allisongattone/web-wrangler/docs/security/trust-model.md)
- Architecture details: [`docs/engineering/architecture.md`](/Users/allisongattone/web-wrangler/docs/engineering/architecture.md)
- Data model rules: [`docs/engineering/data-model-and-normalization.md`](/Users/allisongattone/web-wrangler/docs/engineering/data-model-and-normalization.md)
- Acceptance criteria: [`docs/qa/acceptance-tests.md`](/Users/allisongattone/web-wrangler/docs/qa/acceptance-tests.md)
