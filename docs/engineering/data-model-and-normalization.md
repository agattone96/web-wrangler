# Data Model And Normalization

## Persistence Summary

WebWrangler persists state in two local stores:

- SQLite database `apps.db` in Electron `userData`
- Electron store for lightweight process/session restoration metadata

The SQLite schema is defined in [`src/main/db.ts`](/Users/allisongattone/web-wrangler/src/main/db.ts).

## Primary Entities

## `spaces`

Purpose:

- User-defined grouping for installed apps

Fields:

- `id` `TEXT PRIMARY KEY`
- `name` `TEXT NOT NULL`
- `color` `TEXT NOT NULL`
- `icon` `TEXT NOT NULL`
- `sort_order` `INTEGER NOT NULL`

Rules:

- Default record `id='default'` is seeded automatically.
- Deleting `default` is disallowed.
- Deleting any other space reassigns dependent apps to `default`.

## `apps`

Purpose:

- Installed website metadata

Fields:

- `id` `TEXT PRIMARY KEY`
- `name` `TEXT NOT NULL`
- `url` `TEXT NOT NULL`
- `icon_path` `TEXT NULL`
- `space_id` `TEXT NULL`
- `created_at` `INTEGER NOT NULL`

Relationships:

- `space_id` references `spaces(id)` with `ON DELETE SET NULL`, though application logic reassigns to `default` before deleting a non-default space.

Rules:

- One app row is created per installation.
- A default app-settings row is inserted immediately after app insert.
- A default profile is created immediately after app insert.

## `profiles`

Purpose:

- Local identity for app-specific session isolation

Fields:

- `id` `TEXT PRIMARY KEY`
- `app_id` `TEXT NOT NULL`
- `name` `TEXT NOT NULL`
- `color` `TEXT NOT NULL`
- `created_at` `INTEGER NOT NULL`

Relationships:

- `app_id` references `apps(id)` with `ON DELETE CASCADE`

Rules:

- Profiles are scoped to a single app.
- The first profile created at install time is `Default`.
- Session partitions are keyed by both app ID and profile ID.

## `app_settings`

Purpose:

- Per-app behavioral configuration

Fields:

- `app_id` `TEXT PRIMARY KEY`
- `zoom_level` `REAL NOT NULL`
- `dark_mode` `INTEGER NOT NULL`
- `block_ads` `INTEGER NOT NULL`
- `custom_css` `TEXT NOT NULL`
- `custom_js` `TEXT NOT NULL`
- `user_agent` `TEXT NOT NULL`
- `open_at_login` `INTEGER NOT NULL`
- `notifications` `INTEGER NOT NULL`
- `proxy_url` `TEXT NOT NULL`

Relationships:

- `app_id` references `apps(id)` with `ON DELETE CASCADE`

Rules:

- One settings row per app.
- Boolean values are serialized as `0/1` in SQLite and projected as booleans in TypeScript.
- Some fields are currently persisted only and not runtime-enforced, including `open_at_login` and `notifications`.

## `catalog`

Purpose:

- Seeded installable-app catalog bundled in local code

Fields:

- `id` `TEXT PRIMARY KEY`
- `name` `TEXT NOT NULL`
- `url` `TEXT NOT NULL`
- `icon_url` `TEXT NOT NULL`
- `category` `TEXT NOT NULL`
- `description` `TEXT NOT NULL`

Rules:

- Seeded only if empty.
- Search and category filters are performed locally against SQLite.
- The catalog is source-derived from code, not downloaded from a remote service.

## `global_settings`

Purpose:

- Application-wide behavioral settings

Storage model:

- Key-value table with JSON-serialized values

Canonical keys from `DEFAULT_GLOBAL_SETTINGS`:

- `blockAdsGlobal`
- `darkModeGlobal`
- `enableAppLock`
- `lockPin`
- `lockTimeout`
- `runInBackground`
- `showInMenuBar`
- `theme`

Rules:

- Defaults are seeded with `INSERT OR IGNORE`.
- Settings are updated as independent key/value records.
- `lockPin` is stored as plain serialized string in current implementation.

## `window_states`

Purpose:

- Remember geometry for the main dashboard and guest windows

Fields:

- `key` `TEXT PRIMARY KEY`
- `x` `INTEGER NULL`
- `y` `INTEGER NULL`
- `width` `INTEGER NOT NULL`
- `height` `INTEGER NOT NULL`

Canonical keys:

- `main` for the dashboard window
- `${appId}::${profileId}` for guest app windows

## Electron Store Schema

Current store keys from [`src/main/store.ts`](/Users/allisongattone/web-wrangler/src/main/store.ts):

- `lastOpenedApps`: array of `{ appId, profileId }`
- `windowBounds`: legacy/lightweight bounds object

Note:

- `windowBounds` in Electron store appears secondary to the SQLite `window_states` table for active runtime behavior. This should be treated as legacy or unused until confirmed otherwise.

## Normalization Rules

- App metadata is normalized into `apps`; per-app mutable behavior is split into `app_settings`.
- Profiles are normalized into a separate table to allow multiple session identities per app.
- Spaces are normalized into a separate table and referenced by apps.
- Global settings are denormalized into key/value records rather than a fixed single-row table.

## Canonical IDs And Keys

- `app.id`, `profile.id`, and non-default `space.id` are UUIDs.
- Catalog IDs are stable string literals defined in source code.
- Window-state identity is deterministic and derived, not randomly generated.
- Session-partition identity is `persist:${appId}-${profileId}`.

## Source Vs Derived Data

Source data:

- User-entered app name and URL
- User-created spaces and profiles
- Stored settings and timestamps
- Seeded catalog entries from source code

Derived data:

- `icon_path` from favicon fetch
- Window state derived from Electron bounds at close time
- `reopenRequiredFields` from `getAppSettingsUpdateResult`
- App open/closed indicators in renderer store

## Immutable Vs Mutable Fields

Effectively immutable after creation:

- `apps.id`
- `profiles.id`
- `profiles.app_id`
- `spaces.id`
- `apps.created_at`
- `profiles.created_at`
- `catalog.id`

Mutable:

- App name, URL, icon path, and space assignment
- Space name/color/icon/sort order
- Profile name/color
- App settings and global settings
- Window state rows

## Versioning Rules

- Schema evolution is handled inline in `migrate()` without an explicit numbered migration system.
- There is no versioned export/import format in the repository.
- Because migrations are implicit, any future schema changes must preserve backward compatibility or add explicit migration guards.

## Deduplication And Conflict Handling

- No database uniqueness rule prevents installing the same URL multiple times.
- Catalog UI prevents duplicate add actions in the current view by comparing installed URLs in memory, but this is a UI guard, not a DB constraint.
- There is no sync conflict model because the app is local-only.

## Serialization Notes

- Booleans in SQLite are encoded as integers.
- Global settings values are JSON-serialized strings.
- Window coordinates allow `NULL` for platform-managed placement.
- Session partition and window-state keys are string-derived and must remain stable for restore behavior.
