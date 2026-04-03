# Implementation Gap Remediation Plan

## Purpose

This document turns the current drift between product claims, stored settings, and actual runtime behavior into task-sized implementation work that can be executed in small PRs.

Primary evidence:

- [README.md](/Users/allisongattone/web-wrangler/README.md)
- [docs/product/prd.md](/Users/allisongattone/web-wrangler/docs/product/prd.md)
- [docs/product/scope-and-non-goals.md](/Users/allisongattone/web-wrangler/docs/product/scope-and-non-goals.md)
- [docs/product/onboarding-and-permission-flow.md](/Users/allisongattone/web-wrangler/docs/product/onboarding-and-permission-flow.md)
- [docs/engineering/architecture.md](/Users/allisongattone/web-wrangler/docs/engineering/architecture.md)
- [docs/qa/acceptance-tests.md](/Users/allisongattone/web-wrangler/docs/qa/acceptance-tests.md)
- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [src/main/window-manager.ts](/Users/allisongattone/web-wrangler/src/main/window-manager.ts)
- [src/main/adblocker.ts](/Users/allisongattone/web-wrangler/src/main/adblocker.ts)
- [src/main/request-filter.ts](/Users/allisongattone/web-wrangler/src/main/request-filter.ts)
- [src/main/db.ts](/Users/allisongattone/web-wrangler/src/main/db.ts)
- [src/main/app-settings-runtime.ts](/Users/allisongattone/web-wrangler/src/main/app-settings-runtime.ts)
- [src/renderer/App.tsx](/Users/allisongattone/web-wrangler/src/renderer/App.tsx)
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [src/renderer/components/AppSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AppSettingsModal.tsx)
- [src/renderer/index.css](/Users/allisongattone/web-wrangler/src/renderer/index.css)
- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts)

## Scope

This plan covers implementation gaps that are currently one of:

- claimed in docs or UI but not enforced in runtime
- stored in persistence but not applied in runtime behavior
- exposed through IPC or shared types without an active user-facing flow

This plan does not treat every stored setting as a must-implement feature. Some gaps are better resolved by removing or downgrading the claim.

## Audit Summary

The current repository gaps fall into three groups:

1. Product claims that exceed runtime behavior
2. Stored settings that have no enforcement path
3. Exposed API surface with no active UI flow

Confirmed mismatches:

- Ghostery-backed ad blocking is claimed, but active guest-window runtime still uses a static request filter.
- App lock and lock timeout are stored, but there is no lock screen or timeout enforcement path.
- Global ad-block and dark-mode defaults are described as defaults for new apps, but install flow does not apply them.
- Theme is stored globally, but renderer theme state is never applied.
- Per-app notifications are stored and shown in UI, but there is no permission mediation path.
- Open-at-login is stored, but there is no active UI flow or OS integration.
- `updateApp`, `updateProfile`, and `updateSpace` exist in preload/IPC without active renderer editing flows.
- `SEARCH_CATALOG` exists in shared IPC constants but is unused.

## Decision Framework

Each gap should resolve through exactly one strategy:

- Implement: ship the behavior now because the repo already contains enough design signal.
- De-scope: remove or hide the feature because the current repo cannot support it safely.
- Preserve as internal-only: keep the storage or API surface, but stop representing it as shipped functionality.

## Recommended Product Decisions

| Gap | Decision | Rationale |
| --- | --- | --- |
| Ghostery guest-window blocking | Implement | Dependency and helper already exist |
| App lock | De-scope for now | Security-sensitive and incomplete |
| Lock timeout | De-scope with app lock | No safe standalone behavior |
| Global ad-block default | Implement | Small, low-risk install-flow change |
| Global dark-mode default | Implement | Small, low-risk install-flow change |
| Theme | Implement | Stored setting should produce visible behavior |
| Notifications control | De-scope for now | Currently misleading without mediation |
| Open at login | De-scope for now | No UI flow or OS behavior |
| Dormant edit IPC | Preserve as internal-only | Useful, but not user-facing today |
| `SEARCH_CATALOG` | Remove | Dead constant |

## Task Milestones

### Task 1: Truth Alignment

**Goal**

Bring docs and visible settings UI back in line with actual runtime behavior.

**Repo evidence**

- [README.md](/Users/allisongattone/web-wrangler/README.md) still claims Ghostery-backed ad blocking.
- [docs/product/prd.md](/Users/allisongattone/web-wrangler/docs/product/prd.md) still documents partial and dormant settings.
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx) still shows app lock and “default for new apps” copy.
- [src/renderer/components/AppSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AppSettingsModal.tsx) still shows notifications despite no enforcement path.

**Milestones**

- Milestone 1.1: Record every misleading claim and map it to a concrete file.
- Milestone 1.2: Rewrite product docs to describe current runtime truth.
- Milestone 1.3: Hide or relabel trust-sensitive UI controls that do not work.
- Milestone 1.4: Validate that users can no longer infer false shipped behavior from docs or settings UI.

**Files/subsystems touched**

