# wallet-extension
Qubic Wallet Browser Extension (Chrome MV3), built with React, TypeScript, Vite, Tailwind, and Bun.

## Requirements
- Bun `>= 1.3`
- Node `>= 20` (for tooling compatibility)
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

Available methods:
- `connect(): Promise<{ connected: true; origin: string }>`
- `getAccount(): Promise<{ identity: string; name?: string } | null>`
- `signMessage(params): Promise<{ signatureHex: string; digestHex: string }>`
- `signTransaction(params): Promise<{ txId: string; targetTick: number; txBytesBase64: string; txBytesHex: string }>`
- `disconnect(): Promise<{ disconnected: true }>`

Behavior:
- `connect` requires explicit user approval.
- `signMessage` and `signTransaction` require approval + passphrase.
- Requests from unconnected origins fail with `NOT_CONNECTED`.
- Provider errors include `error.code` and `error.message`.

Events:
- `window.qubic.on('accountChanged', cb)`
- `window.qubic.on('disconnect', cb)`

Connected websites can be managed in `Settings -> Connected sites`.

### dapp implementation (internal flow)
High-level request path:

1. Page calls `window.qubic.<method>()` from the injected in-page provider (`src/extension/inpage-provider.ts`).
2. In-page provider posts a `window.postMessage(...)` request.
3. Content script (`src/extension/content-script.ts`) validates the request shape and forwards it to the extension runtime (`chrome.runtime.sendMessage`).
4. Background service worker (`src/extension/background.ts`) validates params, checks permissions, and either:
   - responds immediately (`getAccount`, `disconnect`), or
   - creates a persisted pending approval request (`connect`, `signMessage`, `signTransaction`) and returns a pending ack.
5. Approval UI (`src/components/dapp/dapp-approval-drawer.tsx`) reads pending requests from `chrome.storage.local`, lets the user approve/reject, and sends the decision back to the background worker.
6. Background resolves the persisted request, stores the final result in extension storage, and clears the pending approval.
7. Content script polls request status and forwards the final response to the in-page provider.

Message hardening:
- The content script injects a per-page session token into the in-page provider.
- Provider requests/events/responses must include that session token to be accepted by the provider/content-script bridge.

### dapp storage keys
The dApp integration stores its state in `chrome.storage.local`:

- `dapp.permissions.v1`: connected origins + timestamps
- `dapp.currentAccount.v1`: active wallet account snapshot exposed to dApps
- `dapp.pendingRequests.v1`: pending approval requests shown in the drawer (preview-only payloads for UI)
- `dapp.executionRequests.v1`: persisted full requests waiting for approval execution
- `dapp.requestResults.v1`: short-lived finalized responses polled by content script
- Executable approval payload params are encrypted before writing to local storage (key stored in `chrome.storage.session` for same-browser-session recovery).

The active account snapshot is synced from extension UI state by `src/lib/dapp/session-sync.ts`.

### supported provider methods
`window.qubic` currently supports:

- `connect`
- `disconnect`
- `getAccount`
- `signMessage`
- `signTransaction`

`signTransaction` returns a signed payload only (serialized bytes + tx metadata). Broadcasting is still handled by the dApp/backend using its own network flow.

### implementation notes / current limitations
- The provider is injected only on `http/https` pages (not `chrome://`, extension pages, file URLs, etc.).
- Approval requests no longer depend on an in-memory waiter map. Approval state and executable request payloads are persisted, and content script polls for finalized results.
- If the page/content script reloads while a request is in-flight, the original page promise is lost (browser page lifecycle), but the approval request itself remains recoverable and can still be completed.
- If the browser session fully restarts, the session-scoped encryption key is lost, so old pending signing payloads may no longer be executable (the request will fail safely instead of using plaintext-at-rest).
- Pending dApp approval requests are persisted with preview-only payloads so the approval drawer can render request details after popup reloads without storing full signing payloads.
- The current connect flow is wallet-level (one active account exposed via `getAccount`), not per-origin account selection.
- Signing requires the active account to be vault-backed (watch-only accounts cannot sign).

### local testing (dapp feature)
1. `bun run build`
2. Load/reload the extension in `chrome://extensions`
3. Open a test dApp on `http://localhost:*` or `https://...`
4. Check provider injection:
   - `window.qubic`
   - `await window.qubic.connect()`
   - `await window.qubic.getAccount()`
5. Test signing flows:
   - `await window.qubic.signMessage({ message: 'hello' })`
   - `await window.qubic.signTransaction({...})`
6. Validate connected sites management in `Settings -> Connected sites`

## Quality gates
Run these before opening a PR:

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
- Releases are automated with Semantic Release (`.github/workflows/release.yml`).
- `main` publishes stable releases.
- Stable release titles use semantic version format: `v<version>`.
- Each release includes a zipped build artifact: `dist.zip`.
- Local dry-run: `bun run release:dry`
