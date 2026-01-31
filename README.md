# wallet-extension
Qubic Wallet Browser Extension

## Getting started
- Install dependencies: `bun install`
- Start dev server: `bun dev`
- Build extension: `bun run build`

## Load in Chrome
1. Build the extension: `bun run build`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist` folder
5. Click the extension icon to open the popup

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
