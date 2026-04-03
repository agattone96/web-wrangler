# Security Hardening Execution Plan

## Purpose

This document turns the security audit in [security_best_practices_report.md](/Users/allisongattone/web-wrangler/security_best_practices_report.md) into implementation work that can be executed in small, reviewable changes.

Primary evidence:

- [security_best_practices_report.md](/Users/allisongattone/web-wrangler/security_best_practices_report.md)
- [docs/security/trust-model.md](/Users/allisongattone/web-wrangler/docs/security/trust-model.md)
- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [src/main/window-manager.ts](/Users/allisongattone/web-wrangler/src/main/window-manager.ts)
- [src/main/db.ts](/Users/allisongattone/web-wrangler/src/main/db.ts)
- [src/main/app-icon-fetcher.ts](/Users/allisongattone/web-wrangler/src/main/app-icon-fetcher.ts)
- [src/preload/index.ts](/Users/allisongattone/web-wrangler/src/preload/index.ts)
- [src/renderer/components/AddAppModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AddAppModal.tsx)
- [src/shared/types.ts](/Users/allisongattone/web-wrangler/src/shared/types.ts)

## Scope

This plan covers the security work needed to reduce the current Electron remote-content attack surface without changing the product architecture.

Included:

- main-process validation of app URLs
- validation of external popup targets before OS handoff
- explicit session permission mediation for remote guest windows
- tighter dashboard CSP for the local renderer
- documentation and QA updates for the new behavior

Excluded for this phase:

- redesigning or removing user-provided custom JavaScript
- encrypting local persistence
- reworking the preload API model
- adding a first-party account or backend security model

## Audit Summary

The current high-signal gaps are:

1. app URLs are not validated at the main-process boundary before persistence and `loadURL`
2. popup targets from remote content are forwarded to `shell.openExternal()` without a scheme allowlist
3. remote-content sessions have no explicit `setPermissionRequestHandler` policy
4. the dashboard CSP is too broad to be effective as meaningful script-injection defense

## Fix Order

| Task | Priority | Risk | Why first |
| --- | --- | --- | --- |
| Task 1: Main-process URL policy | P0 | Medium | Removes trust from renderer input at the actual privilege boundary |
| Task 2: External navigation allowlist | P0 | Low | Stops direct OS handoff of attacker-controlled URLs |
| Task 3: Session permission mediation | P0 | Medium | Prevents silent expansion of remote-site capabilities |
| Task 4: Dashboard CSP tightening | P1 | Medium | Improves containment for local renderer compromise |
| Task 5: Docs and QA alignment | P1 | Low | Keeps runtime behavior and repo documentation in sync |

## Task Milestones

### Task 1: Main-Process URL Policy

**Goal**

Accept only supported app URL schemes in the main process and re-validate before use.

**Milestones**

- Milestone 1.1: Add a shared main-process URL parser/validator with a clear scheme allowlist.
- Milestone 1.2: Enforce validation in app install flow.
- Milestone 1.3: Enforce validation in app update flow.
- Milestone 1.4: Re-validate persisted app URLs before `loadURL`.
- Milestone 1.5: Reject invalid inputs with stable user-facing error messages.

**Files/subsystems touched**

- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [src/main/window-manager.ts](/Users/allisongattone/web-wrangler/src/main/window-manager.ts)
- [src/renderer/components/AddAppModal.tsx](/Users/allisongattone/web-wrangler/src/renderer/components/AddAppModal.tsx)

**Acceptance criteria**

- The main process rejects `file:`, `javascript:`, `data:`, and malformed URLs for installed apps.
- Guest windows only call `loadURL` with a validated allowed URL.
- Existing valid `https:` apps still open normally.

### Task 2: External Navigation Allowlist

**Goal**

Stop remote pages from sending arbitrary OS-level external opens.

**Milestones**

