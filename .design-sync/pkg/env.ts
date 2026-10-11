// Runs before the kit. src/scripts/site.js reads process.env.NEXT_PUBLIC_*,
// which Next inlines at build time; in the Claude Design bundle nothing does,
// so give the read an empty env. Charts read their colour tokens from
// <body>, which needs the corridor class (CorridorRoot also sets it).
const g = globalThis as { process?: { env: Record<string, string | undefined> } };
g.process ??= { env: {} };

if (typeof document !== "undefined") {
  const mark = () => document.body?.classList.add("corridor");
  if (document.body) mark();
  else document.addEventListener("DOMContentLoaded", mark, { once: true });
}
