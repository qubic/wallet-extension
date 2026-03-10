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

## dapp api (`window.qubic`)
The extension injects `window.qubic` into regular web pages (`http/https`).

### provider methods
- `connect(): Promise<{ connected: true; origin: string }>`
- `disconnect(): Promise<{ disconnected: true }>`
- `getAccount(): Promise<{ identity: string; name?: string } | null>`
- `signMessage(params): Promise<{ signatureHex: string; digestHex: string }>`
- `signTransaction(params): Promise<{ txId: string; targetTick: number; txBytesBase64: string; txBytesHex: string }>`

### events
- `window.qubic.on('accountChanged', cb)`
- `window.qubic.on('disconnect', cb)`

### dapp integration (for app developers)
Basic usage:

```ts
const provider = (window as Window & { qubic?: any }).qubic

if (!provider?.isQubic) {
  throw new Error('Qubic Wallet extension not found')
}

await provider.connect()
const account = await provider.getAccount()

const signedMessage = await provider.signMessage({ message: 'hello qubic' })

const signedTx = await provider.signTransaction({
  toIdentity: 'DESTINATION_IDENTITY',
  amount: '1',
  // optional
  targetTick: 123456,
  inputType: 0,
  // optional bytes: Uint8Array | number[] | hex string | base64 string
  // inputBytes: new Uint8Array([...]),
})
```

Error handling:

```ts
try {
  await window.qubic.signMessage({ message: 'hello' })
} catch (error: any) {
  console.error(error.code, error.message)
}
```

Common provider error codes:
- `NOT_CONNECTED`
- `USER_REJECTED`
- `INVALID_PARAMS`
- `INVALID_PASSPHRASE`
- `WATCH_ONLY_ACCOUNT`
- `NO_ACCOUNT`

Notes for dApp developers:
- `connect`, `signMessage`, and `signTransaction` require user approval in the extension.
- `signMessage` and `signTransaction` also require wallet passphrase confirmation.
- `signTransaction` returns signed bytes only. Broadcasting is handled by your app/backend.
- The current integration exposes the wallet's active account (wallet-level connect), not per-origin account selection.

### implementation notes (extension developers)
- Requests requiring approval are persisted so they survive MV3 service worker restarts.
- Final results are stored short-term and polled by the content script.
- Pending signing payloads are encrypted at rest in `chrome.storage.local` using a key stored in `chrome.storage.session`.
- The page/content-script bridge is scoped with a per-page session token to reduce `window.postMessage` spoofing risk.

### local test smoke (dapp feature)
1. `bun run build`
2. Reload extension in `chrome://extensions`
3. Open a dApp page on `http://localhost:*` or `https://...`
4. Run:
   - `window.qubic`
   - `await window.qubic.connect()`
   - `await window.qubic.getAccount()`
   - `await window.qubic.signMessage({ message: 'hello' })`

Connected websites can be managed in `Settings -> Connected sites`.

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
