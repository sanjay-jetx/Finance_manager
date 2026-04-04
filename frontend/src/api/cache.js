/**
 * Simple in-memory + localStorage cache with stale-while-revalidate.
 * Provides instant page loads by returning cached data immediately,
 * then re-fetching in the background.
 */

const memCache = {}

const TTL = {
  dashboard: 60_000,       // 60s — financial snapshot
  transactions: 30_000,    // 30s — changes more often
  budgets: 120_000,        // 2m — rarely changes
  metals: 600_000,         // 10m — market rates
  wallets: 120_000,
  goals: 120_000,
  receivables: 60_000,
}

function lsKey(key) { return `fintrack_cache_${key}` }

/** Get value from memory → localStorage → null */
export function getCached(key) {
  // 1. Memory hit
  if (memCache[key]) {
    const { data, ts } = memCache[key]
    if (Date.now() - ts < (TTL[key] ?? 60_000)) return data
  }
  // 2. localStorage hit
  try {
    const raw = localStorage.getItem(lsKey(key))
    if (raw) {
      const { data, ts } = JSON.parse(raw)
      memCache[key] = { data, ts }   // prime memory cache
      if (Date.now() - ts < (TTL[key] ?? 60_000)) return data
    }
  } catch {}
  return null
}

/** Store value in memory + localStorage */
export function setCached(key, data) {
  const entry = { data, ts: Date.now() }
  memCache[key] = entry
  try { localStorage.setItem(lsKey(key), JSON.stringify(entry)) } catch {}
}

/** Invalidate a cache entry (force refresh next time) */
export function invalidateCache(key) {
  delete memCache[key]
  try { localStorage.removeItem(lsKey(key)) } catch {}
}

/** Invalidate all cache entries */
export function invalidateAll() {
  Object.keys(memCache).forEach(k => delete memCache[k])
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('fintrack_cache_'))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}
