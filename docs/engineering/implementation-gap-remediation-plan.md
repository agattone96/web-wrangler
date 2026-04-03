# Implementation Gap Remediation Plan

## Purpose

This document converts the current repository drift between claimed capabilities and actual runtime behavior into a concrete patch plan that can be executed, reviewed, and tracked in GitHub.

Primary evidence:

- [README.md](/Users/allisongattone/web-wrangler/README.md)
- [docs/product/prd.md](/Users/allisongattone/web-wrangler/docs/product/prd.md)
- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [src/main/window-manager.ts](/Users/allisongattone/web-wrangler/src/main/window-manager.ts)
- [src/main/adblocker.ts](/Users/allisongattone/web-wrangler/src/main/adblocker.ts)
- [src/main/request-filter.ts](/Users/allisongattone/web-wrangler/src/main/request-filter.ts)
- [src/main/db.ts](/Users/allisongattone/web-wrangler/src/main/db.ts)
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [src/renderer/components/AppSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AppSettingsModal.tsx)
- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts)

## Scope

This plan covers features and functions that are currently one of:

- claimed in docs or UI copy but not implemented
- persisted in state/DB but not enforced at runtime
- exposed through IPC/API but not wired to renderer flows

This plan does not assume all gaps should be implemented. For some items, the correct fix is to remove or downgrade the claim.

## Audit Summary

The current gaps fall into three categories:

1. Product claims that exceed runtime behavior
2. Stored settings that have no enforcement path
3. Exposed API surfaces with no active UI workflow

Confirmed gaps:

- Ghostery-backed ad blocking is claimed, but runtime uses a static request filter
- App lock settings exist, but there is no lock/unlock flow
- Lock timeout is stored, but there is no inactivity enforcement
- Global defaults for ad blocking and dark mode are claimed for new apps, but app creation does not read them
- Theme is stored, but there is no renderer or native theme application
- Per-app notifications are stored and surfaced, but there is no permission mediation or enforcement
- Open-at-login exists in types/persistence, but there is no UI control and no OS integration
- `updateApp`, `updateProfile`, and `updateSpace` are exposed through preload/IPC, but there is no current renderer edit flow
- `SEARCH_CATALOG` is declared but unused

## Decision Framework

Each gap should be resolved using exactly one of these strategies:

### Strategy A: Implement

Use this when the feature materially improves the product and the repo already contains enough design signal to support it safely.

### Strategy B: De-scope

Use this when the feature is not ready, creates trust/security ambiguity, or would expand scope beyond current product intent.

### Strategy C: Preserve as internal-only

Use this when the surface is useful for future work, but should not be exposed to users or represented as a shipped feature yet.

## Recommended Product Decisions

Recommended decisions for this repository state:

| Gap | Recommended decision | Rationale |
| --- | --- | --- |
| Ghostery ad blocking | Implement | Existing dependency and helper already exist; user-facing claim already present |
| App lock | De-scope now, implement later only with explicit UX | High trust and lifecycle complexity; current repo has no lock screen foundation |
| Lock timeout | De-scope with app lock | No safe standalone value without real lock enforcement |
| Global ad-block default | Implement | Small, low-risk, aligns with current settings model |
| Global dark-mode default | Implement | Small, low-risk, aligns with current settings model |
| Theme | Implement minimally or remove UI until implemented | Current control is misleading |
| Notifications control | De-scope now or relabel as stored-only | Requires permission mediation design; current UI over-promises |
| Open at login | De-scope now | OS-specific behavior and current UI is incomplete |
| Edit IPC surfaces | Keep internal-only until UI exists | Not a user trust issue, but should not be described as an active feature |
| `SEARCH_CATALOG` constant | Remove or wire to existing list query | Dead interface surface |

## Delivery Strategy

Implement this work in three tracks:

1. Truth-alignment patch
2. Low-risk capability patch
3. High-risk deferred feature cleanup

The truth-alignment patch should land first. It reduces user-facing drift immediately and lowers the chance of shipping more misleading behavior while implementation work is ongoing.

## Patch Sequence

### Phase 0: Truth-Alignment Patch

Goal:

- Make docs and UI accurately describe current behavior before deeper runtime changes land

Files to update:

