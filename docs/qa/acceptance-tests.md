# Acceptance Tests

This suite maps to the requirements documented in [`docs/product/prd.md`](/Users/allisongattone/web-wrangler/docs/product/prd.md). Tests are written as implementation-facing acceptance criteria and can be used for manual QA or future automated coverage.

## Environment Preconditions

- App built and launchable through `npm run dev` or a packaged build.
- Fresh or controlled `userData` directory available for first-run checks.
- Network access available for guest-site and favicon-related tests when required.

## Happy Path Tests

### AT-01 First Run Seeds Core Data

Requirement mapping:

- PRD functional requirements: local persistence, default space, default global settings, seeded catalog

Steps:

1. Start the app with an empty `userData` directory.
2. Open the dashboard.
3. Inspect the spaces list and catalog browser.

Pass:

- Space `Main` exists with ID `default`.
- Global settings are readable without error.
- Catalog contains seeded entries such as Gmail, Slack, and Notion.

Fail:

- App crashes during bootstrap, or default records are missing.

### AT-02 Add App By URL

Requirement mapping:

- PRD core journey 2, install functional requirement

Steps:

1. Open Add App.
2. Enter name `Example`.
3. Enter URL `example.com`.
4. Submit.

Pass:

- App is created successfully.
- Stored URL is normalized to `https://example.com`.
- App appears in the dashboard.
- A default profile exists for the app.

Fail:

- URL is stored malformed, or no profile is created.

### AT-03 Install From Catalog

Requirement mapping:

- PRD core journey 1

Steps:

1. Open Catalog.
2. Add an item not yet installed.

Pass:

- App appears in the dashboard.
- Re-adding the same catalog entry is disabled in the current UI view.

Fail:

- Add action silently fails or duplicates appear immediately in the same view.

### AT-04 Launch Uses Isolated Window

Requirement mapping:

- PRD launch and session isolation requirements

Steps:

1. Install an app.
2. Open it from its default profile.
3. Open it again from the same profile.

Pass:

- First action opens a guest window.
- Second action focuses the same window instead of creating a duplicate.

Fail:

- Duplicate windows are created for the same app/profile pair.

### AT-05 Persist Window State

Requirement mapping:

- PRD success criterion for window persistence

Steps:

1. Resize and move the main window.
2. Resize and move an app window.
3. Close the app fully and relaunch.

Pass:

- Main window reopens at the saved bounds.
- App window reopens at the saved bounds when restored.

Fail:

- Bounds reset unexpectedly.

## Settings And Behavior Tests

### AT-06 Live Settings Apply Without Reopen

Requirement mapping:

- PRD settings journey, live-update behavior

Steps:

1. Open an app window.
2. Change `zoomLevel`, `darkMode`, or `customCss`.
3. Save settings.

Pass:

- The open window reflects the applicable change without being manually reopened.
- No reopen-required warning is shown for only those fields.

Fail:

- Change is not applied or incorrectly requires reopen.

### AT-07 Reopen-Required Settings Are Disclosed

Requirement mapping:

- PRD settings journey and partial implementation disclosure

Steps:

1. Open app settings.
2. Change `proxyUrl` or `userAgent`.
3. Save settings.

Pass:

- UI displays a reopen-required notice naming the affected fields.
- Current open window does not falsely claim live application.

Fail:

- No notice appears, or UI claims live application for reopen-only fields.

### AT-08 Global Tray Setting Reconciles Tray Visibility

Requirement mapping:

- PRD global settings persistence and behavior

Steps:

1. Open Global Settings.
2. Toggle `Show in Menu Bar`.
3. Save.

Pass:

- Tray/menu-bar icon is created when enabled and removed when disabled.

Fail:

- Setting persists but tray state does not reconcile.

## Edge Case Tests

### AT-09 Invalid URL Is Rejected

Requirement mapping:

- PRD add-app validation

Steps:

1. Open Add App.
2. Enter invalid URL text that cannot be parsed after normalization.
3. Submit.

Pass:

