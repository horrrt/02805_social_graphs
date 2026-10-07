// Writes the files AI agents and crawlers read, into out/ after `next build`:
//
//   <page>/index.md  a Markdown copy of each live page (its <main> and footer)
//   llms.txt         the llmstxt.org index: posts, their Markdown copies, data
//   llms-full.txt    every Markdown copy in one file
//   sitemap.xml      the indexable pages, each with its last commit date
//
// The pages' layouts link their Markdown copy with
// <link rel="alternate" type="text/markdown"> (src/components/agentMeta.tsx).
// robots.txt and /.well-known/ are not written: crawlers read those only at
// the origin root, horrrt.github.io/, which this project path does not own.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { GROUP, liveWeeks } from "../src/scripts/weeks.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const SITE_URL = "https://horrrt.github.io/02805_social_graphs/";
const REPO_URL = "https://github.com/horrrt/02805_social_graphs";

const pad = (n) => String(n).padStart(2, "0");

// Pages that sit under a week's post, by week number.
const EXTRA = {
  6: [
    { path: "weeks/week06/essentials/", group: "week06essentials", label: "Week 6 · Essentials" },
    { path: "weeks/week06/essentials/story/", group: "week06story", label: "Week 6 · Essentials, data story" },
  ],
};

// The lobby and every live week. `group` is the route group whose last commit
// dates the page in the sitemap.
const PAGES = [
  { path: "", group: "home", label: "Lobby" },
  ...liveWeeks().flatMap((w) => [
    {
      path: `weeks/week${pad(w.n)}/`,
      group: `week${pad(w.n)}`,
      label: `Week ${w.n} · ${w.courseTitle}`,
      week: w,
    },
    // A week's companion pages: the post's data files are listed once, under the post.
    ...(EXTRA[w.n] ?? []).map((x) => ({ ...x, week: w, extra: true })),
  ]),
];

// Markup an agent cannot read as text, or that only drives the interactive
// version: scripts, styles, drawings, form controls and the section nav.
const DROP = "script, style, noscript, svg, canvas, template, button, input, select, textarea, dialog, [hidden], [aria-hidden='true'], .skip";

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced" });
turndown.use(gfm);
turndown.remove(["iframe", "object", "embed"]);

function readPage(path) {
  const file = join(OUT, path, "index.html");
  if (!existsSync(file)) throw new Error(`${path}index.html is missing from out/: run \`next build\` first`);
  const { document } = parseHTML(readFileSync(file, "utf8"));
  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? "";
  const base = SITE_URL + path;
  const parts = [document.querySelector("main"), document.querySelector("footer")].filter(Boolean);
  for (const part of parts) {
    for (const node of part.querySelectorAll(DROP)) node.remove();
    // Tables a script fills after load are empty in the built HTML.
    for (const table of part.querySelectorAll("table")) if (!table.querySelector("tr")) table.remove();
    // CSS sets a stat's number and label apart; in text they need a space.
    for (const b of part.querySelectorAll("b, strong")) if (b.nextSibling?.nodeType === 1) b.after(" ");
    // Absolute links, so the Markdown copy works wherever an agent reads it.
    for (const a of part.querySelectorAll("a[href]")) a.setAttribute("href", new URL(a.getAttribute("href"), base).href);
    for (const img of part.querySelectorAll("img[src]")) img.setAttribute("src", new URL(img.getAttribute("src"), base).href);
  }
  return {
    title: document.querySelector("title")?.textContent.trim() ?? "",
    description: meta("description"),
    noindex: /noindex/.test(meta("robots")),
    body: parts.map((part) => turndown.turndown(part.outerHTML)).join("\n\n---\n\n"),
  };
}

function lastCommit(group) {
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", `src/app/(${group})`], { cwd: ROOT, encoding: "utf8" }).trim();
    if (date) return date;
  } catch {
    // Not a git checkout: fall through to today.
  }
  return new Date().toISOString().slice(0, 10);
}

// Every data file a page loads, grouped by week: public/weeks/weekNN/data/ and
// the weekNN_ files in public/assets/data/.
function dataFiles(n) {
  const week = `week${pad(n)}`;
  const files = [];
  const own = join(ROOT, "public/weeks", week, "data");
  if (existsSync(own)) for (const f of readdirSync(own).sort()) files.push(`weeks/${week}/data/${f}`);
  for (const f of readdirSync(join(ROOT, "public/assets/data")).sort()) {
    if (f.startsWith(`${week}_`)) files.push(`assets/data/${f}`);
  }
  return files;
}

const pages = PAGES.map((page) => ({ ...page, ...readPage(page.path), lastmod: lastCommit(page.group) }));

// Front matter carries the page's title and URL; the body keeps the page's own <h1>.
const markdown = (page) =>
  [
    ["---", `title: ${JSON.stringify(page.title)}`, `description: ${JSON.stringify(page.description)}`, `url: ${SITE_URL + page.path}`, "---"].join("\n"),
    page.body,
  ].join("\n\n") + "\n";

for (const page of pages) writeFileSync(join(OUT, page.path, "index.md"), markdown(page));

const lobby = pages[0];
const posts = pages.slice(1);
const entry = (page) => `- [${page.label}: ${page.title.replace(/ · Log–Log Legends$/, "")}](${SITE_URL + page.path}index.md): ${page.description}`;
const llms = [
  "# Log–Log Legends",
  `> ${lobby.description}`,
  [
    `A course website for ${GROUP.course} at DTU, by ${GROUP.members.join(", ")}.`,
    "Each week's post asks a few questions of a network dataset, answers them with an interactive chart, and keeps the method and extra numbers in drawers.",
    "Every page has a Markdown copy at index.md beside its index.html; the links below point to those copies.",
    "Data licences and credits are in each page's footer, which the Markdown copy keeps.",
    `The source, analysis scripts and notebooks are on GitHub: ${REPO_URL}`,
  ].join(" "),
  "## Posts",
  posts.filter((p) => !p.noindex).map(entry).join("\n"),
  "## Data",
  posts
    .filter((p) => !p.extra)
    .flatMap((p) => dataFiles(p.week.n).map((f) => `- [${f.split("/").at(-1)}](${SITE_URL + f}): data behind ${p.label}`))
    .join("\n"),
  "## Optional",
  [
    `- [Lobby](${SITE_URL}index.md): the list of posts and the course schedule`,
    ...posts.filter((p) => p.noindex).map((p) => `${entry(p)} (draft, not yet indexed)`),
    `- [All pages in one file](${SITE_URL}llms-full.txt): every Markdown copy above, concatenated`,
    `- [Source repository](${REPO_URL}): analysis code, notebooks and the site`,
  ].join("\n"),
].join("\n\n") + "\n";
writeFileSync(join(OUT, "llms.txt"), llms);

writeFileSync(join(OUT, "llms-full.txt"), pages.map(markdown).join("\n\n"));

const urls = pages
  .filter((p) => !p.noindex)
  .map((p) => `  <url>\n    <loc>${SITE_URL + p.path}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n  </url>`);
writeFileSync(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
);

console.log(`agent files: ${pages.length} Markdown copies, llms.txt, llms-full.txt, sitemap.xml (${urls.length} URLs)`);
