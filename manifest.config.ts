import { version as pkgVersion } from './package.json'

export type ManifestMode = 'production' | 'development'

// Chrome MV3 requires `version` to be 1–4 dot-separated integers. Map the
// semver prerelease counter to the 4th segment (e.g. "1.0.0-beta.7" → "1.0.0.7")
// and keep the original string visible via `version_name`.
const version = pkgVersion.replace(/-[a-z]+\.(\d+)$/, '.$1')
const versionName = pkgVersion

const ICONS = {
  16: 'icons/light-16.png',
  32: 'icons/light-32.png',
  48: 'icons/light-48.png',
  128: 'icons/light-128.png',
}

const WEB_ACCESSIBLE_RESOURCES = [
  'assets/inpage-provider.js',
  'assets/dapp-protocol.js',
  'assets/dapp-timing.js',
]

const HOST_MATCHES = ['http://*/*', 'https://*/*']

const HOST_PERMISSIONS = ['https://rpc.qubic.org/*', 'https://static.qubic.org/*', ...HOST_MATCHES]

export const buildManifest = (mode: ManifestMode) => {
  const isDev = mode === 'development'

  const base = {
    manifest_version: 3,
    version,
    version_name: versionName,
    icons: ICONS,
    action: {
      default_title: 'Qubic Wallet',
      default_popup: 'popup.html',
      default_icon: ICONS,
    },
    permissions: ['sidePanel', 'windows', 'storage'],
    host_permissions: HOST_PERMISSIONS,
    background: {
      service_worker: 'assets/background.js',
      type: 'module' as const,
    },
    content_scripts: [
      {
        matches: HOST_MATCHES,
        js: ['assets/content-script.js'],
        run_at: 'document_start' as const,
      },
    ],
    web_accessible_resources: [
      {
        resources: WEB_ACCESSIBLE_RESOURCES,
        matches: HOST_MATCHES,
      },
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; font-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self' https://rpc.qubic.org https://static.qubic.org",
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
  }

  if (isDev) {
    return {
      ...base,
      name: 'Qubic Wallet (Dev)',
      description: 'Development build of the Qubic Wallet extension.',
    }
  }

  return {
    ...base,
    name: '__MSG_appName__',
    description: '__MSG_appDescription__',
    default_locale: 'en',
  }
}
