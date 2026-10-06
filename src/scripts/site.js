// Where the site's static files live. Data, vendored libraries and textures
// stay in public/ at fixed URLs, so the bundler cannot hash them; instead the
// deploy's build id rides in the query. A browser holding last deploy's JSON
// in its cache therefore never pairs it with this deploy's code. Next inlines
// both variables at build time (next.config.ts); under node --test they are
// unset and the helpers fall back to a bare origin.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "";

export const SITE = new URL(`${BASE}/`, globalThis.location?.origin ?? "http://localhost");

/** A URL for a file under public/, e.g. asset("weeks/week05/data/heaps.json"). */
export function asset(path) {
  const url = new URL(path, SITE);
  // Vendored libraries carry their version in the file name, so a deploy
  // need not make every reader download them again.
  if (BUILD && !path.startsWith("assets/vendor/")) url.searchParams.set("v", BUILD);
  return url;
}
