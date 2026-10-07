// Your best score per practice round (and for the campaign), kept in this browser twice: in localStorage and
// in a cookie, so clearing one still leaves it. Reading takes the higher of
// the two; saving never lowers it. Private windows may refuse both, and then
// the best lasts only as long as the page. A null key (a round played as a
// campaign level) reads 0 and saves nothing.
const YEAR = 365 * 24 * 60 * 60;

function fromCookie(key: string) {
  const name = `${encodeURIComponent(key)}=`;
  const part = document.cookie.split("; ").find((c) => c.startsWith(name));
  return part ? Number(part.slice(name.length)) || 0 : 0;
}

export function readBest(key: string | null) {
  if (!key) return 0;
  let stored = 0;
  let cookie = 0;
  try {
    stored = Number(localStorage.getItem(key)) || 0;
  } catch {
    // Storage refused; the cookie may still have it.
  }
  try {
    cookie = fromCookie(key);
  } catch {
    // Cookies refused too.
  }
  return Math.max(stored, cookie);
}

export function saveBest(key: string | null, score: number) {
  if (!key) return;
  const best = Math.max(score, readBest(key));
  try {
    localStorage.setItem(key, String(best));
  } catch {
    // Storage refused; the cookie still keeps it.
  }
  try {
    document.cookie = `${encodeURIComponent(key)}=${best}; max-age=${YEAR}; path=/; SameSite=Lax`;
  } catch {
    // Cookies refused; the best lasts as long as the page.
  }
}
