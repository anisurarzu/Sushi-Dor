/** Public grand opening day (Europe/Paris calendar date). */
export const GRAND_OPENING_DATE = "2026-12-01";

function parisDateString(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** True once the restaurant is open (from opening day inclusive). */
export function isRestaurantOpen(now = new Date()) {
  return parisDateString(now) >= GRAND_OPENING_DATE;
}

/** True while we should tease the grand opening (before opening day). */
export function showGrandOpeningBanner(now = new Date()) {
  return !isRestaurantOpen(now);
}
