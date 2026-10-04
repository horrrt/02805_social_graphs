// Pins the site's one type scale: every stylesheet and every page style takes
// its font sizes and families from the tokens in src/styles/type.css.
// Runs in node with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtPage, codeFiles } from "./built-page.mjs";

const CSS = fileURLToPath(new URL("../src/styles/", import.meta.url));
const SCRIPTS = fileURLToPath(new URL("../src/scripts/", import.meta.url));
const ROOT = fileURLToPath(new URL("../", import.meta.url));
// Sizes typed into JSX: fontSize={11}, fontSize="11px", font-size="11".
const JSX_LITERALS = [/fontSize=\{\s*\d/, /fontSize\s*=\s*["'`]?\d/, /font-size=["']?\d/];
// Code moving out of src/scripts, as [repo-relative path, text], at any depth.
const moved = (dir, skip = []) =>
  codeFiles(join(ROOT, dir), /\.(js|mjs|ts|tsx)$/)
    .map((path) => path.slice(ROOT.length))
    .filter((rel) => !skip.some((prefix) => rel.startsWith(prefix)))
    .map((rel) => [rel, readFileSync(join(ROOT, rel), "utf8")]);
const linesMatching = (name, src, patterns) => {
  const found = [];
  src.split("\n").forEach((line, i) => {
    if (patterns.some((re) => re.test(line))) found.push(`${name}:${i + 1}: ${line.trim()}`);
  });
  return found;
};
// type.css defines the tokens. mockups.css styles public/mockups/, a set of
// explorations that stays outside the scale.
const SKIP = ["type.css", "mockups.css"];
const PAGES = [
  "index.html",
  "weeks/week01/index.html",
  "weeks/week02/index.html",
  "weeks/week03/index.html",
  "weeks/week04/index.html",
  "weeks/week05/index.html",
  "play/index.html",
  "styleguide/index.html",
];

// Walks a stylesheet and yields each font declaration with the selector (or
// at-rule) of the block it sits in.
function* declarations(src) {
  const stack = [];
  let buf = "";
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i + 2) + 1;
      continue;
    }
    if (c === "{") {
      stack.push(buf.trim().replace(/\s+/g, " "));
      buf = "";
    } else if (c === "}" || c === ";") {
      const decl = buf.trim().replace(/\s+/g, " ");
      if (/^font(-size|-family)?\s*:/.test(decl)) yield { selector: stack.at(-1) ?? "", decl };
      if (c === "}") stack.pop();
      buf = "";
    } else buf += c;
  }
}

function problems(where, selector, decl) {
  const [, prop, raw] = decl.match(/^(font(?:-size|-family)?)\s*:\s*(.*)$/);
  const value = raw.replace(/\s*!important$/, "");
  // @font-face names the face it loads; that is not a use of a family.
  if (selector.startsWith("@font-face")) return [];
  // Form controls take the whole font from their parent. Any other shorthand
  // would hide a size or family from the checks below.
  if (prop === "font") return value === "inherit" ? [] : [`${where} ${selector} { ${decl} } uses the font shorthand`];
  if (prop === "font-size") {
    if (/^var\(--fs-[a-z0-9]+\)$/.test(value) || value === "inherit") return [];
    // The Week 4 rail hides its link text and shows only the dot.
    if (value === "0" && selector === ".corridor .w4-rail a") return [];
    return [`${where} ${selector} { ${decl} } is not a --fs- token`];
  }
  if (/^var\(--font-(sans|display|mono)\)$/.test(value) || value === "inherit") return [];
  // The styleguide's opt-in skins keep their own families on purpose.
  if (selector.includes("[data-skin=")) return [];
  return [`${where} ${selector} { ${decl} } is not a --font- token`];
}

test("stylesheets take font sizes and families from the type scale", () => {
  const found = [];
  for (const file of readdirSync(CSS).filter((f) => f.endsWith(".css") && !SKIP.includes(f))) {
    for (const { selector, decl } of declarations(readFileSync(join(CSS, file), "utf8")))
      found.push(...problems(file, selector, decl));
  }
  assert.deepEqual(found, []);
});

test("page styles take font sizes and families from the type scale", () => {
  const found = [];
  for (const page of PAGES) {
    const html = builtPage(join("out", page));
    for (const [, block] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      for (const { selector, decl } of declarations(block)) found.push(...problems(page, selector, decl));
    }
    for (const [, style] of html.matchAll(/\sstyle="([^"]*)"/g)) {
      for (const decl of style.split(";").map((d) => d.trim()))
        if (/^font(-size|-family)?\s*:/.test(decl)) found.push(...problems(page, "[style]", decl));
    }
  }
  assert.deepEqual(found, []);
});

