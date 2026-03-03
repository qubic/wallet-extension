/**
 * Centralized refresh interval configuration for data fetching.
 * All values are in milliseconds.
 *
 * Refresh Strategy:
 * - Network stats (price): 5 min - infrequent updates
 * - Tick info: 60s - current network tick
 * - Active account data: 30s - user's primary account
 * - Background accounts: 5 min - automatic polling interval for non-selected accounts
 *   (Note: also refreshes immediately when menu opens)
 */

// Network data refresh intervals
export const REFRESH_INTERVAL_LATEST_STATS = 300_000 // 5 minutes
export const REFRESH_INTERVAL_TICK_INFO = 60_000 // 1 minute

// Active account refresh intervals
export const REFRESH_INTERVAL_ACTIVE_BALANCE = 30_000 // 30 seconds
export const REFRESH_INTERVAL_ACTIVE_TRANSACTIONS = 30_000 // 30 seconds

// Non-active account refresh intervals
export const REFRESH_INTERVAL_BACKGROUND_BALANCE = 300_000 // 5 minutes

// Stale time configuration (how long data is considered fresh)
export const STALE_TIME_LATEST_STATS = 60_000 // 1 minute
export const STALE_TIME_TICK_INFO = 30_000 // 30 seconds

// Garbage collection time (how long to keep unused data in cache)
export const GC_TIME_LATEST_STATS = 360_000 // 6 minutes
export const GC_TIME_TICK_INFO = 180_000 // 3 minutes

// Static/infrequent data stale times
export const STALE_TIME_STATIC_DATA = 86_400_000 // 24 hours
export const STALE_TIME_ASSET_ISSUANCES = 86_400_000 // 24 hours
