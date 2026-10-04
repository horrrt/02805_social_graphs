// The rules React code on this site follows (review/react-migration/plan.json,
// architecture sections 1, 4 and 8). A static export never navigates on the
// client, so routing hooks, lazy loading and Suspense have no place here;
// React renders every element, so DOM writes stay in the few files that own a
// raw drawing surface or bridge a page's old script until it converts; and
// every client component is an island with a declared footprint. Reads the
// files as text, so it needs no build.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, codeFiles } from "./built-page.mjs";

const DIRS = ["src/features", "src/kit", "src/components", "src/lib"];
const entryExists = (entry) => existsSync(join(ROOT, "src/scripts/entries", `${entry}.js`));

const BANNED = [
  [/\buseSearchParams\b/, "useSearchParams"],
  [/\busePathname\b/, "usePathname"],
  [/\buseRouter\b/, "useRouter"],
  [/["']next\/link["']/, "next/link"],
  [/["']next\/dynamic["']/, "next/dynamic"],
  [/\bReact\.lazy\b/, "React.lazy"],
  [/\{[^}]*\blazy\b[^}]*\}\s*from\s*["']react["']/, "lazy from react"],
  [/<Suspense\b/, "<Suspense"],
  [/(?<![.\w])use\(/, "use()"],
];

const DOM_WRITES = [
  [/\.classList\./, ".classList."],
  [/\.setAttribute\(/, ".setAttribute("],
  [/\.innerHTML\b/, ".innerHTML"],
  [/\.textContent\s*=(?!=)/, ".textContent ="],
  [/\.replaceChildren\(/, ".replaceChildren("],
  [/\binsertAdjacentHTML\b/, "insertAdjacentHTML"],
  [/\.hidden\s*=(?!=)/, ".hidden ="],
  [/\bappendChild\(/, "appendChild("],
  [/\.append\(/, ".append("],
];

const CLICK = /\bdocument\.addEventListener\(\s*["']click["']/;
const CHART_HOOKS = /\b(?:useData|useVendor|useEChart\w*|useCanvasPaint|useDeck|useGlobe)\b|\bthrow\b/;

// The page entries a features folder belongs to while its old script runs.
const FEATURE_ENTRIES = {
  week03: ["week03"],
  styleguide: ["styleguide"],
  "kit-page": ["kit"],
  template: ["template"],
  arcade: ["week01", "week02"],
  week01: ["week01"],
  week02: ["week02"],
  week04: ["week04"],
  week05: ["week05"],
  play: ["play"],
  mockups: ["mockups"],
  "screen-test": ["screen-test"],
};

// JsonLd in src/components/agentMeta.tsx renders schema.org JSON-LD into a
// <script>. The file predates the rewrite, so it keeps this one pinned use
// until review/react-migration/requests/P1.md gives it an `// allow-html:` home.
const JSON_LD = {
  file: "src/components/agentMeta.tsx",
  html: 'dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\\\u003c") }}',
};

// Code without its comments, so a rule never trips on prose about an API.
const code = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => (/^\s*\/\//.test(line) ? "" : line))
    .join("\n");

const isClient = (src) => /^\s*(?:(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*)*["']use client["']/.test(src);

// The text of a call's arguments, from the "(" at `open` to its match.
function callArgs(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")" && --depth === 0) return src.slice(open + 1, i);
  }
  return src.slice(open + 1);
}

// The components a module exports, each with the arguments of the island(…)
// call that creates it, or null when something else does.
function exportedComponents(src) {
  const names = new Set();
  const out = [];
  for (const [, name] of src.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Z][\w$]*)/gm)) names.add(name);
  for (const [, list] of src.matchAll(/^export\s*\{([^}]*)\}/gm))
    for (const item of list.split(",").map((s) => s.trim()).filter(Boolean)) {
      const [local, as = local] = item.split(/\s+as\s+/).map((s) => s.trim());
      if (/^[A-Z]/.test(as) || as === "default") names.add(local);
    }
  for (const [, name] of src.matchAll(/^export\s+default\s+([A-Za-z_$][\w$]*)\s*;?\s*$/gm)) names.add(name);
  for (const m of src.matchAll(/^export\s+default\s+(?:async\s+)?(?:function|class)\b\s*([\w$]*)/gm)) out.push([m[1] || "default", null]);
  for (const m of src.matchAll(/^export\s+default\s+island\(/gm)) out.push(["default", callArgs(src, m.index + m[0].length - 1)]);
  for (const name of names) {
    const m = src.match(new RegExp(`(?:const|let|var)\\s+${name.replace(/\$/g, "\\$")}\\s*=\\s*island\\(`));
    out.push([name, m ? callArgs(src, m.index + m[0].length - 1) : null]);
  }
  return out;
}

/** What a file breaks, given its repo-relative path and text. */
function violations(rel, src, hasEntry = entryExists) {
  const out = [];
  const body = code(src);
  const name = rel.split("/").pop();
  const header = src.split("\n")[0].match(/^\/\/ (surface|bridge|shim|allow-html): \S/)?.[1] ?? null;
  const featurePage = rel.match(/^src\/features\/([^/]+)\//)?.[1];
  const bridgeOk = Boolean(featurePage && (FEATURE_ENTRIES[featurePage] ?? []).some(hasEntry));
  const inLib = rel.startsWith("src/lib/");
  const inKit = rel.startsWith("src/kit/");

  if (header === "surface" && !(inLib || inKit)) out.push("`// surface:` is allowed only under src/lib and src/kit");
  if ((header === "bridge" || header === "shim") && !bridgeOk)
    out.push(`\`// ${header}:\` is allowed only under src/features/<page>/ while the page's entry exists`);
  if (header === "allow-html" && !inLib) out.push("`// allow-html:` is allowed only under src/lib");

  for (const [re, what] of BANNED) if (re.test(body)) out.push(`uses ${what}`);

  const mayWrite = (header === "surface" && (inLib || inKit)) || ((header === "bridge" || header === "shim") && bridgeOk);
  if (!mayWrite) for (const [re, what] of DOM_WRITES) if (re.test(body)) out.push(`writes the DOM with ${what}`);
  const mayClick = inLib || ((header === "bridge" || header === "shim") && bridgeOk);
  if (!mayClick && CLICK.test(body)) out.push('adds a document "click" listener');

  if (/\bdangerouslySetInnerHTML\b/.test(body)) {
    const pinned = rel === JSON_LD.file && body.split("dangerouslySetInnerHTML").length === 2 && body.includes(JSON_LD.html);
    if (!(header === "allow-html" && inLib) && !pinned) out.push("uses dangerouslySetInnerHTML");
  }

  if (/\.tsx$/.test(name) && rel.startsWith("src/features/") && isClient(src) && !name.endsWith("Shell.tsx"))
    for (const [component, args] of exportedComponents(body)) {
      if (args === null) out.push(`exports ${component} without island(…)`);
      else if (!/\broots\s*:/.test(args)) out.push(`island ${component} declares no roots:`);
    }
  if (name.endsWith("Shell.tsx") && CHART_HOOKS.test(body)) out.push(`a shell uses ${body.match(CHART_HOOKS)[0]}`);
  if (/^slots.*\.tsx$/.test(name) && isClient(src)) out.push("a slots file is 'use client'");

  if (/\.tsx$/.test(name)) {
    const rendersUrl = /\b[\w-]+=\{\s*(?:url|asset)\(/.test(body) || /\b[\w-]+=\{[^{}]*\bSITE\b/.test(body);
    if (rendersUrl && !/\buseHydrated\(/.test(body)) out.push("renders url()/asset()/SITE into an attribute without useHydrated()");
  }
  return out;
}

test("React code keeps to the site's rules", () => {
  const files = DIRS.flatMap((dir) => codeFiles(join(ROOT, dir), /\.(js|mjs|ts|tsx)$/));
  console.log(`react rules: ${files.length} files checked`);
  const found = files.flatMap((path) => {
    const rel = relative(ROOT, path);
    return violations(rel, readFileSync(path, "utf8")).map((v) => `${rel}: ${v}`);
  });
  assert.deepEqual(found, []);
});

test("the JSON-LD exemption covers exactly one pinned use", () => {
  const src = readFileSync(join(ROOT, JSON_LD.file), "utf8");
  assert.ok(src.includes(JSON_LD.html), `${JSON_LD.file} still renders JSON-LD the reviewed way`);
  assert.deepEqual(violations(JSON_LD.file, src.replace(JSON_LD.html, `${JSON_LD.html} dangerouslySetInnerHTML={{ __html: x }}`)), ["uses dangerouslySetInnerHTML"]);
  assert.deepEqual(violations("src/components/Other.tsx", src), ["uses dangerouslySetInnerHTML"]);
});

test("each rule catches what it bans and passes what it allows", () => {
  const yes = () => true;
  const no = () => false;
  const check = (rel, src, expected, hasEntry = yes) => assert.deepEqual(violations(rel, src, hasEntry), expected, `${rel}: ${src}`);
  check("src/features/week05/a.tsx", 'import { useSearchParams } from "next/navigation";', ["uses useSearchParams"]);
  check("src/kit/a.tsx", 'import Link from "next/link";', ["uses next/link"]);
  check("src/lib/a.ts", "const v = use(promise);", ["uses use()"]);
  check("src/lib/a.ts", "echarts.use([Bar]); reuse(x);", []);
  check("src/lib/a.ts", "// useRouter would navigate\nconst x = 1;", []);
  check("src/kit/a.tsx", "el.classList.add('x');", ["writes the DOM with .classList."]);
  check("src/kit/a.tsx", "// surface: the canvas\nel.classList.add('x');", []);
  check("src/features/week05/a.js", "// surface: x\nel.append(b);", ["`// surface:` is allowed only under src/lib and src/kit", "writes the DOM with .append("]);
  check("src/features/week05/a.js", "// bridge: W5-1\nel.textContent = 'x';", []);
  check("src/features/week05/a.js", "// bridge: W5-1\nel.textContent = 'x';", [
    "`// bridge:` is allowed only under src/features/<page>/ while the page's entry exists",
    "writes the DOM with .textContent =",
  ], no);
  check("src/kit/a.js", "// shim: K1\nel.hidden = true;", ["`// shim:` is allowed only under src/features/<page>/ while the page's entry exists", "writes the DOM with .hidden ="]);
  check("src/lib/a.ts", 'document.addEventListener("click", f);', []);
  check("src/kit/a.ts", '// surface: x\ndocument.addEventListener("click", f);', ['adds a document "click" listener']);
  check("src/lib/a.tsx", "// allow-html: trusted\n<div dangerouslySetInnerHTML={{ __html: x }} />", []);
  check("src/kit/a.tsx", "// allow-html: trusted\n<div dangerouslySetInnerHTML={{ __html: x }} />", ["`// allow-html:` is allowed only under src/lib", "uses dangerouslySetInnerHTML"]);
  check("src/features/week05/Chart.tsx", '"use client";\nexport const Chart = island("week05/x/Chart", View, Placeholder, { roots: ["#c"] });', []);
  check("src/features/week05/Chart.tsx", '"use client";\nexport const Chart = island("week05/x/Chart", View, Placeholder, {});', ["island Chart declares no roots:"]);
  check("src/features/week05/Chart.tsx", '"use client";\nexport function Chart() { return null; }', ["exports Chart without island(…)"]);
  check("src/features/week05/Prediction.tsx", "export function Prediction() { return null; }", []);
  check("src/features/week04/RailShell.tsx", '"use client";\nexport function RailShell({ children }) { return children; }', []);
  check("src/features/week04/RailShell.tsx", '"use client";\nexport function RailShell() { const d = useData(u); return null; }', ["a shell uses useData"]);
  check("src/features/week04/slots.tsx", "export function Slot() { return null; }", []);
  check("src/features/week04/slots-panels.tsx", '"use client";\nexport function Slot() { return null; }', ["exports Slot without island(…)", "a slots file is 'use client'"]);
  check("src/kit/A.tsx", "export function A() { return <a href={url(\"x\")}>x</a>; }", ["renders url()/asset()/SITE into an attribute without useHydrated()"]);
  check("src/kit/A.tsx", "export function A() { const h = useHydrated(); return <a href={h ? url(\"x\") : undefined}>x</a>; }", []);
  check("src/kit/A.tsx", "export function A() { return <a href={SITE.href}>x</a>; }", ["renders url()/asset()/SITE into an attribute without useHydrated()"]);
  check("src/kit/A.tsx", "export function A() { useData(asset(\"x.json\")); return null; }", []);
});
