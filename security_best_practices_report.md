# Security Best Practices Report

## Executive Summary

This repository is a desktop Electron application with a local React/Vite renderer and remote web content loaded into per-app `BrowserWindow` instances. The main hardening controls are present in several places (`nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, sender validation for IPC), but the remote-content boundary is still too permissive in a few high-impact areas.

The highest-risk issues are:

1. untrusted app URLs are accepted by the main process without a scheme/host policy before being persisted and loaded;
2. popup URLs from remote content are passed directly to `shell.openExternal()` with no validation;
3. remote-content sessions do not install a permission request handler;
4. the dashboard CSP is broad enough that it would not materially contain script injection.

Report written to: `security_best_practices_report.md`

## Stack And Review Basis

- App stack observed in code: TypeScript, React 18, Vite 5, Electron 33, better-sqlite3.
- Frontend guidance loaded from local skill references:
  - `javascript-general-web-frontend-security.md`
  - `javascript-typescript-react-web-frontend-security.md`
- Electron-specific guidance is not present in the local skill references, so the Electron findings below are based on the official Electron security guidance:
  - <https://www.electronjs.org/docs/latest/tutorial/security>

## Critical / High

### Finding 1

- Rule ID: ELECTRON-URL-001
- Severity: High
- Location:
  - `src/main/index.ts:275-308`
  - `src/main/index.ts:316-319`
  - `src/main/window-manager.ts:151-152`
  - `src/renderer/components/AddAppModal.tsx:14-35`
- Evidence:

```ts
// src/main/index.ts
ipcMain.handle(IPC.INSTALL_APP, async (e, data: InstallAppInput) => {
  ...
  const appEntry: App = {
    id,
    name: data.name,
    url: data.url,
    ...
  }
  insertApp(appEntry)
  ...
})

ipcMain.handle(IPC.UPDATE_APP, (e, id: string, data: Parameters<typeof updateApp>[1]) => {
  if (!validateSender(e)) throw new Error('Unauthorized IPC call')
  return updateApp(id, data)
})

// src/main/window-manager.ts
await win.loadURL(appEntry.url)
```

```ts
// src/renderer/components/AddAppModal.tsx
if (!/^https?:\/\//i.test(s)) s = 'https://' + s
...
try { new URL(finalUrl) } catch { setError('Invalid URL.'); return }
const app = await window.api.installApp({ name: name.trim(), url: finalUrl, spaceId })
```

- Impact: The main process trusts renderer-supplied URLs and later loads them in privileged Electron windows. A compromised renderer, tampered local database, or future UI path could introduce non-HTTPS or privileged schemes such as `file:` or custom protocols, expanding the attack surface from a remote website problem into an Electron trust-boundary problem.
- Fix: Add a main-process URL validator and enforce it on install, update, icon fetch, and load. Default policy should allow only `https:` URLs for app entries, with narrowly-scoped dev exceptions if explicitly needed.
- Mitigation: Re-validate any persisted URL before `loadURL`, not only at form entry time.
- False positive notes: The current UI normalizes user input toward `https://`, but that renderer check is not a security boundary and does not protect the main process.

### Finding 2

- Rule ID: ELECTRON-EXTERNAL-001
- Severity: High
- Location: `src/main/window-manager.ts:89-93`
- Evidence:

```ts
win.webContents.setWindowOpenHandler(({ url }) => {
  shell.openExternal(url)
  return { action: 'deny' }
})
```

- Impact: Any remote page loaded in an app window can attempt to open arbitrary URLs and have them delegated directly to the operating system. That includes non-HTTP schemes and custom protocol handlers, which can trigger unsafe external application launches or hand off attacker-controlled URLs to privileged local handlers.
- Fix: Validate the target URL before calling `shell.openExternal()`. Restrict to an allowlist such as `https:` and possibly `mailto:`, and deny everything else.
- Mitigation: Log and deny unexpected schemes; consider prompting the user before opening external destinations that do not match the app’s configured origin.
- False positive notes: This is directly called out by Electron’s official security guidance: do not use `shell.openExternal` with untrusted content.

### Finding 3

- Rule ID: ELECTRON-PERM-001
- Severity: High
- Location: `src/main/window-manager.ts:39-44`, `src/main/window-manager.ts:63-82`
- Evidence:

```ts
const partition = getSessionPartition(appEntry.id, profile.id)
const sess = session.fromPartition(partition, { cache: true })
...
const win = new BrowserWindow({
  ...
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    session: sess,
    sandbox: true,
    preload: path.join(__dirname, '../preload/app-preload.js'),
  },
})
```

No `setPermissionRequestHandler()` or `setPermissionCheckHandler()` usage is present anywhere in the repository.

- Impact: These windows load arbitrary remote web apps in persistent Electron sessions. Without an explicit permission policy, remote sites can request capabilities like notifications, media access, clipboard-related permissions, or other browser-level grants under Electron’s default behavior, which is broader than a locked-down desktop wrapper should assume.
- Fix: Install a permission request handler on each remote-content session and deny by default. Grant only narrowly-scoped permissions for known origins and explicit product requirements.
- Mitigation: Apply the handler immediately after `session.fromPartition(...)` so every remote app window is covered consistently.
- False positive notes: This finding depends on Electron’s documented default permission behavior and the absence of a handler in repo code. If permissions are somehow controlled outside the app process, that control is not visible here.

## Medium

### Finding 4

- Rule ID: REACT-CSP-001
- Severity: Medium
- Location: `src/main/index.ts:434-449`
- Evidence:

```ts
'Content-Security-Policy': [
  "default-src 'self' 'unsafe-inline' data: app:; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
  "connect-src 'self' https: wss:; " +
  "img-src 'self' data: https: file:; " +
  "style-src 'self' 'unsafe-inline' https:; " +
  "font-src 'self' https: data:;"
]
```

- Impact: The dashboard does set a CSP, but `script-src 'unsafe-inline' 'unsafe-eval' https:` is permissive enough that the policy would provide limited protection against script injection in the renderer. For a local bundled React UI, this is significantly weaker than necessary.
- Fix: Tighten the dashboard policy to a static-app baseline, for example removing `unsafe-eval`, removing broad `https:` script execution, and avoiding `unsafe-inline` for scripts. If inline behavior is required, use hashes or nonces for the specific assets that need it.
- Mitigation: Keep CSP scoped to the local renderer and avoid applying broad script allowances globally.
- False positive notes: This appears to target the main renderer session. The per-app remote sessions created from custom partitions are the higher-risk boundary and should have their own explicit policy controls.

## Positive Controls Observed

- `nodeIntegration: false` is set for both the main window and remote app windows.
- `contextIsolation: true` is enabled.
- `sandbox: true` is enabled.
- A custom `app://` protocol is used in production instead of `file://`.
- IPC handlers validate sender origin before serving privileged actions.
- The preload bridge exposes a typed API instead of dumping raw Electron APIs into the renderer.

## Recommended Fix Order

1. Enforce main-process URL validation for app install/update/load flows.
2. Restrict `shell.openExternal()` to an explicit scheme allowlist.
3. Add a deny-by-default permission request handler to every remote-content session.
4. Tighten the dashboard CSP to remove `unsafe-eval` and broad remote script allowances.

## Validation Commands

Run after applying fixes:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

Expected result: all commands succeed, and manually testing a remote app window shows that disallowed schemes and permissions are blocked.

## Rollback Note

These findings mostly point to additive guardrails. If a fix causes regressions, revert the specific validation or permission rule that broke behavior and replace it with a narrower allowlist rather than removing the control entirely.