- [README.md](/Users/allisongattone/web-wrangler/README.md)
- [docs/product/prd.md](/Users/allisongattone/web-wrangler/docs/product/prd.md)
- [docs/product/scope-and-non-goals.md](/Users/allisongattone/web-wrangler/docs/product/scope-and-non-goals.md)
- [docs/product/onboarding-and-permission-flow.md](/Users/allisongattone/web-wrangler/docs/product/onboarding-and-permission-flow.md)
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [src/renderer/components/AppSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AppSettingsModal.tsx)

Changes:

- Replace Ghostery-specific product wording with either:
  - “tracker/ad blocking” until Ghostery wiring lands, or
  - keep Ghostery wording only if Phase 1 ships in the same release
- Add “stored only / not yet enforced” language for:
  - app lock
  - lock timeout
  - notifications
  - open at login
- Remove or hide controls that are not intended to ship soon:
  - app lock
  - lock timeout
  - theme
  - notifications
  - open at login
- Remove the “default for new apps” wording unless Phase 2 ships in the same release

Acceptance criteria:

- No user-facing copy claims Ghostery unless Ghostery is active in runtime
- No visible setting claims enforcement that the code does not perform
- Documentation and UI language agree

Risk:

- Low

Rollback:

- Revert the copy-only/UI-hiding patch

Validation commands:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

Expected result:

- Build succeeds
- Settings modals render without removed/deferred claims

### Phase 1: Wire Ghostery as the Runtime Ad-Blocking Path

Goal:

- Replace the current static request filter path with the Ghostery-backed blocker already present in the repository

Target files:

- [src/main/adblocker.ts](/Users/allisongattone/web-wrangler/src/main/adblocker.ts)
- [src/main/window-manager.ts](/Users/allisongattone/web-wrangler/src/main/window-manager.ts)
- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [src/main/request-filter.ts](/Users/allisongattone/web-wrangler/src/main/request-filter.ts)
- [docs/engineering/architecture.md](/Users/allisongattone/web-wrangler/docs/engineering/architecture.md)
- [docs/qa/acceptance-tests.md](/Users/allisongattone/web-wrangler/docs/qa/acceptance-tests.md)

Implementation tasks:

1. Change guest window startup to call `setupAdblocker(sess)` instead of `setupRequestFilter(sess)` when `settings.blockAds` is true.
2. Decide whether `session.defaultSession` should receive Ghostery as well.
   Current recommendation:
   - do not enable on the main dashboard session unless there is a demonstrated need
   - keep dashboard network behavior simpler than guest app behavior
3. Add a disable path for toggling ad blocking off on already-open sessions.
   Current `reloadAppSettings()` only enables filtering when true and does nothing when false.
4. Keep [src/main/request-filter.ts](/Users/allisongattone/web-wrangler/src/main/request-filter.ts) only as:
   - a fallback path if Ghostery initialization fails, or
   - dead code to remove in a follow-up cleanup
5. Update README and architecture docs to match the chosen runtime path exactly.

Design notes:

- Session-level blocker initialization should remain idempotent
- Failed Ghostery initialization should log and optionally fall back to the existing static filter
- The implementation should not register duplicate request handlers on repeated setting reloads

Acceptance criteria:

- Enabling `blockAds` activates Ghostery-backed session blocking for newly opened app windows
- Disabling `blockAds` stops session blocking for already-open app windows or clearly requires reopen
- README and architecture docs no longer contradict runtime behavior

Risk:

- Medium

Rollback:

- Revert Ghostery wiring and restore static filter path

Validation:

```bash
npm run verify
```

Manual validation:

1. Open a test site with obvious third-party trackers in a guest window.
2. Confirm requests are blocked with ad blocking on.
3. Disable ad blocking and confirm either:
   - blocking stops live, or
   - UI states that reopen is required and reopen restores unblocked behavior.

### Phase 2: Make Global Defaults Actually Apply to New Apps

Goal:

- Honor `blockAdsGlobal` and `darkModeGlobal` during app installation

Target files:

- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [src/main/db.ts](/Users/allisongattone/web-wrangler/src/main/db.ts)
- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts)
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [docs/qa/acceptance-tests.md](/Users/allisongattone/web-wrangler/docs/qa/acceptance-tests.md)

Implementation tasks:

1. On `INSTALL_APP`, read global settings before or immediately after `insertApp`.
2. Override the new app’s default `app_settings` row with:
   - `blockAds = blockAdsGlobal`
   - `darkMode = darkModeGlobal`
