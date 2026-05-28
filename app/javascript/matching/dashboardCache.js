// Cache dla dashboard payload. InstantClick przy nawigacji wstecz na
// /matching reexekwuje <script> tagi z layoutu, więc module-level `let`
// resetuje się przy każdym powrocie. Trzymamy bufor na `window` żeby
// przeżył InstantClick swap (cała karta to jeden window context).
//
// Inval po akcjach (RSVP / deklaracja / welcome) jest wywoływany przez
// softRefresh.js. TTL 5min jako bezpiecznik.
const KEY = '__matchingDashboardCache';
const TTL_MS = 5 * 60 * 1000;

function read() {
  return typeof window !== 'undefined' ? window[KEY] : null;
}

function write(value) {
  if (typeof window === 'undefined') return;
  window[KEY] = value;
}

export function getCachedDashboard() {
  const cache = read();
  if (!cache) return null;
  if (Date.now() - cache.fetchedAt > TTL_MS) {
    write(null);
    return null;
  }
  return cache.payload;
}

export function setCachedDashboard(payload) {
  write({ payload, fetchedAt: Date.now() });
}

export function invalidateDashboardCache() {
  write(null);
}
