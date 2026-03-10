# wallet-extension
Qubic Wallet Browser Extension (Chrome MV3), built with React, TypeScript, Vite, Tailwind, and Bun.

## Requirements
- Bun `>= 1.3`
- Node `>= 22` (required for semantic-release)
- Chrome (or Chromium-based browser with extension developer mode)

## Quick start
1. Install dependencies:
   ```bash
   bun install
   ```
2. Run web dev mode:
   ```bash
   bun dev
   ```
3. Build extension bundle:
   ```bash
   bun run build
   ```

## Scripts
- `bun dev`: Vite dev server
- `bun run dev:extension`: extension watch build to `dist-dev/`
- `bun run build`: typecheck + production build to `dist/`
- `bun run lint`: Biome checks
- `bun run format`: Biome formatting
- `bun run preview`: local preview server

## Load extension in Chrome
1. Run `bun run build`.
2. Open `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the `dist/` folder.

## Fast local extension workflow
Use this when you want live updates without reloading from scratch.

1. Run:
   ```bash
   bun run dev:extension
   ```
2. In `chrome://extensions`, load `dist-dev/` once.
3. Keep the popup/sidepanel open and iterate while watch mode rebuilds.

## Project structure
```txt
public/
  manifest.json              # Chrome MV3 manifest
  branding/                  # logos and brand assets
  icons/                     # extension icons
src/
  app/                       # app providers/setup
  components/                # reusable UI and feature components
  hooks/                     # shared React hooks
  lib/                       # wallet/business/storage helpers
  locales/                   # i18n translations
  pages/                     # routed screens
  router/                    # route map + guards
  styles/                    # global styles/tokens
  main.tsx                   # app entry
popup.html                   # popup entry point
sidepanel.html               # sidepanel entry point
```

## Architecture notes
- Routing uses `HashRouter` for extension-safe navigation.
- Wallet state is event-driven through storage + custom events (for account/lock updates).
- Watch-only and vault-backed accounts are both supported.
- Pending transactions are persisted locally and reconciled against network tick data.

## Security notes
- Sensitive vault data is managed through the SDK vault store.
- Passphrases/seeds are handled in-memory only during active flows and cleared on completion paths.
- App reset now clears wallet-specific keys only (scoped cleanup), not all origin storage.
- Current RPC host permission is restricted to `https://rpc.qubic.org/*`.

## Development workflow

### Git hooks
Husky hooks run automatically:
- **Pre-commit**: Format and lint staged files (`lint-staged`)
- **Pre-push**: TypeScript compilation check (`tsc -b`)

Bypass with `--no-verify` if needed.

### Commit message format
Follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`

Examples: `feat: add feature`, `fix(accounts): resolve bug`, `chore: update deps`

Valid types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `ci`, `build`, `revert`

### Quality gates
```bash
bun run lint
bunx tsc -b
bun run build
```

## Troubleshooting
- If popup looks stale, reload the extension in `chrome://extensions`.
- If account data appears out of sync, switch account once or reload the active view.
- If a local build fails after dependency changes, run:
  ```bash
  rm -rf node_modules
  bun install
  ```

## Releases

Releases are automated via [Semantic Release](https://semantic-release.gitbook.io/) on merge to `main`:
- Version bumps based on commit types (`feat` → minor, `fix` → patch, `BREAKING CHANGE` → major)
- Automatic changelog generation
- GitHub release with `wallet-extension-dist.zip` artifact

**Manual trigger:** Actions → release workflow → Run workflow on `main`

**Local dry-run:** `bun run release:dry` (requires Node.js >= 22)