3. Keep these as one-time defaults only.
   They should not retroactively mutate existing app settings.
4. Confirm the UI copy “Default for new apps” is now accurate.

Preferred implementation shape:

- Keep schema defaults as stable fallback values
- Apply global-derived overrides in install flow rather than changing DB schema defaults dynamically

Acceptance criteria:

- New app installs inherit current global defaults
- Existing apps remain unchanged
- Reinstalling or adding new apps after defaults change reflects the new defaults

Risk:

- Low

Rollback:

- Revert install-time override logic

Validation:

```bash
npm run verify
```

Manual validation:

1. Enable global ad block and dark mode defaults.
2. Install a new app.
3. Confirm new app settings reflect those defaults.
4. Confirm a previously installed app remains unchanged.

### Phase 3: Resolve Theme Drift

Goal:

- Either implement a real app theme switch or remove the control until the feature exists

Recommendation:

- Implement the minimal real feature rather than keep a dead control

Target files:

- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [src/renderer/App.tsx](/Users/allisongattone/web-wrangler/src/renderer/App.tsx)
- [src/renderer/index.css](/Users/allisongattone/web-wrangler/src/renderer/index.css)
- optionally [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts) if native theme integration is added

Implementation tasks:

1. Define a renderer theme application strategy:
   - `data-theme` attribute on root element, or
   - body/root CSS class
2. Implement `system`, `light`, and `dark` behavior.
3. If using `system`, either:
   - rely on `prefers-color-scheme`, or
   - expose native theme state from Electron if needed
4. Ensure existing design tokens have both light and dark values.
5. Persisted theme should apply on bootstrap before the user opens the settings modal.

Acceptance criteria:

- Changing theme changes visible renderer styling
- Theme persists across restarts
- `system` follows OS/browser color preference in a deterministic way

Risk:

- Medium

Rollback:

- Hide theme controls and treat theme as internal-only state

Validation:

```bash
npm run verify
```

Manual validation:

1. Switch among `system`, `light`, and `dark`.
2. Restart the app.
3. Confirm the selected theme still applies.

### Phase 4: Remove or Reframe Stored-Only Enforcement Controls

Goal:

- Stop shipping controls that imply security or OS enforcement the app does not provide

Target files:

- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [src/renderer/components/AppSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AppSettingsModal.tsx)
- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts)
- [docs/product/scope-and-non-goals.md](/Users/allisongattone/web-wrangler/docs/product/scope-and-non-goals.md)
- [docs/product/prd.md](/Users/allisongattone/web-wrangler/docs/product/prd.md)

Recommended action:

- Remove or hide the following controls from the current UI:
  - `Enable App Lock`
  - `PIN`
  - `Lock Timeout`
  - `Notifications`
- Leave persistence fields in types/DB only if they are intentionally reserved for future work

Optional interim alternative:

- Keep controls visible, but label them `Not yet enforced`

Why removal is preferred:

- Security-adjacent UI that does nothing is worse than not having the feature
- Notifications are especially misleading because users expect an allow/deny toggle to have real effect

Acceptance criteria:

- No setting in the shipped UI implies enforcement without a real code path behind it

Risk:

- Low

Rollback:

- Restore controls with explicit “not yet enforced” copy

Validation:

```bash
npm run verify
```

### Phase 5: Decide the Fate of Open-at-Login

Goal:

- Either implement true OS login-item behavior or fully remove the dormant surface

Current recommendation:

- Defer implementation and remove references from active UI and docs now

If implemented later, target files likely include:

- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [src/main/db.ts](/Users/allisongattone/web-wrangler/src/main/db.ts)
- [src/renderer/components/AppSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AppSettingsModal.tsx)

Implementation notes for future work:

- Per-app open-at-login is a product decision, not just an Electron API call
- The app currently restores prior open app/profile windows globally from Electron store
- A future implementation must define:
  - whether login launch opens the dashboard, last session, or app-specific windows
  - whether this is global or per-app
  - how macOS, Windows, and Linux behavior differ

Acceptance criteria if deferred:

- No active UI suggests open-at-login is supported
- Docs treat it as future work only

## Deferred High-Risk Work

These items should not be patched opportunistically in the same branch as low-risk cleanup.

### Deferred: App Lock

Why deferred:

- Requires security-sensitive UX and lifecycle design
- Needs decisions about:
  - when the lock is checked
  - whether guest windows are blocked too
  - whether lock applies after sleep/background/minimize
  - how `runInBackground` interacts with lock state
  - whether the PIN is stored plaintext, hashed, or in OS keychain