test("week 4 chart code takes every font size from the type scale", () => {
  // Numeric sizes in SVG attributes, ECharts options or inline styles must come
  // from fs()/font() in src/scripts/type-scale.mjs instead.
  const JS = SCRIPTS;
  const literal = [
    /fontSize:\s*\d/,
    /"font-size":\s*\d/,
    /font-size="\d/,
    /font-size:\s*\d/,
    /\bfont:\s*"\d/,
    // setAttribute("font-size", 11) and .style("font-size", "11px")
    /["']font-size["']\s*,\s*["']?\d/,
    // a canvas font with a typed size
    /\.font\s*=\s*["'`][^"'`$]*\d+(\.\d+)?px/,
  ];
  const found = [];
  for (const file of readdirSync(JS).filter((f) => /^week04-.*\.js$/.test(f))) {
    readFileSync(join(JS, file), "utf8").split("\n").forEach((line, i) => {
      if (literal.some((re) => re.test(line))) found.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  for (const [file, src] of moved("src/features/week04")) found.push(...linesMatching(file, src, [...literal, ...JSX_LITERALS]));
  assert.deepEqual(found, []);
});

// Every chart script outside Week 4: the canvas renderers of weeks 1 to 3, the
// Week 3 variants, Play's map and the shared helpers. Canvas fonts come from
// font(), ECharts and D3 sizes from fs().
const OTHER_JS_LITERALS = [
  /fontSize:\s*\d/,
  /fontSize\s*=\s*["'`]?\d/,
  /\.attr\(\s*["']font-size["']\s*,\s*["']?\d/,
  /font-size["']?\s*[:=]\s*["']?\d/,
  // A canvas font string with a size typed in, "600 10px …" or `${x ? 10 : 13}px`.
  // A size computed from the layout, `${cw * 0.4}px`, passes.
  /\.font\s*=\s*[`"'](?:[^;]*?[\s"'`])?\d+(?:\.\d+)?px/,
  /\.font\s*=\s*[`"'][^;]*?[?:]\s*\d+(?:\.\d+)?\s*\}px/,
];

// The screen-test prototype (public/prototypes/, via pages/screen-test.js) keeps
// its own fonts and sizes, as mockups.css does; it was inline in its page before.
const OUTSIDE_SCALE = ["pages/screen-test.js"];

function otherChartScripts(dir, prefix = "") {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + entry.name;
    if (entry.isDirectory()) files.push(...otherChartScripts(join(dir, entry.name), `${rel}/`));
    else if (/\.m?js$/.test(entry.name) && !/^week04-/.test(entry.name) && entry.name !== "type-scale.mjs" && !OUTSIDE_SCALE.includes(rel))
      files.push(rel);
  }
  return files;
}

function fontLiterals(name, src) {
  const found = [];
  src.split("\n").forEach((line, i) => {
    if (OTHER_JS_LITERALS.some((re) => re.test(line))) found.push(`${name}:${i + 1}: ${line.trim()}`);
  });
  return found;
}

test("chart code outside week 4 takes every font size from the type scale", () => {
  const JS = SCRIPTS;
  const found = otherChartScripts(JS).flatMap((f) => fontLiterals(f, readFileSync(join(JS, f), "utf8")));
  // Components and hooks outside Week 4; the screen-test prototype keeps its own sizes.
  const elsewhere = [
    ...moved("src/lib"),
    ...moved("src/kit"),
    ...moved("src/features", ["src/features/week04/", "src/features/screen-test/"]),
    ...moved("src/components"),
  ];
  for (const [file, src] of elsewhere) found.push(...linesMatching(file, src, [...OTHER_JS_LITERALS, ...JSX_LITERALS]));
  assert.deepEqual(found, []);
});

test("the font-size guard catches the literals it replaced", () => {
  for (const line of [
    'ctx.font = "600 10px -apple-system, system-ui, sans-serif";',
    "ctx.font = `${chosen ? 700 : 500} 11px -apple-system, sans-serif`;",
    'c.font = `${active ? "600 " : ""}${w < 550 ? 10 : 13}px ${SANS}`;',
    "c.font = `12px ${SANS}`;",
    '.attr("font-size", 10)',
    "axisLabel: { color: MUTE, fontSize: 10 },",
    'text.style.fontSize = "12px";',
  ])
    assert.equal(fontLiterals("x", line).length, 1, line);
  for (const line of [
    'ctx.font = NAME();',
    "c.font = `bold ${cw * 0.4}px ${family(\"sans\")}`;",
    '.attr("font-size", fs("caption"))',
    'axisLabel: { color: MUTE, fontSize: fs("caption") },',
  ])
    assert.equal(fontLiterals("x", line).length, 0, line);
});

test("the JSX font-size guard catches typed sizes and passes the scale", () => {
  for (const line of ['<text fontSize={11}>', '<text fontSize="11px">', '<text font-size="11">'])
    assert.equal(linesMatching("x", line, JSX_LITERALS).length, 1, line);
  for (const line of ['<text fontSize={fs("caption")}>', "<text style={{ fontSize: \"var(--fs-caption)\" }}>"])
    assert.equal(linesMatching("x", line, JSX_LITERALS).length, 0, line);
});
