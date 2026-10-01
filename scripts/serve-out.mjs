// Serves the static export in out/ under the base path GitHub Pages uses, so
// the production build can be checked locally: npm run build && npm run preview,
// then open http://127.0.0.1:8767/02805_social_graphs/. No dependencies.
// OUT names another export directory (scripts/parity serves two side by side).
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = process.env.OUT ? resolve(process.env.OUT) + sep : fileURLToPath(new URL("../out/", import.meta.url));
const BASE = "/02805_social_graphs/";
const PORT = Number(process.env.PORT ?? 8767);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".ttf": "font/ttf", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".csv": "text/csv",
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!path.startsWith(BASE)) {
    res.writeHead(302, { location: BASE }).end();
    return;
  }
  let file = normalize(join(OUT, path.slice(BASE.length)));
  if (!file.startsWith(OUT)) return void res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) file = join(OUT, "404.html");
  res.writeHead(file.endsWith("404.html") && !path.endsWith("404.html") ? 404 : 200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log(`out/ on http://127.0.0.1:${PORT}${BASE}`));
