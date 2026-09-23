// Keeps the coding-assistant instructions true to the repository. Copilot, Claude
// Code and Codex read these files on every request; a path or script they name
// that no longer exists sends every teammate's assistant the wrong way.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const inDir = (dir, suffix) =>
  readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith(suffix))
    .map((f) => join(dir, f));

const INSTRUCTIONS = inDir(".github/instructions", ".instructions.md");
const PROMPTS = inDir(".github/prompts", ".prompt.md");
const DOCS = ["AGENTS.md", ".github/copilot-instructions.md", ...INSTRUCTIONS, ...PROMPTS];

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
    const text = read(doc);
    const code = [...text.matchAll(/`([^`\s]+)`/g)].map((m) => m[1]);
    const links = [...text.matchAll(/\]\(([^)\s]+)\)/g)]
      .map((m) => m[1])
      .filter((href) => !/^[a-z]+:/.test(href))
      .map((href) => join(dirname(doc), href));
    const paths = code.filter(
      (p) =>
        /^(analysis|docs|tests|\.github|data|scripts)\//.test(p) &&
        !/[*…<>{}$]/.test(p),
    );
    for (const p of [...paths, ...links]) {
      if (!existsSync(join(ROOT, p))) missing.push(`${doc}: ${p}`);
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
