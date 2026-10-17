// Keeps the coding-assistant instructions true to the repository. Copilot, Claude
// Code and Codex read these files on every request; a path or script they name
// that no longer exists sends every teammate's assistant the wrong way.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, matchesGlob, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const inDir = (dir, suffix) =>
  readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith(suffix))
    .map((f) => join(dir, f));

const INSTRUCTIONS = inDir(".github/instructions", ".instructions.md");
const PROMPTS = inDir(".github/prompts", ".prompt.md");
// The assistant files, and the docs they send an assistant to read.
const DOCS = [
  "AGENTS.md",
  ".github/copilot-instructions.md",
  ...INSTRUCTIONS,
  ...PROMPTS,
  "README.md",
  "DESIGN.md",
  "PRODUCT.md",
  "project/DEVELOPMENT.md",
  "project/POST_GUIDE.md",
  ...globSync("src/*/README.md", { cwd: ROOT }),
];

// A path a doc names must be committed: a file only this checkout has (cloned
// build data, a local build) is missing for every teammate. Outside a git
// checkout, fall back to the file system.
const TRACKED = (() => {
  try {
    const files = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 })
      .split("\0")
      .filter(Boolean);
    const all = new Set(files);
    for (const f of files) {
      for (let d = dirname(f); d !== "."; d = dirname(d)) all.add(d);
    }
    return all;
  } catch {
    return null;
  }
})();
const committed = (p) => {
  const rel = normalize(p).replace(/\/$/, "");
  return TRACKED ? TRACKED.has(rel) : existsSync(join(ROOT, rel));
};

// Paths a doc may name on purpose to say they are gone, and only in a paragraph
// that says so.
const GONE = ["src/scripts/entries/", "src/components/PageScripts.tsx"];
const SAYS_GONE = /\b(gone|deleted|removed|no longer)\b/i;

// A repository path in a code span: one of the top-level folders, with any
// `:line` suffix or `#anchor` taken off.
const REPO_PATH = /^(analysis|data|docs|project|public|review|scripts|src|tests|\.github)\//;
const LINK = /\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g;

// Frontmatter as flat key: value pairs, quotes stripped.
function frontmatter(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!block) return null;
  return Object.fromEntries(
    block[1].split("\n").map((line) => {
      const i = line.indexOf(":");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"(.*)"$/, "$1")];
    }),
  );
}

test("the assistant files are all there", () => {
  assert.ok(INSTRUCTIONS.length >= 3, INSTRUCTIONS.join(", "));
  for (const name of ["check", "review", "ship"]) {
    assert.ok(PROMPTS.includes(`.github/prompts/${name}.prompt.md`), `missing /${name}`);
  }
  assert.match(read("AGENTS.md"), /\.github\/copilot-instructions\.md/);
});

test("every repository path the assistant files name exists", () => {
  const missing = [];
  for (const doc of DOCS) {
    // Paragraphs, with fenced code taken out: example code is not a claim about the tree.
    const paragraphs = read(doc).replace(/^```[\s\S]*?^```/gm, "").split(/\n\s*\n/);
    for (const para of paragraphs) {
      const code = [...para.matchAll(/`([^`\s]+)`/g)]
        .map((m) => m[1].replace(/(:\d+(-\d+)?|#.*)$/, ""))
        .filter((p) => REPO_PATH.test(p) && !/[…<>{}$]/.test(p));
      const links = [...para.matchAll(LINK)]
        .map((m) => m[1].replace(/#.*$/, ""))
        .filter((href) => href && !/^[a-z]+:/.test(href))
        .map((href) => join(dirname(doc), decodeURIComponent(href)));
      for (const p of [...code, ...links]) {
        if (GONE.includes(p) && SAYS_GONE.test(para)) continue;
        const ok = p.includes("*")
          ? globSync(p, { cwd: ROOT }).some((hit) => committed(hit))
          : committed(p);
        if (!ok) missing.push(`${doc}: ${p}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("every applyTo glob matches files", () => {
  for (const doc of INSTRUCTIONS) {
    const meta = frontmatter(read(doc));
    assert.ok(meta?.applyTo, `${doc} has no applyTo`);
    assert.ok(meta.description, `${doc} has no description`);
    for (const glob of meta.applyTo.split(",")) {
      const hits = globSync(glob.trim(), { cwd: ROOT, exclude: (f) => f.includes("node_modules") });
      assert.ok(hits.length > 0, `${doc}: ${glob} matches nothing`);
    }
  }
});

test("the writing rules reach the post prose", () => {
  const meta = frontmatter(read(".github/instructions/writing.instructions.md"));
  const globs = meta.applyTo.split(",").map((g) => g.trim());
  const pages = globSync("src/app/**/*.tsx", { cwd: ROOT });
  assert.ok(pages.length > 0);
  assert.ok(
    pages.some((page) => globs.some((g) => matchesGlob(page, g))),
    `applyTo ${meta.applyTo} matches no page under src/app/`,
  );
});

// Facts the docs state about the code, checked against the code itself.
test("the docs' weekly ranges reach the newest week", () => {
  for (const doc of DOCS) {
    for (const [, kind, last] of read(doc).matchAll(/`analysis\/week01_(\w+)\.py` to `analysis\/week(\d\d)_\1\.py`/g)) {
      const newest = globSync(`analysis/week*_${kind}.py`, { cwd: ROOT }).map((f) => f.match(/week(\d\d)/)[1]).sort().at(-1);
      assert.equal(last, newest, `${doc}: week01_${kind}.py to week${last} stops before week${newest}`);
    }
  }
});

test("the text budget starts where the instructions say", () => {
  const first = read("tests/text-budget.test.mjs").match(/Number\(d\.slice\(4\)\) >= (\d+)/)[1];
  assert.match(read(".github/copilot-instructions.md"), new RegExp(`every post from Week ${first} on`));
});

test("the file a doc names for noindex holds it", () => {
  const named = [];
  for (const doc of DOCS) {
    // "noindex ... in `file`" or "from `file`", within one sentence.
    const text = read(doc).replace(/\s+/g, " ");
    for (const [, file] of text.matchAll(/noindex[^.]*?\b(?:in|from) `(src\/[^`\s]+\.tsx)`/g)) {
      named.push(doc);
      assert.match(read(file), /noindex/, `${doc} puts noindex in ${file}`);
    }
  }
  assert.ok(named.includes(".github/copilot-instructions.md"), "the Never list no longer names the noindex file");
});

// AGENTS.md repeats the Never list so Claude Code and Codex load it with the
// file; the two copies must say the same thing.
test("AGENTS.md and the Copilot instructions share one Never list", () => {
  const never = (doc) => {
    const section = read(doc).split(/^## Never\n/m)[1];
    assert.ok(section, `${doc} has no Never section`);
    return section.split(/^#/m)[0].trim();
  };
  assert.equal(never("AGENTS.md"), never(".github/copilot-instructions.md"));
});

test("every prompt file is named after its slash command and describes itself", () => {
  for (const doc of PROMPTS) {
    const meta = frontmatter(read(doc));
    assert.ok(meta, `${doc} has no frontmatter`);
    assert.equal(meta.name, basename(doc, ".prompt.md"), doc);
    assert.ok(meta.description, `${doc} has no description`);
  }
});

test("the test command the instructions give finds the tests", () => {
  assert.match(read(".github/copilot-instructions.md"), /node --test 'tests\/\*\.test\.mjs'/);
  assert.ok(globSync("tests/*.test.mjs", { cwd: ROOT }).length > 1);
});
