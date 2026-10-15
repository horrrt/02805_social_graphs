// Runs before the kit. src/scripts/site.js reads process.env.NEXT_PUBLIC_*,
// which Next inlines at build time; in the Claude Design bundle nothing does,
// so give the read an empty env. Charts read their colour tokens from
// <body>, which needs the corridor class (CorridorRoot also sets it).
const g = globalThis as { process?: { env: Record<string, string | undefined> } };
g.process ??= { env: {} };
// asset() builds every data and image URL from this base, so components that
// load files (Cold Read's decks, word vectors and portraits) fetch them from
// the live site, which serves them to any origin.
g.process.env.NEXT_PUBLIC_BASE_PATH ??= "https://horrrt.github.io/02805_social_graphs";

if (typeof document !== "undefined") {
  const mark = () => document.body?.classList.add("corridor");
  if (document.body) mark();
  else document.addEventListener("DOMContentLoaded", mark, { once: true });
}

// portrait() returns a root-relative path ("/02805_social_graphs/play/…"), which on
// the design kit's origin points nowhere. Point those images at the live site.
if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  const live = new URL(g.process!.env.NEXT_PUBLIC_BASE_PATH!);
  const prefix = live.pathname.replace(/\/$/, "") + "/";
  const fix = (img: HTMLImageElement) => {
    const src = img.getAttribute("src");
    if (src?.startsWith(prefix)) img.src = live.origin + src;
  };
  const scan = (node: Node) => {
    if (node instanceof HTMLImageElement) fix(node);
    else if (node instanceof Element) node.querySelectorAll("img").forEach(fix);
  };
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes") scan(r.target);
      else r.addedNodes.forEach(scan);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
}