- [README.md](/Users/allisongattone/web-wrangler/README.md)
- [docs/product/prd.md](/Users/allisongattone/web-wrangler/docs/product/prd.md)
- [docs/product/scope-and-non-goals.md](/Users/allisongattone/web-wrangler/docs/product/scope-and-non-goals.md)
- [docs/product/onboarding-and-permission-flow.md](/Users/allisongattone/web-wrangler/docs/product/onboarding-and-permission-flow.md)
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [src/renderer/components/AppSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AppSettingsModal.tsx)

**Acceptance criteria**

- No user-facing copy claims Ghostery unless Ghostery is active for guest windows.
- No visible settings control implies security, permission, or OS behavior that does not exist.
- “Default for new apps” wording appears only after install flow supports it.

**Validation commands**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

**Rollback note**

Revert the doc and settings-modal changes only.

**Dependencies on prior tasks**

None.

### Task 2: Ghostery Runtime Wiring

**Goal**

Replace the active guest-window static request filter path with the Ghostery-backed blocker.

**Repo evidence**

- [src/main/window-manager.ts](/Users/allisongattone/web-wrangler/src/main/window-manager.ts) currently calls `setupRequestFilter(sess)`.
- [src/main/adblocker.ts](/Users/allisongattone/web-wrangler/src/main/adblocker.ts) already exposes `setupAdblocker` and `disableAdblocker`.
- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts) still applies the static filter to `session.defaultSession`.

**Milestones**

- Milestone 2.1: Keep Ghostery scoped to guest sessions, not the dashboard session.
- Milestone 2.2: Replace guest-window startup blocking path with Ghostery.
- Milestone 2.3: Add disable behavior for already-open guest windows.
- Milestone 2.4: Keep the static filter only as fallback if Ghostery initialization fails.
- Milestone 2.5: Update engineering and QA docs to describe the actual runtime path.

**Files/subsystems touched**

- [src/main/adblocker.ts](/Users/allisongattone/web-wrangler/src/main/adblocker.ts)
- [src/main/window-manager.ts](/Users/allisongattone/web-wrangler/src/main/window-manager.ts)
- [src/main/app-settings-runtime.ts](/Users/allisongattone/web-wrangler/src/main/app-settings-runtime.ts)
- [src/main/request-filter.ts](/Users/allisongattone/web-wrangler/src/main/request-filter.ts)
- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [docs/engineering/architecture.md](/Users/allisongattone/web-wrangler/docs/engineering/architecture.md)
- [docs/qa/acceptance-tests.md](/Users/allisongattone/web-wrangler/docs/qa/acceptance-tests.md)

**Acceptance criteria**

- Newly opened guest app windows use Ghostery-backed blocking when `blockAds` is enabled.
- Turning `blockAds` off for an already-open guest window disables Ghostery immediately.
- Ghostery setup remains idempotent per session.
- Static filtering is used only if Ghostery setup fails.

**Validation commands**

```bash
npm run verify
```

**Rollback note**

Revert the Ghostery wiring and restore guest-window static filtering.

**Dependencies on prior tasks**

Task 1 should land first so public claims do not get ahead of the runtime change.

### Task 3: Global Defaults Applied To New Apps

**Goal**

Make `blockAdsGlobal` and `darkModeGlobal` apply during install flow for newly created apps.

**Repo evidence**

- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts) installs apps without reading global settings.
- [src/main/db.ts](/Users/allisongattone/web-wrangler/src/main/db.ts) inserts default app settings rows with schema defaults only.
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx) describes those toggles as defaults for new apps.

**Milestones**

- Milestone 3.1: Keep schema defaults unchanged.
- Milestone 3.2: Read global settings during install flow and override the new app settings row.
- Milestone 3.3: Confirm the override is one-time only and never mutates existing apps.
- Milestone 3.4: Restore accurate “default for new apps” copy in the UI.

**Files/subsystems touched**

- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [src/main/db.ts](/Users/allisongattone/web-wrangler/src/main/db.ts)
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [docs/qa/acceptance-tests.md](/Users/allisongattone/web-wrangler/docs/qa/acceptance-tests.md)

**Acceptance criteria**

- Installing an app after changing global defaults creates app settings with those values.
- Existing apps remain unchanged.
- UI wording matches runtime behavior.

**Validation commands**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

**Rollback note**

Revert the install-flow override and UI copy changes.

**Dependencies on prior tasks**

Task 1.

### Task 4: Renderer Theme Implementation

**Goal**

Make the stored global `theme` setting affect the dashboard UI.

**Repo evidence**

- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts) stores `theme`.
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx) exposes theme controls.
- [src/renderer/App.tsx](/Users/allisongattone/web-wrangler/src/renderer/App.tsx) loads global settings but never applies theme state.
- [src/renderer/index.css](/Users/allisongattone/web-wrangler/src/renderer/index.css) has one active theme token set only.

**Milestones**

- Milestone 4.1: Apply theme via a root `data-theme` attribute.
- Milestone 4.2: Bootstrap theme after global settings load.
- Milestone 4.3: Add light and dark token values in CSS.
- Milestone 4.4: Keep the settings control only because it now changes visible behavior.
- Milestone 4.5: Validate persistence and `system` handling.

