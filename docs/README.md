# WebWrangler Documentation Index

This documentation set was generated from the current repository contents and active chat context for the Electron desktop application in this repository.

## Organization

- `docs/product/prd.md`: normative product requirements and user journeys.
- `docs/product/scope-and-non-goals.md`: normative scope boundaries and deferred work.
- `docs/product/onboarding-and-permission-flow.md`: normative first-run, setup, and permission/setting behavior.
- `docs/security/trust-model.md`: normative trust boundaries, sensitive data handling, and abuse/failure cases.
- `docs/security/security-hardening-execution-plan.md`: implementation-ready task and milestone plan for security remediation work.
- `docs/engineering/architecture.md`: normative implementation architecture and critical flows.
- `docs/engineering/data-model-and-normalization.md`: normative persisted entities, relationships, and normalization rules.
- `docs/engineering/engineering-constraints.md`: normative implementation constraints derived from code, build, and security posture.
- `docs/engineering/implementation-gap-remediation-plan.md`: implementation-ready patch plan for closing claimed-vs-implemented feature drift.
- `docs/qa/acceptance-tests.md`: normative acceptance criteria and regression checks.

## Source Basis

Primary evidence used:

- Runtime code under `src/main`, `src/preload`, `src/renderer`, and `src/shared`
- Root package/build metadata in `package.json`, `Makefile`, and TypeScript configs
- Existing repository docs in `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `assets/build_documentation.md`
- Active chat instruction requiring implementation-grade documentation grounded in repository evidence

## Assumptions

- The product intent is a desktop workspace for managing and launching web apps; this is strongly supported by code and existing docs.
- The primary target platform is desktop macOS, with packaging support for Windows and Linux; macOS appears most polished because of dock, tray, and title bar handling.
- There is no implemented OS-native onboarding or permission prompt orchestration beyond normal website behavior inside guest windows.

## Known Unknowns

- No telemetry, analytics, or remote sync service is present in code.
- No explicit auto-update channel, cloud account system, or backend service is present in code.
- Website permission prompts such as microphone/camera/notification access are not centrally mediated by application code in this repository.
- Some stored settings are not enforced by current runtime code, including app lock, open-at-login, and notification controls.

## Contradictions Captured In This Set

- Existing prose claims Ghostery-native ad blocking, but current runtime behavior uses `src/main/request-filter.ts`; `src/main/adblocker.ts` is present but not wired into the app lifecycle.
- Existing prose presents app lock and some advanced settings as product capabilities, but the repository currently stores those values without enforcing them.
