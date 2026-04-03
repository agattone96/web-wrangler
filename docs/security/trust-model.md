# Trust Model

## System Trust Boundaries

### Trusted Boundary: Main Process

The Electron main process is the repository's authoritative control plane. It owns:

- Database initialization and all writes to SQLite
- IPC handler registration and sender validation
- BrowserWindow lifecycle for dashboard and guest windows
- Persistent session-partition creation
- Request filtering and settings application

This boundary is trusted to enforce local policy correctly.

### Conditionally Trusted Boundary: Preload Scripts

Preload scripts are bundled with the application and shipped from local code, so they are trusted code. They are also a capability boundary because they expose a curated API from main to renderer and relay dark-mode messages into guest pages.

### Semi-Trusted Boundary: Renderer UI

The dashboard renderer is trusted only when loaded from the approved origin:

- Dev: `http://127.0.0.1:5173` or `app://`
- Prod: `app://`

IPC sender validation in [`src/main/index.ts`](/Users/allisongattone/web-wrangler/src/main/index.ts) relies on this origin check.

### Untrusted Boundary: Guest Websites

Every installed website loaded into a guest window is untrusted application content. Guest sites may:

- Execute their own remote scripts
- Read and mutate their own session storage/cookies within the assigned partition
- Attempt popups or external navigation

The application constrains this boundary by disabling `nodeIntegration`, enabling `contextIsolation`, using a sandboxed `BrowserWindow`, and forcing `window.open` URLs to the external system browser.

### Local Persistence Boundary

The SQLite database, Electron store data, cached favicons, and session partition storage are trusted for durability but must be treated as sensitive local artifacts because they can contain:

- Installed app metadata
- Per-app custom code and proxy values
- Stored PIN configuration values
- Persisted browsing/session state for guest websites

## Actors

- End user: trusted to configure and operate the app locally.
- Application main process: trusted enforcement point.
- Application renderer and preload scripts: trusted code from this repository when loaded from approved origin.
- Guest website operators and scripts: untrusted remote actors.
- Local attacker with filesystem access: partially trusted at best; can read local persistence unless OS protections intervene.

## Sensitive Data Classes

- App metadata: installed app names, URLs, icons, profile names, spaces.
- Session data: cookies and local storage inside persistent guest session partitions.
- Settings data: custom CSS, custom JavaScript, proxy URL, user agent, PIN string, and lock timeout.
- Window restore state: low sensitivity but still user-behavior data.

## Trusted Vs Untrusted Inputs

Trusted:

- Bundled application code
- Values read from local SQLite and Electron store, subject to data integrity of local disk

Untrusted:

- User-entered app URLs
- Remote favicon responses
- All guest website content
- Custom CSS and custom JavaScript entered by the user

## Ingestion Assumptions

- URL normalization and syntax validation happen in renderer before install, but main process does not independently revalidate all fields; this is a trust gap worth preserving in documentation.
- Favicon fetches come from remote app domains and are not guaranteed safe beyond how the helper stores them locally.
- Catalog entries are seeded from local code, not downloaded at runtime.

## Identity / Auth Assumptions

- The product has no first-party user account system.
- Authentication to guest services occurs directly between the user and each remote website within the assigned session partition.
- Profiles represent local session partitions, not authenticated product identities.

## Data Integrity Guarantees

Implemented:

- SQLite foreign keys are enabled.
- App deletion cascades to profiles and app settings.
- Deleting a non-default space reassigns dependent apps to the default space before deletion.
- Window-state keys are deterministic (`main` or `${appId}::${profileId}`).
- Default global settings and the default space are seeded on initialization.

Not guaranteed:

- Cryptographic integrity protection for local data files
- Encrypted-at-rest storage for settings or session partitions
- Server-backed audit logging

## Read-Only Vs Write Behavior

- The dashboard renderer is allowed to request create, update, and delete operations via IPC on local metadata.
- Guest websites are not granted direct write access to the SQLite database or main-process APIs.
- Guest windows may mutate their own website-controlled session data within their session partitions.
- The app writes injected CSS/JS behavior into guest windows at runtime when configured by the user.

## Abuse And Failure Cases

- Malicious website content could exploit the expanded attack surface of `executeJavaScript`, custom injected JS, or weak CSP in the dashboard renderer.
- Incorrect or malicious proxy URLs can reroute guest traffic unexpectedly.
- Static request filtering may block legitimate site functionality or fail to block trackers not on the hard-coded domain list.
- Stored but unenforced security settings can cause users to assume protections exist when they do not.
- A local attacker with disk access can inspect stored settings and persistent session artifacts.

## Privacy / Security Notes

- The project is local-first; there is no first-party backend or telemetry pipeline in evidence.
- Privacy claims should be constrained to "local persistence and no project-defined backend" rather than "comprehensive privacy guarantees."
- The stored app-lock PIN is persisted in plain application settings form; no hashing or secure enclave integration is present in the repository.
- Main renderer CSP currently allows `'unsafe-inline'` and `'unsafe-eval'`, which should be documented as an implementation constraint, not a best-practice posture.

## Needs Confirmation

- Whether website notification, camera, microphone, and clipboard permission requests should be intercepted or delegated entirely to Electron defaults.
- Whether favicons are stored as files under user data or another application path; the current architecture relies on a helper not documented elsewhere.
