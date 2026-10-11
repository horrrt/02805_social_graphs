// Split src/kit/README.md into one doc per component for the design-sync
// converter: each "### Name(" section under a "## Group" heading becomes
// gen/docs/<Name>.md with that group as its category. Lower-case helpers
// (palette, wikiLink) are not components and are skipped.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const text = readFileSync(new URL("../../src/kit/README.md", import.meta.url), "utf8");
const out = new URL("./gen/docs/", import.meta.url);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let group = null;
let name = null;
let body = [];
const flush = () => {
  if (name && group) writeFileSync(new URL(`${name}.md`, out), `---\ncategory: ${group}\n---\n\n${body.join("\n").trim()}\n`);
  name = null;
  body = [];
};
for (const line of text.split("\n")) {
  const h2 = line.match(/^## (.+)/);
  const h3 = line.match(/^### ([A-Za-z]+)\(/);
  if (h2) { flush(); group = h2[1].trim(); continue; }
  if (h3) { flush(); name = /^[A-Z]/.test(h3[1]) ? h3[1] : null; if (name) body.push(line); continue; }
  if (name) body.push(line);
}
flush();
