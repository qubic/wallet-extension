# Code Review: `feat/dapp-window-qubic-api`

**Branch:** `feat/dapp-window-qubic-api` (18 commits, 86 files, +7552/-2641 lines)
**Reviewed:** 2026-02-26
**Totals:** 1 Critical, 2 High, 4 Medium, 7 Low

---

## Critical Issues (1)

### 1. Zero-amount transactions rejected

**File:** `src/lib/dapp/signing.ts:121`

The guard `!parsedAmount || parsedAmount < 0n` rejects `amount: 0` because `!0n` evaluates to `true` in JavaScript (BigInt zero is falsy). Zero-amount transactions are legitimate for smart contract calls with `inputType > 0`. Any dApp invoking a SC function with `amount: 0` will get an `INVALID_PARAMS` error.

```ts
// Current (broken)
if (!parsedAmount || parsedAmount < 0n) {
  throw new DappProviderError('INVALID_PARAMS', 'Invalid amount')
}

// Fix
if (parsedAmount == null || parsedAmount < 0n) {
  throw new DappProviderError('INVALID_PARAMS', 'Invalid amount')
}
```

---

## High Priority (2)

### 2. App reset doesn't clear chrome.storage.local

**Files:** `src/lib/storage.ts:18-32`, `src/pages/settings/security.tsx:120-123`

`clearWalletStorage()` only clears `localStorage` keys, but the vault is now mirrored to `chrome.storage.local` via the hybrid store (`qubic.vault:chrome`). On next startup, `syncVaultStorageMirror()` reads from chrome.storage.local and restores everything, effectively undoing the reset. Dapp permissions (`dapp.permissions.v1`), pending requests, and execution state in chrome.storage.local also survive the reset.

**Suggested fix:** Also call `chrome.storage.local.remove([...keys])` for all dapp and vault mirror keys:

```ts
export const clearWalletStorage = () => {
  // ... existing localStorage clearing ...

  // Also clear chrome.storage.local mirror
  const chromeStorage = getChromeLocalStorage()
  if (chromeStorage) {
    chromeStorage.remove([
      'qubic.vault:chrome',
      'dapp.permissions.v1',
      'dapp.currentAccount.v1',
      'dapp.pendingRequests.v1',
      'dapp.executionRequests.v1',
      'dapp.requestResults.v1',
    ])
  }
}
```

### 3. Uses `localStorage.getItem('currentIdentity')` in session-sync

**File:** `src/lib/dapp/session-sync.ts:7`

Project convention explicitly warns against using `localStorage.getItem('currentIdentity')` to look up vault entries -- the active account may be watch-only and absent from the encrypted vault. If a watch-only account is selected, the dapp snapshot will contain that identity, but signing will fail with a confusing error downstream.

**Suggested fix:** Use `vault.list()[0]?.identity` instead, or add explicit handling and documentation for why watch-only is intentionally acceptable here (e.g., the controller already rejects signing for watch-only accounts at a later stage).

---

## Medium Priority (4)

### 4. Approval decision messages lack sender validation

**File:** `src/extension/background.ts:35-47`

`RUNTIME_APPROVAL_DECISION_TYPE` messages are processed without verifying `sender.id === chrome.runtime.id` or that the sender is an extension page (not a content script). For `connect` approvals (no passphrase required), a compromised content script could forge an auto-approval.

**Suggested fix:**

```ts
if (baseEnvelope.data.type === RUNTIME_APPROVAL_DECISION_TYPE) {
  // Only accept approval decisions from extension UI pages, not content scripts
  if (sender.id !== chrome.runtime.id || sender.tab) {
    sendResponse({ ok: false })
    return undefined
  }
  // ... rest of handler
}
```

### 5. TOCTOU race condition in approval execution

**Files:** `src/lib/dapp/request-store.ts:92-103`, `src/lib/dapp/controller.ts:244-281`

`markExecutionRequestExecuting` does a non-atomic read-check-write on chrome.storage. Two near-simultaneous approvals (e.g., user has both popup and sidepanel open) could both pass the `awaitingApproval` check before either writes `executing`, causing double signing. The `await` points in the async chain yield control, creating a real interleaving window.

**Suggested fix:** Add an in-memory `Set<string>` of processing IDs as a synchronous guard:

```ts
const executingIds = new Set<string>()

export const handleDappApprovalDecision = async (decision: DappApprovalDecision) => {
  if (executingIds.has(decision.id)) return true
  executingIds.add(decision.id)
  try {
    // ... existing logic ...
  } finally {
    executingIds.delete(decision.id)
  }
}
```

### 6. Catch blocks swallow size-limit errors

**File:** `src/lib/dapp/signing.ts:97-105, 170-179`

In `decodeInputBytes`, the `try/catch` catches both base64 decode failures AND the `DappProviderError('inputBytes too large')` thrown at line 100, replacing it with a generic `'Invalid inputBytes encoding'` message. Same pattern in `parseMessageBytes` where `'Message too large'` becomes `'Invalid message payload'`.

**Suggested fix:**

