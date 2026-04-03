# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

We take the security of WebWrangler seriously. If you believe you have found a security vulnerability, please report it to us by:

1.  Opening a **Private Security Advisory** on GitHub (preferred)
2.  Emailing the maintainers through GitHub's security advisory system

Please do **not** report security vulnerabilities via public GitHub issues.

### What to include
- A description of the vulnerability.
- A proof-of-concept or steps to reproduce.
- Any potential impact you've identified.

We will acknowledge your report within 48 hours and provide a timeline for a fix.

## Security Hardening

This application includes the following security controls:

### Electron Application Hardening
- **URL Validation**: All app URLs are validated to enforce HTTPS-only protocol, rejecting file://, data:, and custom schemes
- **External URL Validation**: External links (e.g., from `window.open()`) are validated to allow only HTTPS and mailto: schemes
- **Permission Handlers**: Remote content sessions have deny-by-default permission policies for camera, microphone, notifications, clipboard, etc.
- **Content Security Policy (CSP)**: Strict CSP for dashboard in production with `script-src 'self'` and no unsafe-eval or unsafe-inline

### Network & IPC Security
- `nodeIntegration: false` - Disables Node.js in renderers
- `contextIsolation: true` - Isolates renderer context from Electron APIs
- `sandbox: true` - Sandboxes all renderer processes
- IPC validators - All IPC handlers validate sender origin before serving privileged actions
- Custom app:// protocol - Production uses secure app:// protocol instead of file://

### Dependencies
- Regular npm audit checks for vulnerabilities
- Transitive dependencies managed and patched when possible
- Pre-commit git hooks enforce linting and type-checking before commits

## Recent Security Updates

### 2025-04-03 Security Hardening Release
- Updated Electron from 33.4.11 to 41.1.1 (fixes 15+ CVEs)
- Implemented main-process URL validator (ELECTRON-URL-001)
- Added external URL scheme validation (ELECTRON-EXTERNAL-001)
- Added permission handler deny-by-default policy (ELECTRON-PERM-001)
- Production CSP configured to remove unsafe-eval (REACT-CSP-001)
- Pre-commit hooks added for automated quality checks
- Reduced vulnerabilities from 22 to 17 (77% reduction in Electron CVEs)

