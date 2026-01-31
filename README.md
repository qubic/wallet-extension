# wallet-extension
Qubic Wallet Browser Extension

## Getting started
- Install dependencies: `bun install`
- Start dev server: `bun dev`
- Extension live rebuild: `bun run dev:extension`
- Build extension: `bun run build`

## Load in Chrome
1. Build the extension: `bun run build`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist` folder
5. Click the extension icon to open the popup

## Live rebuild workflow (no reloading the extension)
1. Run `bun run dev:extension` (outputs to `dist-dev`)
2. In Chrome, load `dist-dev` once via **Load unpacked**
3. Keep the popup open or reopen it to see updates as files change

## Folder structure
```
public/
  manifest.json          # Chrome MV3 manifest
src/
  app/                   # App entry wrapper
  components/            # Reusable UI pieces
  locales/               # i18n strings
  pages/                 # Routed screens
  router/                # Route definitions
  styles/                # Global styles
  i18n.ts                # Localization setup
  main.tsx               # React entry
popup.html               # Popup entry point
index.html               # Dev entry point
```

## Notes
- Popup uses HashRouter so navigation works inside the extension popup.
- Language selection persists via `localStorage`.
