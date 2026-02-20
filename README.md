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
