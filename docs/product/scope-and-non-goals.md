# Scope And Non-Goals

## In Scope Now

Grounded in current repository behavior, WebWrangler currently covers:

- Desktop application shell for managing installed web apps.
- Local install flows from a seeded catalog or a user-supplied URL.
- Local management of spaces, profiles, app settings, global settings, and window state.
- Launching guest app windows in isolated persistent Electron sessions per app/profile pair.
- Per-app configuration for zoom, dark mode, ad-block toggle, proxy URL, user agent, custom CSS, and custom JavaScript.
- Main dashboard, app catalog, add-app modal, global settings modal, app settings modal, and space/profile management UI.
- Local packaging for macOS, Windows, and Linux using `electron-builder`.

## Explicit Non-Goals

Not evidenced in the current repository, and therefore out of scope for the normative product definition:

- Multi-user accounts or shared tenancy.
- Cloud sync, remote backup, or server-side control planes.
- Browser extension management.
- Enterprise policy administration or centralized device management.
- Native wrappers for site-specific APIs outside what Electron provides generically.
- Mobile or browser-hosted versions of the product.
- Background data ingestion or remote analytics services operated by this project.

## Excluded Features Despite Nearby Signals

The repository contains signs of intended or partially designed features that are not implemented end-to-end and should not be treated as in-scope product commitments:

- Enforced app lock with PIN and lock timeout.
- Open-at-login OS integration.
- App-level notification permission enforcement.
- Ghostery-backed filtering as the active ad-block runtime path.
- Explicit permission orchestration for camera, microphone, or system notifications.

## Boundary Conditions

- The application owns metadata and configuration for installed web apps, but it does not own the guest websites themselves.
- The application can inject CSS, JavaScript, and DarkReader into guest pages, but authentication, page rendering, and remote content behavior remain controlled by each website.
- Session isolation is per app/profile pair, not per space.
- All durable application data is stored locally on the user device.

## Deferred Future Work

Inferred from stored settings, dependencies, and current gaps:

- Wiring stored app-lock settings into a real lock screen and unlock flow.
- Replacing or supplementing the static request filter with the Ghostery integration already present in the codebase.
- Implementing per-app notification/open-at-login behavior beyond persistence.
- Defining explicit handling for website permission prompts and denial/retry flows.
- Adding tests beyond the current narrow helper coverage.

## Documentation Boundary Rule

When future code lands that enforces currently dormant settings or introduces new trust boundaries, this document and the PRD must be updated together. Until then, documentation must treat dormant settings as stored configuration only.
