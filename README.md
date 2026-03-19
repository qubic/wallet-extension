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
  extension/                 # MV3 entry points (background, content-script, inpage-provider)
  hooks/                     # shared React hooks
  lib/                       # wallet/business/storage helpers
  lib/dapp/                  # dApp provider: controller, signing, storage, protocol
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
- RPC calls are scoped to `https://rpc.qubic.org/*`. The extension also requests broad host permissions (`http://*/*`, `https://*/*`) to inject the dApp provider into web pages.

## dapp api (`window.qubic`)
The extension injects `window.qubic` into regular web pages (`http/https`).

### provider methods
- `connect(): Promise<{ connected: true; origin: string }>`
- `disconnect(): Promise<{ disconnected: true }>`
- `getAccount(): Promise<{ identity: string; name?: string } | null>`
- `signMessage(params): Promise<{ signatureHex: string; digestHex: string }>`
- `signTransaction(params): Promise<{ txId: string; targetTick: number; txBytesBase64: string; txBytesHex: string }>`
- `sendTransaction(params): Promise<{ txId: string; targetTick: number; txBytesBase64: string; txBytesHex: string; networkTxId: string; broadcast: unknown }>`

### events
- `window.qubic.on('accountChanged', cb)` — fires with `{ identity: string; name?: string }` when the user switches to an approved account, or `null` when the new account is not approved for this origin (the dApp should treat `null` as "no account available" and prompt `connect()` again)
- `window.qubic.on('disconnect', cb)` — fires when the origin is disconnected

`on()` returns an unsubscribe function. You can also call `off(event, cb)` to remove a listener.

### dapp integration (for app developers)
Basic usage:

```ts
const provider = (window as Window & { qubic?: any }).qubic

if (!provider?.isQubic) {
  throw new Error('Qubic Wallet extension not found')
}

await provider.connect()
const account = await provider.getAccount()

// signMessage accepts a plain string or an object with message/hex/base64
const signedMessage = await provider.signMessage('hello qubic')
// await provider.signMessage({ message: 'hello qubic' })
// await provider.signMessage({ hex: '0x48656c6c6f' })
// await provider.signMessage({ base64: 'SGVsbG8=' })

// signTransaction: sign only (you broadcast)
const signedTx = await provider.signTransaction({
  toIdentity: 'DESTINATION_IDENTITY',
  amount: '1',
  // optional
  targetTick: 123456,
  inputType: 0,
  // optional bytes: Uint8Array | number[] | hex string | base64 string
  // inputBytes: new Uint8Array([...]),
})

// sendTransaction: sign + broadcast via the wallet
const sentTx = await provider.sendTransaction({
  toIdentity: 'DESTINATION_IDENTITY',
  amount: '1000',
  // optional: explicit tick or offset (default offset: 10)
  // targetTick: 123456,
  // targetTickOffset: 10,
})

// listen for account changes
const unsub = provider.on('accountChanged', (account) => {
  if (account) {
    console.log('switched to:', account) // { identity: string; name?: string }
  } else {
    // new account is not approved for this origin — prompt connect() again
    console.log('account not available, call connect() to approve')
  }
})
// unsub() to stop listening
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
- `NOT_CONNECTED` — origin not connected or account not approved
- `USER_REJECTED` — user declined the approval request
- `INVALID_PARAMS` — invalid or missing method parameters
- `INVALID_PASSPHRASE` — incorrect wallet passphrase
- `WATCH_ONLY_ACCOUNT` — active account cannot sign
- `NO_ACCOUNT` — no active account selected
- `METHOD_NOT_SUPPORTED` — unknown provider method
- `UNSUPPORTED_ORIGIN` — sender origin not allowed
- `INVALID_REQUEST` — malformed request or too many pending requests
- `INTERNAL_ERROR` — unexpected wallet error

### parameter reference

**signMessage params:**
- `string` — plain text to sign
- `{ message: string }` — plain text
- `{ hex: string }` — hex-encoded bytes (must start with `0x`, even length)
- `{ base64: string }` — base64-encoded bytes

**signTransaction / sendTransaction params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `toIdentity` | `string` | yes | 60-char uppercase Qubic identity |
| `amount` | `string \| number \| bigint` | yes | Must be > 0 for simple transfers (inputType 0) |
| `targetTick` | `number` | no | Explicit target tick. If omitted, resolved automatically (sendTransaction only) |
| `targetTickOffset` | `number` | no | Offset from current tick (1-60, default 10). Ignored if `targetTick` is set. sendTransaction only |
| `inputType` | `number` | no | Smart contract input type (0 = simple transfer) |
| `inputBytes` | `Uint8Array \| number[] \| string` | no | SC input data. String is parsed as hex (`0x...`) or base64 |

Notes for dApp developers:
- `connect` requires user approval (approve/reject) in the extension.
- `connect` also requires an active account. If no account is available, the request fails with `NO_ACCOUNT` (no approval/onboarding popup is opened).
- `signMessage`, `signTransaction`, and `sendTransaction` require user approval and wallet passphrase confirmation.
- `signTransaction` returns signed bytes only. Broadcasting is handled by your app/backend.
- `sendTransaction` signs and broadcasts in one step. It resolves the target tick automatically if not provided (using `targetTickOffset`, default 10).
- Permissions are per-account: `connect` approves the currently active account for the requesting origin. Switching to a different account requires the dApp to call `connect` again.

### implementation notes (extension developers)
- Requests requiring approval are persisted so they survive MV3 service worker restarts.
- Final results are stored short-term and polled by the content script.
- Pending signing payloads are encrypted at rest in `chrome.storage.local` using a key stored in `chrome.storage.session`.
- The page/content-script bridge is scoped with a per-page session token to reduce `window.postMessage` spoofing risk.

### local test smoke (dapp feature)
1. `bun run build`
2. Reload extension in `chrome://extensions`
3. Ensure the wallet has an active account selected.
4. Open a dApp page on `http://localhost:*` or `https://...`
5. Run:
   - `window.qubic`
   - `await window.qubic.connect()`
   - `await window.qubic.getAccount()`
   - `await window.qubic.signMessage({ message: 'hello' })`
   - `await window.qubic.sendTransaction({ toIdentity: '...', amount: '1' })`

Connected websites can be managed in `Settings -> Connected sites`, including the per-site authorized account list.

For a full interactive test app, see [wallet-extension-dapp](https://github.com/qubic/wallet-extension-dapp).

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
- Version bumps based on commit types (`feat` -> minor, `fix` -> patch, `BREAKING CHANGE` -> major)
- Automatic changelog generation
- GitHub release with `wallet-extension-dist.zip` artifact

**Manual trigger:** Actions -> release workflow -> Run workflow on `main`

**Local dry-run:** `bun run release:dry` (requires Node.js >= 22)
