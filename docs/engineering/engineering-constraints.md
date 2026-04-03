# Engineering Constraints

## Platform Constraints

- Runtime is Electron `33.x` with desktop packaging targets for macOS, Windows, and Linux.
- The main window enforces minimum dimensions of `900x600`.
- Guest windows enforce minimum dimensions of `600x400`.
- The renderer is expected to load from Vite dev server in development and bundled files in production.
- The main process relies on an `app://` protocol in packaged mode.

## Performance Constraints

- The app is expected to feel responsive with local-only metadata operations; all CRUD operations are synchronous SQLite calls through `better-sqlite3`.
- Window creation must avoid duplicates for the same app/profile pair.
- Settings reapplication should not require app restart for fields classified as live-updatable.
- Catalog search is local SQLite filtering, not remote search.

## Memory / Storage Constraints

- Local storage grows with installed apps, session partitions, injected settings, cached icons, and guest website state.
- Each app/profile pair creates a persistent Electron session partition, which increases disk footprint.
- No retention or cleanup policy for old session partitions is implemented in the repository.

## Dependency Restrictions

- UI stack is React plus vanilla CSS; no utility CSS framework is in use.
- Persistence is local SQLite and Electron store only.
- The repository already depends on Ghostery ad blocker, but runtime currently uses the custom request filter path.
- Added code should preserve Electron hardening defaults already in use: `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`.

## Security / Privacy Restrictions

- Sensitive local data must remain local unless the user explicitly loads a remote site; the repository contains no project-defined outbound sync API.
- Guest websites must not gain direct access to main-process APIs or Node.js runtime.
- Documentation and implementation must not overstate stored-but-unenforced security settings as active controls.
- Any future handling of `lockPin` should avoid storing plaintext if the feature is upgraded from dormant config to enforced security.

## Offline / Network Constraints

- The application shell and local metadata features can operate without a project backend.
- Guest websites and favicon fetching require network access to the target services.
- Ad/tracker blocking behavior depends on local request interception, not a hosted service.
- There is no offline mirror or cached-content subsystem for guest websites.

## Determinism / Reproducibility

- Builds and verification should run through repository scripts: `npm run verify`, `npm run build`, `npm run dist`, or corresponding `make` targets.
- Seeded catalog content is deterministic because it is hard-coded in source.
- Default global settings and default space creation are deterministic on first DB init.
- Window state and restore behavior rely on deterministic key derivation.

## Compatibility Constraints

- IPC sender validation is tied to exact renderer origins; changing dev server origin or production protocol handling requires coordinated updates.
- Session partition key format is a compatibility surface for restoring isolated browser state.
- SQLite schema changes are compatibility-sensitive because migration handling is inline and not versioned.
- Packaged resources must continue to include icons and `darkreader.js` as configured in `package.json`.

## Non-Negotiable Implementation Rules Derived From Repo And Chat Context

- Inspect repository code before changing docs or behavior; do not document speculative features as implemented.
- Prefer minimal, reversible changes to runtime behavior and documentation structure.
- Keep sensitive processing local-only; no external documentation generation services should be involved.
- Preserve timestamps, identifiers, and deterministic relationships in any future data-model changes.
- For non-trivial repo changes, validation should continue to use the existing verification chain in `package.json`.

## Known Constraint Violations / Gaps

- Existing top-level prose describes Ghostery-backed ad blocking, but active runtime code does not use `src/main/adblocker.ts`.
- Existing UI exposes lock, notification, and open-at-login settings without corresponding enforcement code.
- Main renderer CSP currently permits `'unsafe-inline'` and `'unsafe-eval'`, which is a hardening gap relative to stricter Electron guidance.