- Inline error is shown.
- No app record is created.

Fail:

- Invalid app is persisted or no feedback is given.

### AT-10 Deleting Non-Default Space Reassigns Apps

Requirement mapping:

- PRD/manage spaces requirement

Steps:

1. Create a new space.
2. Add an app to that space.
3. Delete the space.

Pass:

- Space is removed.
- App remains installed and is reassigned to `Main`.

Fail:

- App is orphaned, deleted, or assigned to an invalid space.

### AT-11 Default Space Cannot Be Deleted

Requirement mapping:

- Data-model invariant for `default` space

Steps:

1. Open space manager.
2. Attempt to delete `Main`.

Pass:

- Delete control is disabled or deletion is prevented with messaging.

Fail:

- Default space is deleted.

## Permission Failure Tests

### AT-12 Unauthorized IPC Calls Are Rejected

Requirement mapping:

- PRD IPC sender validation requirement

Steps:

1. Attempt to invoke a main-process handler from an unapproved renderer origin or synthetic harness.

Pass:

- Main process rejects the call with `Unauthorized IPC call`.

Fail:

- Unauthorized origin can mutate or read privileged state.

### AT-13 Guest Website Permission Requests Follow Explicitly Documented Behavior

Requirement mapping:

- Onboarding/permission-flow document

Steps:

1. Launch a site that requests notifications, camera, or microphone.
2. Observe the permission behavior.

Pass:

- Observed behavior matches the current documented statement: no app-specific mediation is implemented, and handling follows Electron/site defaults unless future code changes this.

Fail:

- Product docs claim a mediated flow that does not exist, or runtime behavior has changed without docs being updated.

## Data Integrity Tests

### AT-14 Delete App Cascades Dependent Records

Requirement mapping:

- Trust model and data-model integrity guarantees

Steps:

1. Install an app.
2. Confirm default profile and app-settings row exist.
3. Delete the app.

Pass:

- App record is deleted.
- Dependent profile and app-settings records are removed.

Fail:

- Orphaned profiles or settings remain.

### AT-15 Last Opened Apps Restore After Restart

Requirement mapping:

- PRD restore success criterion

Steps:

1. Open one or more app windows.
2. Quit the application.
3. Relaunch the application.

Pass:

- Previously open app/profile pairs are restored when their backing app/profile still exists.

Fail:

- Restore data is not saved or is not replayed on startup.

## Regression / Contradiction Checks

### AT-16 Ad-Blocking Documentation Matches Runtime

Requirement mapping:

- Engineering constraints and PRD contradiction handling

Steps:

1. Inspect active ad-blocking runtime path in current code.
2. Compare user-facing product docs to actual behavior.

Pass:

- Documentation describes the current static request filter accurately, and any Ghostery dependency is labeled as present-but-inactive until wired in.

Fail:

- Normative docs still claim Ghostery-backed runtime blocking without code support.

### AT-17 Dormant Settings Are Not Presented As Enforced

Requirement mapping:

- PRD partial implementation requirements

Steps:

1. Review product and onboarding docs.
2. Compare against code usage for `enableAppLock`, `lockPin`, `lockTimeout`, `openAtLogin`, and `notifications`.

Pass:

- Docs clearly state these are stored settings with incomplete or absent enforcement where applicable.

Fail:

- Docs describe these as working end-to-end features.

## Environment / Platform Checks

### AT-18 Verification Pipeline Passes

Requirement mapping:

- Engineering constraints on reproducibility

Steps:

1. Run `npm run verify`.

Pass:

- Lint, tests, typecheck, build, and release-check all pass.

Fail:

- Any stage fails.

### AT-19 Packaged Resources Include Required Assets

Requirement mapping:

- Architecture and compatibility constraints

Steps:

1. Build packaged artifacts.
2. Inspect packaged resources.

Pass:

- `assets/icon.png`, `assets/tray-icon.png`, and `assets/darkreader.js` are included as expected.

Fail:

- Guest dark mode or branded packaging fails due to missing resources.
