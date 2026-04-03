# Onboarding And Permission Flow

## Summary

The current product implements a lightweight first-run setup, not a guided onboarding wizard. There is no repository evidence of a dedicated onboarding screen, account creation step, or OS-native permission explainer flow.

## First-Run Experience

Observed first-run behavior from code:

1. Application boot initializes the SQLite database.
2. The system creates the default `Main` space if none exists.
3. The system seeds default global settings if none exist.
4. The system seeds the built-in app catalog if it is empty.
5. The dashboard loads installed apps, spaces, and global settings from main process IPC.
6. The user can immediately add an app manually or from the catalog.

No additional first-run tasks are implemented.

## Required Permissions

### Product-Required Permissions

There are no explicit OS-native permissions requested by WebWrangler itself in this repository as a prerequisite for initial product use.

Required practical capabilities are:

- Local filesystem access available to the packaged application for its own `userData` directory
- Network access for loading remote websites and fetching favicons

### Website-Driven Permissions

Guest websites may independently trigger their own browser-style permission prompts through Electron behavior. The repository does not define central handling for:

- Notifications
- Camera
- Microphone
- Clipboard
- Geolocation

Status: Unknown / Needs confirmation.

## Optional Permissions / Optional Settings

The application exposes optional settings that influence runtime behavior but are not OS permission prompts:

- Show in menu bar
- Run in background
- Global dark mode default
- Global ad-block default
- Per-app proxy URL
- Per-app custom CSS and custom JavaScript

These are user settings, not operating-system permissions.

## Current Setup Flow

### Add App Flow

1. User opens Add App or Catalog.
2. User selects a URL and optional target space.
3. Renderer validates URL format.
4. Main process persists the app and creates a default profile.
5. User can launch the app immediately after install.

### Launch Flow

1. User clicks Open.
2. Main process resolves app and profile.
3. Guest window is created with sandboxed Electron settings and an isolated session partition.
4. Optional per-app runtime changes are applied after page load.

## Permission Failure States

Implemented failure handling is limited:

- Invalid add-app URLs are blocked in renderer with a validation error.
- Unauthorized IPC calls throw `Unauthorized IPC call`.
- Guest-window load failures are logged from Electron events.
- Failed app-window opens are caught and logged.
- Failed DarkReader injection is caught and logged.

Not implemented:

- Custom UI for website permission denial or retry
- Centralized permission rationale copy
- Differentiated handling for OS-specific permission denial
- Recovery flow for disabled notification, camera, or microphone permissions

## Fallback Behavior

Grounded fallbacks:

- In development, if the Vite dev server is unavailable, the app falls back to loading the built renderer file.
- If favicon loading fails, renderer components fall back to a letter avatar.
- If an app-specific window is already open, launching the same app/profile focuses the existing window instead of opening another.

Inferred fallback gap:

- For website permission denial, behavior likely falls back to whatever the remote site or Electron default does, because no app-specific mediation exists.

## User Messaging Requirements

Current code provides only minimal direct messaging:

- Add-app validation errors are shown inline.
- Reopen-required settings are shown in the app settings modal after save.
- Space deletion warns that apps will move to `Main`.
- Default space deletion is blocked with a direct message.

Documentation requirement for future implementation:

- Any future OS permission flow must explicitly distinguish product settings from website-level permissions to avoid implying that WebWrangler is the authority for third-party site access.

## Retry / Recovery Flow

Current implemented recovery patterns:

- User may retry app install after correcting an invalid URL.
- User may reopen an app window to apply reopen-required settings.
- User may relaunch the app to restore previous sessions saved in Electron store.

Missing / Needs confirmation:

- Retry workflow for denied website permissions
- Manual clearing/reset of session partitions
- Resetting all app settings to defaults

## Platform Notes

- macOS has explicit dock icon and hidden inset title-bar handling in code.
- Tray/menu-bar support exists cross-platform through Electron APIs but is presented with macOS wording in UI.
- Packaging targets exist for macOS DMG, Windows NSIS, and Linux AppImage.
- No platform-specific permission request code is implemented in the repository.
