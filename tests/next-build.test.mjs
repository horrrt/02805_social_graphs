// Checks on what Next builds from src/ that the page tests do not see: no
// page loads the retired entry scripts, and the CSS minifier leaves alone what the scripts
// and the cascade depend on. Reads the source and out/ (npm run build).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./built-page.mjs";

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

test("no page loads scripts through the retired entry loader", () => {
  // Every page renders with React; a page runs a script only when one of its
  // components imports it.
  assert.ok(!existsSync(join(ROOT, "src/components/PageScripts.tsx")), "PageScripts.tsx is gone");
  assert.ok(!existsSync(join(ROOT, "src/scripts/entries")), "src/scripts/entries/ is gone");
  for (const file of walk(join(ROOT, "src/app")).filter((f) => /\.tsx?$/.test(f))) {
    const src = readFileSync(file, "utf8");
    assert.doesNotMatch(src, /<PageScripts|@\/components\/PageScripts|@\/scripts\/entries\//, `${file} still loads the legacy entry`);
  }
});

const css = () =>
  walk(join(ROOT, "out/_next/static"))
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");

test("the colours the week 3 scripts append an alpha to stay six-digit hex", () => {
  // corridor.js and variants/d3.js write `${PEOPLE}66`; a minified #f80 would
  // turn that into the invalid #f8066.
  const built = css();
  for (const token of ["--people", "--access"]) {
    const values = [...built.matchAll(new RegExp(`${token}:([^;}]+)`, "g"))].map((m) => m[1].trim());
    assert.ok(values.length, `${token} is in the built CSS`);
    for (const v of values) assert.match(v, /^#[0-9a-f]{6}$/i, `${token}: ${v}`);
  }
});

test("no built rule puts a font longhand before the font shorthand that resets it", () => {
  const offenders = [];
  for (const [, selector, body] of css().matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = body.split(";").map((d) => d.split(":")[0].trim());
    const shorthand = decls.lastIndexOf("font");
    if (shorthand < 0) continue;
    const early = decls.slice(0, shorthand).filter((d) => /^font-(variant|feature|kerning|stretch|style|weight|size|family)/.test(d));
    if (early.length) offenders.push(`${selector.trim()}: ${early.join(", ")} before font`);
  }
  assert.deepEqual(offenders, []);
});