- Milestone 2.1: Add a helper that validates external popup targets by scheme.
- Milestone 2.2: Restrict `shell.openExternal()` to the allowlist.
- Milestone 2.3: Deny and log disallowed popup targets.
- Milestone 2.4: Preserve normal `https:` external-link behavior.

**Files/subsystems touched**

- [src/main/window-manager.ts](/Users/allisongattone/web-wrangler/src/main/window-manager.ts)

**Acceptance criteria**

- Popup attempts for unsupported schemes are denied.
- Standard `https:` links still open in the system browser.
- The handler never directly forwards a raw unvalidated URL to `shell.openExternal()`.

### Task 3: Session Permission Mediation

**Goal**

Apply a deny-by-default permission policy to remote-content sessions.

**Milestones**

- Milestone 3.1: Install `setPermissionRequestHandler()` on each guest session.
- Milestone 3.2: Deny all permissions by default.
- Milestone 3.3: Allow only explicitly approved permissions for explicitly approved origins if product requirements demand it.
- Milestone 3.4: Keep the policy attached to partitioned sessions, not just `defaultSession`.

**Files/subsystems touched**

- [src/main/window-manager.ts](/Users/allisongattone/web-wrangler/src/main/window-manager.ts)
- [docs/security/trust-model.md](/Users/allisongattone/web-wrangler/docs/security/trust-model.md)

**Acceptance criteria**

- Guest sessions do not rely on Electron defaults for permission grants.
- Permission behavior is explicit in code and documentation.

### Task 4: Dashboard CSP Tightening

**Goal**

Make the local renderer CSP a useful defense-in-depth control rather than a mostly permissive header.

**Milestones**

- Milestone 4.1: Separate local renderer needs from guest-window remote content needs.
- Milestone 4.2: Remove broad remote script allowances from the dashboard CSP.
- Milestone 4.3: Remove `unsafe-eval` unless a verified build/runtime requirement remains.
- Milestone 4.4: Keep the app functional in both packaged and dev modes.

**Files/subsystems touched**

- [src/main/index.ts](/Users/allisongattone/web-wrangler/src/main/index.ts)
- [src/renderer/index.html](/Users/allisongattone/web-wrangler/src/renderer/index.html)

**Acceptance criteria**

- The packaged renderer loads under the tighter policy.
- Any remaining CSP exceptions are documented and justified.

### Task 5: Docs And QA Alignment

**Goal**

Keep the repository documentation and regression checks aligned with the hardened behavior.

**Milestones**

- Milestone 5.1: Update trust-model assumptions that are no longer true after fixes.
- Milestone 5.2: Add QA checks for invalid app URLs and blocked external schemes.
- Milestone 5.3: Record the permission policy and CSP posture in repo docs.

**Files/subsystems touched**

- [docs/security/trust-model.md](/Users/allisongattone/web-wrangler/docs/security/trust-model.md)
- [docs/qa/acceptance-tests.md](/Users/allisongattone/web-wrangler/docs/qa/acceptance-tests.md)
- [docs/README.md](/Users/allisongattone/web-wrangler/docs/README.md)

**Acceptance criteria**

- Repo docs describe the hardened behavior accurately.
- QA coverage includes the new denial paths.

## Execution Notes For Codex

- Implement tasks in order unless a dependency forces a smaller prerequisite patch.
- Prefer additive, reversible guardrails over refactors.
- Keep user-facing behavior unchanged except where insecure behavior must now be rejected.
- Validate each task with the smallest useful command set before moving to the next milestone.

## Validation Commands

For code changes:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

For focused iteration during Task 1 and Task 2:

```bash
npm test -- --passWithNoTests
```

Expected result: the app still builds, existing `https:` apps still open, and unsupported schemes are rejected before persistence or external handoff.

## Rollback Note

Rollback should happen task-by-task. Revert only the specific validation or permission policy that causes a regression, then replace it with a narrower exception instead of removing the control wholesale.