Minimum acceptable future design:

1. Replace plaintext PIN persistence with a safer storage model
2. Add a real lock screen in renderer or a dedicated gated window
3. Enforce lock on startup and after timeout
4. Define behavior for guest windows while locked
5. Add failure and recovery flow

Recommendation:

- Treat this as a separate milestone, not a patch cleanup item

### Deferred: Notification Permission Enforcement

Why deferred:

- Requires explicit policy for website permissions
- The app currently does not centralize `setPermissionRequestHandler`

Minimum acceptable future design:

1. Define policy for website notification requests
2. Implement session-level permission mediation
3. Decide whether the app setting acts as:
   - hard deny
   - allow list
   - UI prompt suppression
4. Update onboarding and trust docs

Recommendation:

- Remove or relabel the current UI control now
- Implement later only with a permission policy document

## API/Dead Surface Cleanup

These are worthwhile cleanup tasks after user-facing drift is resolved.

### Cleanup A: Remove or Use `SEARCH_CATALOG`

Target:

- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts)

Action:

- Remove `SEARCH_CATALOG` if `LIST_CATALOG` with query object remains the supported path

### Cleanup B: Review dormant edit IPC surfaces

Targets:

- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts)
- [src/preload/index.ts](/Users/allisongattone/web-wrangler/src/preload/index.ts)
- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)

Actions:

- Keep `updateApp`, `updateProfile`, and `updateSpace` only if near-term UI work will use them
- Otherwise document them as internal-ready but not currently surfaced

## Suggested GitHub Issue Breakdown

Create separate issues or PRs using this sequence:

1. `docs/ui: remove misleading implementation claims`
2. `main: wire Ghostery blocker into guest session runtime`
3. `main/db: apply global defaults to new app settings`
4. `renderer: implement actual dashboard theme switching`
5. `renderer: remove stored-only enforcement controls`
6. `cleanup: remove dead catalog IPC and review dormant edit APIs`
7. `design: app lock architecture and secure PIN storage`
8. `design: website permission mediation for notifications/camera/microphone`

## Suggested PR Slices

Keep the PRs small and reversible.

### PR 1

- Docs/UI truth alignment only

### PR 2

- Ghostery wiring only

### PR 3

- Global defaults only

### PR 4

- Theme implementation or theme removal only

### PR 5

- Stored-only settings cleanup only

## Test Plan Additions

Add or update acceptance coverage in [docs/qa/acceptance-tests.md](/Users/allisongattone/web-wrangler/docs/qa/acceptance-tests.md) for:

- Ghostery as active runtime ad blocker
- global defaults applying only to newly installed apps
- theme persistence and application
- absence of misleading settings in shipped UI

Add targeted automated coverage where feasible:

- unit tests for install-time derivation of app defaults
- unit tests for ad-blocker enable/disable decision logic
- renderer tests for theme bootstrapping if the project later adds component test infrastructure

## Risk Register

| Area | Risk | Level | Mitigation |
| --- | --- | --- | --- |
| Ad blocker wiring | Ghostery changes site behavior or duplicates handlers | Medium | Add idempotent enable/disable flow and manual regression checks |
| Theme implementation | Existing neon styling may not have light-theme token coverage | Medium | Start with a minimal two-token mode or hide feature until complete |
| App lock | Security theater if partially implemented | High | Keep deferred; do not ship partial enforcement |
| Notifications | Misleading permission semantics | High | Remove/relabel until real mediation exists |
| Open at login | Platform divergence and unclear product behavior | Medium | Defer and de-scope from active UI |

## Completion Definition

This remediation effort is complete when all of the following are true:

- No shipped UI control implies enforcement without a real implementation path
- No top-level doc claims Ghostery if Ghostery is not the runtime blocker
- New app installs honor global defaults if those controls remain visible
- Theme either works end-to-end or is not exposed
- Deferred features are clearly documented as deferred, not partially shipped
- Dead API/IPC surfaces are either removed or documented as internal-only

## Recommended First Milestone

The highest-value first milestone is:

1. remove misleading UI/docs claims
2. wire Ghostery
3. make global defaults actually apply to new installs

That milestone closes the most visible trust gaps without taking on the security and lifecycle complexity of app lock or permission enforcement.