```ts
try {
  const bytes = base64ToBytes(trimmed)
  if (bytes.length > MAX_INPUT_BYTES) {
    throw new DappProviderError('INVALID_PARAMS', 'inputBytes too large')
  }
  return bytes
} catch (error) {
  if (error instanceof DappProviderError) throw error
  throw new DappProviderError('INVALID_PARAMS', 'Invalid inputBytes encoding')
}
```

### 7. Duplicated `toBase64`/`fromBase64` implementations

**Files:** `src/lib/dapp/signing.ts:16-25`, `src/lib/dapp/execution-payload-crypto.ts:11-19`

Both files have nearly identical chunked base64 encode/decode functions. `src/lib/vault-export.ts` has yet another copy. Project convention: "No code duplication -- extract shared logic into `src/lib/` utilities."

**Suggested fix:** Extract into a shared `src/lib/encoding.ts` utility and import from there.

---

## Low Priority / Suggestions (7)

### 8. Redundant `isDappApprovalPopup` re-declaration

**File:** `src/components/dapp/dapp-approval-drawer.tsx:144-146`

`isDappApprovalPopup` is computed at the component level (lines 38-40) and then re-computed with identical logic inside `submitDecision` (lines 144-146), shadowing the outer declaration. The outer variable is already in closure scope.

### 9. Popup closes with remaining pending requests

**File:** `src/components/dapp/dapp-approval-drawer.tsx:147-149`

After approving/rejecting the first request, `window.close()` is called if this is a dapp popup. If multiple requests are pending, the remaining ones won't be shown to the user and will timeout after 2 minutes.

**Suggested fix:** Only close when `requests.length <= 1`.

### 10. Request IDs use weak randomness

**File:** `src/extension/inpage-provider.ts:109`

Request IDs use `Date.now()` + `Math.random()`. Not exploitable alone due to session/origin checks, but `crypto.getRandomValues` would be better for defense-in-depth.

### 11. Dead export: `discardRequestResult`

**File:** `src/lib/dapp/request-store.ts:140-142`

`discardRequestResult` is exported but never called anywhere in the codebase. Remove or document why it exists.

### 12. Magic numbers for popup window dimensions

**File:** `src/lib/dapp/controller.ts:82-83`

`width: 380` and `height: 600` are inline magic numbers. Extract named constants (e.g., `DAPP_APPROVAL_WINDOW_WIDTH`). Note: `380` differs from the `360` popup viewport in `main.tsx` -- verify if the 20px difference for window chrome is intentional.

### 13. Unsafe `as` casts after Zod parse

**File:** `src/lib/dapp/request-store.ts:29, 89`

`as DappExecutionRequest` casts after Zod `safeParse` bypass type checking. The line 89 cast is more concerning because it spreads a validated object and overrides `params` with a decrypted value. Consider `satisfies` or re-validation after param decryption.

### 14. Duplicated Chrome API access pattern

**Files:** `src/components/dapp/dapp-approval-drawer.tsx:49, 107`, `src/pages/settings/connected-sites.tsx:29`, `src/lib/vault.ts:16`

Multiple files inline the same `(globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome` cast instead of using the centralized `getChromeApi()` from `src/lib/dapp/chrome-api.ts`.

---

## License Compliance

All 10 new devDependencies are **MIT** licensed. No issues.

| Package | License |
|---------|---------|
| `@commitlint/cli` | MIT |
| `@commitlint/config-conventional` | MIT |
| `@semantic-release/changelog` | MIT |
| `@semantic-release/commit-analyzer` | MIT |
| `@semantic-release/git` | MIT |
| `@semantic-release/github` | MIT |
| `@semantic-release/npm` | MIT |
| `@semantic-release/release-notes-generator` | MIT |
| `@types/chrome` | MIT |
| `semantic-release` | MIT |

---

## Positive Security Properties

The following security aspects are well-implemented:

- **Seed/key isolation:** Private seeds never leave the background service worker. Only signatures/txBytes are returned.
- **Origin validation:** Origins derived from `sender.url` (Chrome-provided, not spoofable). Only `http:` and `https:` protocols accepted.
- **Encrypted params at rest:** Transaction parameters awaiting approval are AES-GCM encrypted with a key in `chrome.storage.session` (ephemeral).
- **User approval required:** All sensitive operations require explicit popup/sidepanel approval. Signing also requires the vault passphrase.
- **Request rate limiting:** Capped at 20 total and 5 per origin pending requests.
- **Request expiration:** Pending requests and results expire after 2 minutes.
- **Result ownership validation:** Polling for results validates origin and session against stored request.
- **CSP for extension pages:** Manifest sets `script-src 'self'` for extension pages.
- **Frozen provider object:** `window.qubic` is created with `Object.freeze` and `Object.defineProperty` with `writable: false, configurable: false`.
- **No innerHTML/dangerouslySetInnerHTML:** Dapp-provided data is rendered via React JSX (auto-escaped).
- **Passphrase not stored:** Entered in the approval drawer, used once, then cleared.

---

## Overall Assessment

The dapp API architecture is solid with strong security fundamentals. The **critical issue** (zero-amount rejection) will break smart contract dApp integrations and should be fixed before merge. The **app reset not clearing chrome.storage** is a real regression that would leave user data behind after a "Reset App". The **medium** findings are defense-in-depth improvements worth addressing -- particularly the sender validation gap in approval decisions.
