// Module-level cache dla dashboard payload. Trzyma się przez całe życie
// karty przeglądarki — Preact root re-mountuje się po nawigacji InstantClick
// albo softRefresh, ale cache zostaje, więc kolejne otwarcia /matching nie
// pokazują spinnera "Ładuję twój matching…".
//
// Cache jest invalidowany przez akcje zmieniające stan (RSVP / deklaracja /
// welcome) — po softRefresh wyczyszczamy bufor, następny mount pobiera świeże
// dane. TTL na wszelki wypadek (gdyby user trzymał kartę otwartą godzinami).
const TTL_MS = 5 * 60 * 1000;

let cache = null;

export function getCachedDashboard() {
  if (!cache) return null;
  if (Date.now() - cache.fetchedAt > TTL_MS) {
    cache = null;
    return null;
  }
  return cache.payload;
}

export function setCachedDashboard(payload) {
  cache = { payload, fetchedAt: Date.now() };
}

export function invalidateDashboardCache() {
  cache = null;
}