**Files/subsystems touched**

- [src/renderer/App.tsx](/Users/allisongattone/web-wrangler/src/renderer/App.tsx)
- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [src/renderer/index.css](/Users/allisongattone/web-wrangler/src/renderer/index.css)

**Acceptance criteria**

- Switching `theme` changes dashboard visuals.
- Theme persists across restart.
- `system` follows `prefers-color-scheme`.

**Validation commands**

```bash
npm run verify
```

**Rollback note**

Hide the theme control and revert renderer theme application changes.

**Dependencies on prior tasks**

Task 1.

### Task 5: Dormant Enforcement Controls Cleanup

**Goal**

Remove settings that imply runtime enforcement where no runtime enforcement exists.

**Repo evidence**

- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx) shows app lock, PIN, and lock timeout.
- [src/renderer/components/AppSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AppSettingsModal.tsx) shows notifications.
- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts) contains no matching enforcement path for these settings.

**Milestones**

- Milestone 5.1: Hide app lock, PIN, and lock timeout controls from global settings.
- Milestone 5.2: Hide notifications and any open-at-login surface from per-app settings.
- Milestone 5.3: Preserve storage fields for future work without treating them as shipped behavior.
- Milestone 5.4: Update product docs so those features are explicitly deferred.

**Files/subsystems touched**

- [src/renderer/components/GlobalSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/GlobalSettingsModal.tsx)
- [src/renderer/components/AppSettingsModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AppSettingsModal.tsx)
- [docs/product/prd.md](/Users/allisongattone/web-wrangler/docs/product/prd.md)
- [docs/product/scope-and-non-goals.md](/Users/allisongattone/web-wrangler/docs/product/scope-and-non-goals.md)
- [docs/product/onboarding-and-permission-flow.md](/Users/allisongattone/web-wrangler/docs/product/onboarding-and-permission-flow.md)

**Acceptance criteria**

- No visible control implies security, permission, or OS enforcement that the repo does not implement.
- Deferred behavior is documented as deferred, not “partially shipped”.

**Validation commands**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

**Rollback note**

Restore the controls only if they are clearly labeled as non-shipping placeholders.

**Dependencies on prior tasks**

Task 1.

### Task 6: Dead Surface And IPC Cleanup

**Goal**

Remove obviously dead IPC surface and document dormant internal-only APIs accurately.

**Repo evidence**

- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts) still declares `SEARCH_CATALOG`.
- [src/preload/index.ts](/Users/allisongattone/web-wrangler/src/preload/index.ts) and [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts) only use `LIST_CATALOG`.
- `updateApp`, `updateProfile`, and `updateSpace` remain exposed but have no current renderer edit flow.

**Milestones**

- Milestone 6.1: Remove `SEARCH_CATALOG`.
- Milestone 6.2: Confirm query-based `LIST_CATALOG` remains the supported flow.
- Milestone 6.3: Treat dormant edit IPC as internal-ready surface, not shipped end-user editing.

**Files/subsystems touched**

- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts)
- [src/preload/index.ts](/Users/allisongattone/web-wrangler/src/preload/index.ts)
- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [docs/engineering/implementation-gap-remediation-plan.md](/Users/allisongattone/web-wrangler/docs/engineering/implementation-gap-remediation-plan.md)

**Acceptance criteria**

- No dead catalog IPC constant remains.
- Remaining dormant edit IPC is described as internal-only until a renderer flow exists.

**Validation commands**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

**Rollback note**

Restore the removed constant only if a real caller is reintroduced.

**Dependencies on prior tasks**

None beyond repo inspection.

### Task 7: Deferred Security Design Work

**Goal**

Capture future high-risk work without mixing it into low-risk remediation branches.

**Repo evidence**

- App lock values are persisted but not enforced.
- Website permissions are not centrally mediated.

**Milestones**

- Milestone 7.1: Document app-lock design decisions needed before implementation.
- Milestone 7.2: Document notification and website-permission mediation decisions needed before implementation.

**Files/subsystems touched**

- [docs/engineering/implementation-gap-remediation-plan.md](/Users/allisongattone/web-wrangler/docs/engineering/implementation-gap-remediation-plan.md)
- future design docs under `docs/security` or `docs/product`

**Acceptance criteria**

- Deferred work is explicitly treated as future design work.
- No high-risk security behavior is implemented opportunistically in the remediation branch.

**Validation commands**

No code validation required.

**Rollback note**

Not applicable unless future design docs are added incorrectly.

**Dependencies on prior tasks**

None.

## Suggested PR Slices

1. `docs/ui: truth alignment and dormant control cleanup`
2. `main: wire Ghostery into guest sessions with fallback`
3. `main: apply global defaults during install flow`
4. `renderer: apply persisted dashboard theme`
5. `cleanup: remove dead catalog IPC constant and document dormant internal APIs`
6. `design: app-lock and permission mediation follow-up specs`
