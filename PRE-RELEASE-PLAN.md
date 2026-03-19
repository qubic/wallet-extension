# Pre-Release Support Plan (Pending)

> This plan has not been implemented yet. When ready, the changes are two config file edits.

## What to implement

### 1. `.releaserc.cjs` — add staging branch
```js
branches: [
  'main',
  {
    name: 'staging',
    prerelease: 'rc',
  },
],
```

### 2. `.github/workflows/release.yml` — trigger on staging too
```yaml
on:
  push:
    branches:
      - main
      - staging
  workflow_dispatch:
```

### 3. Create `staging` branch (manual step)
```bash
git checkout main
git checkout -b staging
git push -u origin staging
```

## Resulting Workflow
- **Feature branches** → merge to `dev` (CI runs, no release)
- **`dev`** → merge to `staging` (pre-release `v1.0.0-rc.1` created with `dist.zip`)
- **`staging`** → merge to `main` (stable release `v1.0.0` created with `dist.zip`)

## Hotfix Workflow
1. Branch `hotfix/fix-name` from `main`
2. Fix and commit with `fix: ...`
3. PR to `main`, merge → patch release automatic (e.g. `v1.2.1`)
4. Merge `main` back to `dev` to sync the fix

## Stabilization on Staging
1. Create `fix/bug-name` branch **from `staging`**
2. PR to `staging`, merge → new rc (e.g. `v1.3.0-rc.2`)
3. Repeat until stable
4. Merge `staging` → `main` → stable release
5. Merge `main` back to `dev` to sync fixes

```
dev ──────────────────────────────────► continues
  \                                  ↑
   └──► staging ──► fix ──► staging  │ (merge main back to dev)
                              \      │
                               └──► main
```

## Branch Protection (recommended)
| Branch    | Rules                                                    |
|-----------|----------------------------------------------------------|
| `main`    | Require PR review, require CI to pass, no direct pushes  |
| `staging` | Require PR review, require CI to pass, no direct pushes  |
| `dev`     | Require CI to pass, PRs or direct pushes (team's choice) |

## Reference
Both `qubic/explorer-frontend` and `qubic/wallet` use this exact pattern:
- `branches: ['main', { name: 'staging', prerelease: 'rc' }]`
- Workflow triggers on push to `main` and `staging`
- `dev` and `testnet` build/deploy but don't create releases
