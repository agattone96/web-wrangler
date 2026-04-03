# Auto-Sync Git Workflow Runbook

## Overview

This document describes the automated git workflow for WebWrangler development. The system uses pre-commit hooks to enforce code quality and consistency before changes are committed to the repository.

## Prerequisites

- Node.js and npm installed
- Repository cloned locally
- `npm install` run to install dependencies and git hooks

## Automatic Setup

When you clone the repository and run `npm install`, the pre-commit hooks are automatically configured via Husky. No manual setup is required.

## Pre-Commit Hook: Linting & Type Checking

Every time you run `git commit`, the pre-commit hook automatically runs:

```bash
npm run lint -- --max-warnings 0 && npm run typecheck
```

This ensures:
1. **Linting** (`eslint`): No errors or warnings in TypeScript/JavaScript code
2. **Type Checking** (`tsc`): All TypeScript types are valid across main, preload, and renderer processes

### What Happens

1. You run: `git commit -m "my changes"`
2. Husky pre-commit hook is triggered
3. Linter runs on all src files - must pass with 0 warnings
4. Type checker runs on all TypeScript configs - must pass
5. If either fails, commit is blocked and you must fix errors
6. After fixes, run `git commit` again

## Handling Pre-Commit Hook Failures

### Lint Errors

**Error:** `✖ X problems (Y errors, Z warnings)`

**Solution:**

```bash
# Run linter to see detailed errors
npm run lint

# ESLint can auto-fix many issues
npm run lint -- --fix

# Re-run and commit
git commit -m "my changes"
```

### Type Checking Errors

**Error:** `error TS1234: Something is not a type`

**Solution:**

```bash
# Run type checker to see detailed errors
npm run typecheck

# Fix the type errors manually in your code

# Re-run and commit
git commit -m "my changes"
```

## Bypassing the Hook (Emergency Only)

In rare circumstances, you can bypass the pre-commit hook:

```bash
git commit --no-verify -m "my changes"
```

**⚠️ WARNING:** This should only be used in genuine emergencies. All security hardening fixes and critical changes MUST pass linting and type checking.

## Working with Security Fixes

Security hardening changes have additional requirements:

1. All security-related changes must pass pre-commit hooks
2. All security tests must pass: `npm run test`
3. Full build must succeed: `npm run build`
4. npm audit should show no regressions: `npm audit`

Example workflow for security fix:

```bash
# 1. Make your security fix
vim src/main/url-validator.ts

# 2. Try to commit (pre-commit hooks run automatically)
git commit -m "security: add URL validation"

# 3. If hooks fail, fix errors and retry
npm run lint -- --fix
git commit -m "security: add URL validation"

# 4. After commit, run full validation
npm run test
npm run build
npm audit

# 5. Only then push to remote
git push origin branch-name
```

## Branch Conventions

- `main` - Production-ready code, all changes merged here must pass all checks
- `feature/*` - Feature development branches
- `security/*` - Security-related fixes (e.g., `security/hardening`)
- `codex/*` - Experimental or complex features

Always create feature/security branches from `main`:

```bash
git checkout main
git pull origin main
git checkout -b security/my-fix
```

## Syncing with Remote

### Pulling Changes

```bash
git pull origin main  # Updates local main with remote changes
```

The pre-commit hook only affects commits, not pulls or merges.

### Pushing Changes

```bash
# All commits must already pass pre-commit hook
git push origin branch-name
```

If you have multiple commits, each one was validated individually before commit.

## Troubleshooting

### Q: Pre-commit hook runs but then times out

**A:** Some tasks (especially first run) can take time:
- First `npm run typecheck` may take 30-60 seconds
- Large projects may take time for linting
- Be patient - don't interrupt with Ctrl+C unless absolutely necessary

### Q: How do I know if my changes will break the build?

**A:** Run the full validation before committing:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

If all pass, your commit will succeed and not break anything.

### Q: Can I commit multiple files?

**A:** Yes, all files in a single commit are validated together:

```bash
git add src/main/file1.ts src/main/file2.ts
git commit -m "refactor: improve url handling"
```

### Q: What if I need to update dependencies?

**A:** Dependencies can be added/updated, but be aware:

```bash
npm install new-package
# This might introduce new vulnerabilities
npm audit
# If vulnerabilities, they must be acceptable or fixed

# Then commit
git commit -m "deps: add new-package"
# Pre-commit hooks run, must pass
```

### Q: How do I update the pre-commit hook?

**A:** Edit `.husky/pre-commit`:

```bash
vim .husky/pre-commit
```

The hook file format:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint -- --max-warnings 0 && npm run typecheck
```

You can add additional checks (e.g., `npm run test`), but keep it focused on pre-commit validation.

## Best Practices

1. **Commit frequently** - Smaller commits are easier to review and debug
2. **Write clear messages** - Use `feat:`, `fix:`, `docs:`, `security:` prefixes
3. **Include Co-authored-by trailer** - For team collaboration:
   ```bash
   git commit -m "feature: add new feature

   Co-authored-by: Name <email>"
   ```
4. **Test before pushing** - Run `npm run test` locally before `git push`
5. **Review your diffs** - Always check what you're committing:
   ```bash
   git diff src/  # See changes before staging
   git status     # See what will be committed
   ```

## Security-Specific Guidelines

All security changes require:
1. ✅ Pre-commit hook passes (lint + typecheck)
2. ✅ `npm run test` passes (all tests, including security tests)
3. ✅ `npm run build` succeeds (full build)
4. ✅ `npm audit` doesn't show new vulnerabilities
5. ✅ Manual testing if applicable (e.g., test permission handler blocks requests)

Example:

```bash
# Make security fix
vim src/main/window-manager.ts

# Pre-commit validation
git add src/main/window-manager.ts
git commit -m "security: add permission handler"  # Hooks run

# If commit succeeds, run full validation
npm run test
npm run build
npm audit

# Then push
git push origin security/permissions
```

## Additional Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Web-Wrangler Contributing Guide](../../CONTRIBUTING.md)
