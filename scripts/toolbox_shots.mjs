// Screenshots of our own components for the toolbox, one small JPEG each.
//
// Reads project/toolbox/components.json; for every item with a place on the site (`seen_at`) it opens that page
// on a running server, finds the section the anchor names (or the top of the page), and photographs it. The
// course's explorables are photographed on the course site. Then every page in project/toolbox/images.json that
// gave no picture is photographed at the top. Each picture is shrunk to 360 px wide with macOS
// `sips` and saved to public/toolbox/thumbs/<key>.jpg; project/toolbox/shots.json maps each item to its file.
//
//   npm run dev                                   # or any server for the site
//   node scripts/toolbox_shots.mjs http://localhost:8765
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:8765";
const items = JSON.parse(readFileSync("project/toolbox/components.json", "utf8")).items;
const OUT = "public/toolbox/thumbs";
const MAP = "project/toolbox/shots.json";
mkdirSync(OUT, { recursive: true });
const shots = existsSync(MAP) ? JSON.parse(readFileSync(MAP, "utf8")) : {};

export const keyOf = (i) => `${i.kind}-${i.name}-${i.where}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
let done = 0;
for (const item of items) {
  const target = item.seen_at ?? (item.where?.startsWith("http") ? item.where : null);
  const key = keyOf(item);
  if (!target || shots[key]) continue;
  const url = target.startsWith("http") ? target : base + target;
  const file = `${OUT}/${key}.jpg`;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    // Hide Next's dev-mode badge, which would otherwise sit in the corner of every shot.
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
    await page.waitForTimeout(2500); // charts draw after hydration and data loads
    const hash = new URL(url).hash.slice(1);
    const el = hash ? page.locator(`[id="${decodeURIComponent(hash)}"]`).first() : null;
    if (el && (await el.count())) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      const box = await el.boundingBox();
      await page.screenshot({ path: file, type: "jpeg", quality: 70, clip: { x: box.x, y: box.y, width: Math.min(box.width, 1280), height: Math.min(Math.max(box.height, 200), 800) } });
    } else {
      await page.screenshot({ path: file, type: "jpeg", quality: 70 });
    }
    execFileSync("sips", ["-Z", "360", file], { stdio: "ignore" });
    shots[key] = `thumbs/${key}.jpg`;
  } catch (e) {
    console.error(`  no shot for ${item.name}: ${String(e).split("\n")[0]}`);
  }
  if (++done % 20 === 0) {
    console.log(`  ${done} shots`);
    writeFileSync(MAP, JSON.stringify(shots, null, 1) + "\n");
  }
}
writeFileSync(MAP, JSON.stringify(shots, null, 1) + "\n");
console.log(`${Object.keys(shots).length} of ${items.length} components have a screenshot`);

// Pages that gave no picture (library examples without a gallery thumbnail, materials without a preview
// image): photograph the top of the page itself. The file goes into project/toolbox/images.json.
const IMAGES = "project/toolbox/images.json";
const images = JSON.parse(readFileSync(IMAGES, "utf8"));
const pending = Object.keys(images).filter((u) => !images[u]);
console.log(`${pending.length} pages without a picture`);
let n = 0;
for (const url of pending) {
  const key = "p-" + url.toLowerCase().replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
  const file = `${OUT}/${key}.jpg`;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
    await page.waitForTimeout(3500); // WebGL and canvas galleries draw a moment after load
    await page.screenshot({ path: file, type: "jpeg", quality: 70 });
    execFileSync("sips", ["-Z", "360", file], { stdio: "ignore" });
    images[url] = `thumbs/${key}.jpg`;
  } catch (e) {
    console.error(`  no shot for ${url}: ${String(e).split("\n")[0]}`);
  }
  if (++n % 25 === 0) {
    console.log(`  ${n}/${pending.length} pages`);
    writeFileSync(IMAGES, JSON.stringify(images, null, 0) + "\n");
  }
}
writeFileSync(IMAGES, JSON.stringify(images, null, 0) + "\n");
console.log(`${Object.values(images).filter(Boolean).length} of ${Object.keys(images).length} pages have a picture`);
await browser.close();
