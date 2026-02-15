# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qubic Wallet — a Chrome Extension (Manifest V3) built with React 19, TypeScript 5.9, and Vite 7. The wallet manages Qubic cryptocurrency accounts, balances, transfers, and assets via the Qubic RPC API.

## Commands

```bash
# Development — requires Node 20.19+ (use `nvm use 20` if needed)
bun dev                    # Vite dev server (serves index.html at localhost:5173)
bun run dev:extension      # Watch-mode build to dist-dev/ with reload stamp
bun run build              # Production build: tsc -b && vite build → dist/

# Linting & formatting (Biome)
bun run lint               # Check with Biome
bun run format             # Auto-fix with Biome --write

# Type checking only
bunx tsc -b
```

**Package manager:** Bun (primary), npm also works with `--legacy-peer-deps` for React 19 peer conflicts.

## Extension Entry Points

Vite builds 4 HTML entry points (configured in `vite.config.ts`):

| File | Purpose | Dimensions |
|------|---------|------------|
| `popup.html` | Extension popup (default action) | 360×600px fixed |
| `sidepanel.html` | Chrome side panel | Full height |
| `tab.html` | Full browser tab | Full viewport |
| `index.html` | Dev/standalone | Full viewport |

To test as a Chrome extension: build, then load `dist/` as unpacked extension at `chrome://extensions`.

Build mode `--mode extension` outputs to `dist-dev/` and emits `reload.json` for live reload during development.

## Architecture

### Routing (`src/router/app-router.tsx`)

Three-state router: **not onboarded** → **locked** → **authenticated**.

- Not onboarded: shows Welcome + onboarding flows (`/onboarding/*`)
- Locked: redirects all routes to `/unlock`
- Authenticated: full app with nav bar

Lock state is driven by `src/lib/lock.ts` (localStorage-based, 1–120 min timeout, default 10 min). Cross-tab sync via `StorageEvent` and custom `wallet-lock-updated` event.

### Provider Stack (`src/app/app.tsx`)

`ThemeProvider` → `SdkProvider` (RPC: `https://rpc.qubic.org`) → `QubicQueryProvider` (TanStack Query) → `HashRouter` → `AppRouter` → `Toaster` (Sonner)

### Core Libraries (`src/lib/`)

- **vault.ts** — Opens/validates encrypted seed vault via `@qubic-labs/sdk`. All seed operations require passphrase.
- **accounts.ts** — localStorage-backed account cache, ordering, and watch-only accounts. Emits `wallet-account-updated` custom event.
- **lock.ts** — Lock/unlock state, timeout scheduling. Emits `wallet-lock-updated` custom event.
- **assets.ts** — Fetches owned assets from RPC, aggregates duplicates. Exports `useOwnedAssets` React Query hook.
- **vault-export.ts** — Exports vault to `.qubic-vault` format (RSA-OAEP + AES-GCM + PBKDF2).
- **pending-transactions.ts** — Pending TX state using `useSyncExternalStore`. Persists to localStorage.
- **qx.ts** — QX asset transfer payload builder (80-byte binary layout).
- **utils.ts** — `truncateString`, `formatBalance`, `formatBalanceCompact`, `isValidIdentity`, `buildExplorerObjectUrl`, `cn` (clsx + tailwind-merge).

### Custom Events

Components communicate via `window.dispatchEvent`:
- `wallet-lock-updated` — lock state changed
- `wallet-account-updated` — account added/removed/renamed/reordered
- `wallet-pending-settled` — pending TX confirmed (dispatched with 2.5s delay)

### Styling

Tailwind CSS 4 with CSS custom properties for theming. Dark theme by default (`next-themes`). Global styles in `src/styles/global.css`. Primary color: `#1adef5` (cyan).

Components in `src/components/ui/` are Radix UI primitives — Biome linting is disabled for that directory.

### i18n

English (`en`) and Spanish (`es`) via `i18next`. Locale files at `src/locales/{en,es}.json`. Language persisted to `localStorage.language`.

## Code Quality

- **No code duplication.** Extract shared logic into `src/lib/` utilities. Reviewers are strict about this.
- **Avoid using `localStorage.getItem('currentIdentity')` to look up vault entries.** The active account may be watch-only and absent from the encrypted vault. Use `vault.list()[0]?.identity` instead.

## CI

GitHub Actions (`.github/workflows/ci.yml`): lint → typecheck → build. Uses Bun 1.3.8.
