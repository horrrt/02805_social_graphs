// The browser side of runtime.mjs and faults.mjs: a pinned context, the
// settle rule, scenario steps, the snapshot and the comparison. The canonical
// form and every snapshot key are described in scripts/parity/README.md.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import * as builtins from "./evaluate.mjs";
import { HERE } from "./lib.mjs";

export const WEBGL = '#globe-gl, #globe-atlas, [id$="-deck"], .w4-entities-map';
export const PINNED_NOW = Date.UTC(2026, 9, 1, 12, 0, 0);
export const PIXEL_LIMIT = 0.001;
const sha1 = (s) => createHash("sha1").update(s).digest("hex");

// ---------------------------------------------------------------- context

/** Runs in every document before any page script. */
function initScript({ now, faults, seed }) {
  let a = seed >>> 0;
  Math.random = function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const RealDate = Date;
  const clock = () => Math.floor(now + performance.now());
  function PinnedDate(...args) {
    if (!new.target) return new RealDate(clock()).toString();
    return Reflect.construct(RealDate, args.length ? args : [clock()], new.target);
  }
  PinnedDate.prototype = RealDate.prototype;
  PinnedDate.now = clock;
  PinnedDate.parse = RealDate.parse;
  PinnedDate.UTC = RealDate.UTC;
  Object.defineProperty(PinnedDate, "name", { value: "Date" });
  globalThis.Date = PinnedDate;
  if (faults) globalThis.__PARITY_FAULTS__ = new Set(faults);
}

const DATA_RE = /\/(assets\/data|weeks\/[^/]+\/data|assets\/vendor)\//;
const FONT_RE = /\.(woff2?|ttf|otf)(\?|$)|fonts\.(googleapis|gstatic)\.com/;

/**
 * A fresh context and page with the pinned clock, seeded random, request log
 * and console log. opts: motion, faults (array), profile ('slow'), fontsDelay,
 * javaScriptEnabled, abort (array of URL predicates).
 */
export async function openPage(browser, opts = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: opts.motion ? "no-preference" : "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
    javaScriptEnabled: opts.javaScriptEnabled !== false,
  });
  await context.addInitScript(initScript, { now: PINNED_NOW, faults: opts.faults ?? null, seed: 7 });
  const page = await context.newPage();
  const state = { console: [], requests: new Map(), inflight: 0, lastNet: Date.now(), dialog: "accept", origin: "", javaScriptEnabled: opts.javaScriptEnabled !== false };
  const norm = (s) => String(s)
    .replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/g, "ORIGIN")
    .replace(/\[\.WebGL-0x[0-9a-f]+\]/g, "[.WebGL-ADDR]");
  page.on("console", (m) => {
    const type = m.type();
    if (type === "error" || type === "warning") state.console.push(`${type}: ${norm(m.text()).slice(0, 2000)}`);
  });
  page.on("pageerror", (e) => state.console.push(`pageerror: ${norm(e.message).slice(0, 2000)}`));
  page.on("dialog", (d) => (state.dialog === "dismiss" ? d.dismiss() : d.accept()).catch(() => {}));
  page.on("request", (r) => {
    state.inflight++;
    state.lastNet = Date.now();
    const url = new URL(r.url());
    opts.requestLog?.push(r.url());
    if (url.protocol.startsWith("http") && !url.pathname.includes("/_next/")) {
      const key = url.origin === state.origin ? url.pathname : `${url.host}${url.pathname}`;
      state.requests.set(key, (state.requests.get(key) ?? 0) + 1);
    }
  });
  const done = () => { state.inflight = Math.max(0, state.inflight - 1); state.lastNet = Date.now(); };
  page.on("requestfinished", done);
  page.on("requestfailed", done);
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  if (opts.profile === "slow" || opts.fontsDelay || opts.abort?.length) {
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (opts.abort?.some((test) => test(url))) return route.abort();
      if (opts.profile === "slow" && DATA_RE.test(url)) await delay(300);
      if (opts.fontsDelay && FONT_RE.test(url)) await delay(Number(opts.fontsDelay));
      return route.fallback();
    });
  }
  return { context, page, state };
}

/** Waits for the network to go quiet (500 ms with nothing in flight, cap ms). */
async function netQuiet(state, cap) {
  const t0 = Date.now();
  while (Date.now() - t0 < cap) {
    if (state.inflight === 0 && Date.now() - state.lastNet >= 500) return;
    await new Promise((r) => setTimeout(r, 100));
  }
}

/** Fonts, no DOM mutation for 500 ms (cap 8 s), two animation frames. */
async function domQuiet(page) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await new Promise((resolve) => {
      let timer;
      const cap = setTimeout(done, 8000);
      const observer = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(done, 500); });
      function done() { observer.disconnect(); clearTimeout(timer); clearTimeout(cap); resolve(); }
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
      timer = setTimeout(done, 500);
    });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

/** The settle rule after a load: load, network idle, fonts, DOM quiet, two rAF. */
export async function settle(page, state) {
  await page.waitForLoadState("load").catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await netQuiet(state, 8000);
  // Without JavaScript, timers and frames never fire inside evaluate().
  if (state.javaScriptEnabled) await domQuiet(page).catch(() => {});
}

/** The lighter settle before a snapshot that follows an action. */
async function settleAction(page, state) {
  await netQuiet(state, 8000);
  await domQuiet(page).catch(() => {});
}

// ---------------------------------------------------------------- steps

const LOADS = new Set(["reload", "back"]);
export function stepKind(step) {
  return Object.keys(step).find((k) => k !== "label" && k !== "expectError") ?? "?";
}
export function stepLabel(step) {
  if (step.label) return step.label;
  const kind = stepKind(step);
  const v = step[kind];
  if (v === true) return kind;
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return `${kind} ${s}`.slice(0, 60);
}

async function box(page, sel) {
  const loc = page.locator(sel).first();
  await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
  const b = await loc.boundingBox({ timeout: 5000 });
  if (!b) throw new Error(`${sel} has no box`);
  return b;
}

/** Runs one step. Returns a JSON value for {evaluate} steps. */
export async function runStep(page, state, step, ctx) {
  const kind = stepKind(step);
  const v = step[kind];
  const T = { timeout: 5000 };
  switch (kind) {
    case "click": await page.click(v, T); break;
    case "select": await page.selectOption(v[0], v[1], T); break;
    case "type": await page.locator(v[0]).first().pressSequentially(v[1], T); break;
    case "press": if (v[0]) await page.press(v[0], v[1], T); else await page.keyboard.press(v[1]); break;
    case "hover": { const b = await box(page, v[0]); await page.mouse.move(b.x + b.width * (v[1] ?? 0.5), b.y + b.height * (v[2] ?? 0.5)); break; }
    case "drag": {
      const b = await box(page, v[0]);
      const at = ([fx, fy]) => [b.x + b.width * fx, b.y + b.height * fy];
      await page.mouse.move(...at(v[1]));
      await page.mouse.down();
      await page.mouse.move(...at(v[2]), { steps: 12 });
      await page.mouse.up();
      break;
    }
    case "scrollTo": await page.locator(v).first().evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }), null, T); break;
    case "hash": await page.evaluate((h) => { location.hash = h; }, v); break;
    case "back": await page.goBack({ waitUntil: "load" }); await settle(page, state); break;
    case "reload": await page.reload({ waitUntil: "load" }); await settle(page, state); break;
    case "resize": await page.setViewportSize({ width: v[0], height: v[1] }); break;
    case "route": {
      const [glob, how] = v;
      await page.route(glob, async (route) => {
        if (how === "abort") return route.abort();
        if (how?.delay) await new Promise((r) => setTimeout(r, how.delay));
        return route.fallback();
      });
      break;
    }
    case "dialog": state.dialog = v; break;
    case "wait": await page.waitForTimeout(v); break;
    case "evaluate": {
      const fn = ctx.functions[v];
      if (typeof fn !== "function") throw new Error(`no evaluate function ${v}`);
      const result = await fn(page, ...(step.args ?? []));
      return result === undefined ? null : result;
    }
    case "snap": break;
    default: throw new Error(`unknown step ${kind}`);
  }
  // Let the page react before the next step: two frames.
  if (!LOADS.has(kind)) await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
  return undefined;
}

// ---------------------------------------------------------------- snapshot

/** Runs in the page: the canonical body plus every other snapshot field. */
async function pageSnapshot({ webgl, hashTarget, mask = [], select = [], exclude = [], textOf = [] }) {
  const enc = new TextEncoder();
  const hex = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-1", enc.encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const stable = (value) => {
    const seen = new WeakSet();
    return JSON.stringify(value, function (k, v) {
      if (typeof v === "function") return undefined;
      if (v && typeof v === "object") {
        if (v instanceof Node) return `[${v.nodeName}]`;
        if (seen.has(v)) return "[cycle]";
        seen.add(v);
        if (ArrayBuffer.isView(v)) return Array.from(v);
        if (!Array.isArray(v)) return Object.fromEntries(Object.keys(v).sort().map((key) => [key, v[key]]));
      }
      return v;
    });
  };
  const webglHosts = new Set(document.querySelectorAll(webgl));
  const all = (sels) => sels.flatMap((sel) => [...document.querySelectorAll(sel)]);
  const masked = new Set(all(mask));
  const ranges = new Map();
  const insideWebgl = (el) => { for (let p = el.parentElement; p; p = p.parentElement) if (webglHosts.has(p)) return true; return false; };

  // ECharts hosts: their own children collapse to option, renderer and size.
  const charts = new Map();
  const E = window.echarts;
  if (E?.getInstanceByDom) {
    for (const host of document.querySelectorAll("[_echarts_instance_]")) {
      const inst = E.getInstanceByDom(host);
      if (!inst) continue;
      let root = null, renderer = "?";
      try { const painter = inst.getZr().painter; root = painter.getViewportRoot(); renderer = painter.getType(); } catch { /* disposed */ }
      const owned = new Set();
      for (const c of host.children) if ((root && (c === root || c.contains(root))) || c.domBelongToZr) owned.add(c);
      let option = "";
      try { option = await hex(stable(inst.getOption())); } catch (e) { option = `error ${e.message}`; }
      charts.set(host, { owned, desc: `<echarts option="${option}" renderer="${renderer}" width="${inst.getWidth()}" height="${inst.getHeight()}"/>` });
    }
  }

  const URL_ATTRS = new Set(["src", "href", "srcset", "xlink:href"]);
  const FORM = new Set(["INPUT", "SELECT", "OPTION", "TEXTAREA"]);
  const skip = (el) => el.tagName === "SCRIPT" && (!el.src || el.src.includes("/_next/")) || el.tagName === "TEMPLATE";
  // Base and head are served on different ports: absolute URLs say ORIGIN.
  const origin = location.origin;
  const local = (s) => (s.includes(origin) ? s.split(origin).join("ORIGIN") : s);
  const esc = (s) => local(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const attrs = (el) => {
    const list = [];
    for (const a of el.attributes) {
      const name = a.name;
      let value = a.value;
      if (name === "_echarts_instance_" || /^(ec|zr)_\d+$/.test(value)) continue;
      if (FORM.has(el.tagName) && (name === "value" || name === "checked" || name === "selected")) continue;
      if (name === "style") value = el.style.cssText;
      else if (name === "class") value = value.trim().split(/\s+/).join(" ");
      else if (URL_ATTRS.has(name)) value = value.replace(/\?v=[^\s,#&"]*&?/g, (m) => (m.endsWith("&") ? "?" : "")).replace(/&v=[^\s,#&"]*/g, "");
      list.push([name, value]);
    }
    list.sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0));
    let s = list.map(([n, v]) => ` ${n}="${esc(v)}"`).join("");
    if (FORM.has(el.tagName)) {
      const props = { value: el.value, checked: el.checked, selected: el.selected, disabled: el.disabled };
      s += ` {${Object.entries(props).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(",")}}`;
    }
    return s;
  };

  let canon = "";
  let text = "";
  const ids = [];
  const els = [];
  const walk = (el, path) => {
    const tag = el.tagName.toLowerCase();
    const start = canon.length;
    const tStart = text.length;
    if (masked.has(el)) {
      canon += "<masked/>";
      return;
    }
    canon += `<${tag}${attrs(el)}>`;
    const kids = [];
    if (webglHosts.has(el)) {
      canon += "<webgl-children/>";
    } else {
      const chart = charts.get(el);
      if (chart) canon += chart.desc;
      const counts = new Map();
      let run = "";
      const flush = () => {
        if (run) { const t = local(run.replace(/\s+/g, " ")); canon += JSON.stringify(t); text += t + "\n"; run = ""; }
      };
      // tips.js appends div.kit-tip to its host whenever the host lacks one, so
      // whether it sits before or after the chart depends on draw timing (KB07).
      // Walk it last; its own content is still compared.
      const nodes = [...el.childNodes];
      if (el.classList?.contains("kit-tip-host")) {
        const tip = (n) => n.nodeType === 1 && n.classList.contains("kit-tip");
        nodes.sort((a, b) => tip(a) - tip(b));
      }
      for (const node of nodes) {
        if (node.nodeType === 3) {
          if (/\S/.test(node.data)) run += node.data;
          continue;
        }
        if (node.nodeType !== 1) continue;
        const ctag = node.tagName.toLowerCase();
        const n = (counts.get(ctag) ?? 0) + 1;
        counts.set(ctag, n);
        if (skip(node) || chart?.owned.has(node)) continue;
        flush();
        kids.push(ctag);
        walk(node, node.id ? `#${node.id}` : `${path} > ${ctag}:nth-of-type(${n})`);
      }
      flush();
    }
    canon += `</${tag}>`;
    ranges.set(el, [start, canon.length]);
    if (el.id) ids.push([el.id, start, canon.length, kids.join(","), tStart, text.length]);
    else els.push([path, start, canon.length]);
  };
  walk(document.body, "body");

  const attrMap = (el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]).sort());
  const store = (s) => { const o = {}; try { for (let i = 0; i < s.length; i++) o[s.key(i)] = local(String(s.getItem(s.key(i)))); } catch { /* blocked */ } return o; };
  const elPath = (el) => {
    if (!el || el === document.body) return "body";
    if (el.id) return `#${el.id}`;
    const parts = [];
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (e.id) { parts.unshift(`#${e.id}`); break; }
      const same = [...(e.parentElement?.children ?? [])].filter((c) => c.tagName === e.tagName);
      parts.unshift(`${e.tagName.toLowerCase()}:nth-of-type(${same.indexOf(e) + 1})`);
    }
    return parts.join(" > ");
  };
  const canvases = [];
  const isMasked = (el) => [...masked].some((m) => m.contains(el));
  for (const c of document.querySelectorAll("canvas")) {
    if (masked.size && isMasked(c)) continue;
    let hash = null;
    if (!webglHosts.has(c) && !insideWebgl(c)) {
      try { hash = await hex(c.toDataURL()); } catch (e) { hash = `unreadable ${e.name}`; }
    }
    canvases.push([elPath(c), c.width, c.height, hash]);
  }
  let hashTop = null;
  if (hashTarget) {
    const t = document.getElementById(hashTarget.replace(/^#/, ""));
    hashTop = t ? Math.round(t.getBoundingClientRect().top / 2) * 2 : "missing";
  }
  // Lines of innerText that belong to masked or excluded elements are removed
  // once each (a multiset difference), so the rest of the page still counts.
  const lines = (s) => local(s).split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const minus = (list, drop) => {
    const counts = new Map();
    for (const l of drop) counts.set(l, (counts.get(l) ?? 0) + 1);
    return list.filter((l) => { const n = counts.get(l); if (!n) return true; counts.set(l, n - 1); return false; });
  };
  const bodyLines = lines(document.body.innerText);
  const excluded = all(exclude);
  const excludedIds = [...new Set(excluded.flatMap((el) => [el, ...el.querySelectorAll("[id]")]).map((el) => el.id).filter(Boolean))];
  return {
    canon, text, ids, els,
    selected: Object.fromEntries(select.map((sel) => [sel, [...document.querySelectorAll(sel)].map((el) => { const r = ranges.get(el); return r ? canon.slice(r[0], r[1]) : null; })])),
    excludedIds,
    outsideLines: excluded.length ? minus(bodyLines, excluded.flatMap((el) => lines(el.innerText))) : null,
    bodyLines,
    textOf: Object.fromEntries(textOf.map((sel) => [sel, [...document.querySelectorAll(sel)].flatMap((el) => lines(el.innerText))])),
    mainChildren: document.querySelector("main")?.childElementCount ?? null,
    htmlAttrs: attrMap(document.documentElement),
    bodyAttrs: attrMap(document.body),
    innerText: (masked.size ? minus(bodyLines, [...masked].flatMap((el) => lines(el.innerText))) : bodyLines).join("\n"),
    local: store(localStorage),
    session: store(sessionStorage),
    origin,
    url: location.pathname + location.search + location.hash,
    history: history.length,
    scrollY: Math.round(scrollY),
    hashTop,
    focus: elPath(document.activeElement),
    canvases,
    marks: performance.getEntriesByType("mark").filter((m) => m.name.startsWith("island:")).map((m) => `${m.name} ${Math.round(m.startTime)}`),
  };
}

/** Shows the first tooltip of every ECharts instance with series; returns host -> text. */
async function pageTooltips() {
  const out = {};
  const E = window.echarts;
  if (!E?.getInstanceByDom) return out;
  const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  for (const host of document.querySelectorAll("[_echarts_instance_]")) {
    const inst = E.getInstanceByDom(host);
    if (!inst || !(inst.getOption()?.series ?? []).length) continue;
    const key = host.id ? `#${host.id}` : host.className;
    try {
      inst.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: 0 });
      await frames();
      const tips = [...host.querySelectorAll("div"), ...document.body.children].filter((d) => d.domBelongToZr && d.style.display !== "none" && getComputedStyle(d).visibility !== "hidden");
      out[key] = tips.map((d) => d.innerText.replace(/\s+/g, " ").trim()).filter(Boolean).join(" | ");
      inst.dispatchAction({ type: "hideTip" });
      await frames();
    } catch (e) {
      out[key] = `error ${e.message}`;
    }
  }
  return out;
}

/** Takes a snapshot and flattens it into key -> comparable value. */
export async function snapshot(page, state, { hashTarget = null, screenshot = true, mask = [], select = [], exclude = [], textOf = [] } = {}) {
  const s = await page.evaluate(pageSnapshot, { webgl: WEBGL, hashTarget, mask, select, exclude, textOf });
  if (process.env.PARITY_DUMP) {
    // Debugging aid: the canonical body of every snapshot, one file each.
    mkdirSync(process.env.PARITY_DUMP, { recursive: true });
    const name = `${new URL(s.origin).port}-${Date.now()}.html`;
    writeFileSync(join(process.env.PARITY_DUMP, name), s.canon.replace(/></g, ">\n<"));
  }
  const flat = new Map();
  const seen = new Map();
  for (const [id, start, end, kids, tStart, tEnd] of s.ids) {
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    flat.set(`id:#${id}${n > 1 ? `[${n}]` : ""}`, `tree=${sha1(s.canon.slice(start, end)).slice(0, 16)} kids=${sha1(kids).slice(0, 8)} text=${sha1(s.text.slice(tStart, tEnd)).slice(0, 16)}`);
  }
  flat.set("html-attrs", JSON.stringify(s.htmlAttrs));
  flat.set("body-attrs", JSON.stringify(s.bodyAttrs));
  flat.set("text", s.innerText);
  for (const [k, v] of Object.entries(s.local)) flat.set(`local:${k}`, v);
  for (const [k, v] of Object.entries(s.session)) flat.set(`session:${k}`, v);
  flat.set("url", s.url);
  flat.set("history", String(s.history));
  flat.set("scroll", String(s.scrollY));
  if (hashTarget) flat.set(`hash-top:${hashTarget}`, String(s.hashTop));
  flat.set("focus", s.focus);
  const cseen = new Map();
  for (const [path, w, h, hash] of s.canvases) {
    const n = (cseen.get(path) ?? 0) + 1;
    cseen.set(path, n);
    flat.set(`canvas:${path}${n > 1 ? `[${n}]` : ""}`, `${w}x${h}${hash ? ` ${hash.slice(0, 16)}` : ""}`);
  }
  flat.set("console", [...state.console].sort().join("\n"));
  state.console.length = 0;
  for (const [path, n] of state.requests) flat.set(`requests:${path}`, String(n));
  state.requests.clear();
  flat.set("body", sha1(s.canon));
  const els = new Map();
  for (const [path, start, end] of s.els) els.set(path, sha1(s.canon.slice(start, end)));
  let png = null;
  if (screenshot) {
    const hide = [page.locator(WEBGL), ...mask.map((sel) => page.locator(sel))];
    png = await page.screenshot({ mask: hide, caret: "hide", timeout: 15000 }).catch(() => null);
  }
  return { flat, els, png, marks: s.marks, selected: s.selected, excludedIds: s.excludedIds, outsideLines: s.outsideLines, bodyLines: s.bodyLines, textOf: s.textOf, mainChildren: s.mainChildren, innerText: s.innerText };
}

// ---------------------------------------------------------------- scenario run

/**
 * Runs scenarios on one side. Returns records [{k, scenario, label, snap,
 * error, expectError, value, flat, els, png, marks}] for steps inside the range.
 */
export async function runSide(browser, side, { scenarios, range, functions, opts, snap = {}, kStart = 1 }) {
  const records = [];
  let k = kStart - 1;
  for (const sc of scenarios) {
    const total = sc.steps.length + 1;
    const first = k + 1;
    const last = k + total;
    k = last;
    if (range && (last < range[0] || first > range[1])) continue;
    const { context, page, state } = await openPage(browser, opts);
    state.origin = new URL(side.base).origin;
    const ctx = { functions };
    const inRange = (i) => !range || (i >= range[0] && i <= range[1]);
    try {
      await page.goto(side.base + sc.url, { waitUntil: "load", timeout: 30000 });
      await settle(page, state);
      for (let i = 0; i < sc.steps.length; i++) {
        const idx = first + i;
        if (range && idx > range[1]) break;
        const step = sc.steps[i];
        const kind = stepKind(step);
        const rec = { k: idx, scenario: sc.name, label: stepLabel(step), snap: false };
        if (step.expectError) rec.expectError = true;
        try {
          const value = await runStep(page, state, step, ctx);
          if (value !== undefined) rec.value = JSON.stringify(value);
        } catch (e) {
          rec.error = String(e.message).split("\n")[0].replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/g, "ORIGIN").slice(0, 300);
        }
        if (kind === "snap" && inRange(idx)) {
          await settleAction(page, state);
          Object.assign(rec, await snapshot(page, state, snap), { snap: true });
        } else if (kind === "hash" && inRange(idx)) {
          await settleAction(page, state);
          Object.assign(rec, await snapshot(page, state, { ...snap, hashTarget: step.hash }), { snap: true });
        }
        if (inRange(idx)) records.push(rec);
      }
      if (!range || last <= range[1]) {
        const rec = { k: last, scenario: sc.name, label: "end", snap: true };
        await settleAction(page, state);
        Object.assign(rec, await snapshot(page, state, snap));
        const tips = await page.evaluate(pageTooltips).catch((e) => ({ error: e.message }));
        for (const [host, tipText] of Object.entries(tips)) rec.flat.set(`tooltip:${host}`, tipText);
        if (inRange(last)) records.push(rec);
      }
    } catch (e) {
      records.push({ k: first, scenario: sc.name, label: "load", snap: false, error: `scenario aborted: ${String(e.message).split("\n")[0].slice(0, 300)}` });
    } finally {
      await context.close().catch(() => {});
    }
  }
  return records;
}

/** Steps and estimate for --estimate: 4 s per load, 3 s per snapshot, per side. */
export function estimate(scenarios, range) {
  let k = 0, steps = 0, loads = 0, snaps = 0;
  for (const sc of scenarios) {
    const first = k + 1;
    const last = k + sc.steps.length + 1;
    k = last;
    if (range && (last < range[0] || first > range[1])) continue;
    loads++;
    sc.steps.forEach((step, i) => {
      const idx = first + i;
      if (range && idx > range[1]) return;
      const kind = stepKind(step);
      if (LOADS.has(kind)) loads++;
      if (!range || idx >= range[0]) { steps++; if (kind === "snap" || kind === "hash") snaps++; }
    });
    if (!range || last <= range[1]) { steps++; snaps++; }
  }
  return { steps, loads, snaps, seconds: loads * 4 + snaps * 3 };
}

// ---------------------------------------------------------------- compare

/** Known entries: {key, reason, approvedBug?, fp?, supersededBy?}. Keys may use *. */
export function matcher(entries) {
  const res = entries.map((e) => ({ e, re: new RegExp(`^${e.key.split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`) }));
  return (key) => res.find(({ re }) => re.test(key))?.e ?? null;
}

function lineDiff(a, b) {
  const A = a.split("\n"), B = b.split("\n");
  const sa = new Set(A), sb = new Set(B);
  return { onlyBase: A.filter((l) => !sb.has(l)).slice(0, 20), onlyHead: B.filter((l) => !sa.has(l)).slice(0, 20) };
}

function pixelDiff(a, b) {
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  if (A.width !== B.width || A.height !== B.height) return { ratio: 1, diff: null, size: [`${A.width}x${A.height}`, `${B.width}x${B.height}`] };
  const d = new PNG({ width: A.width, height: A.height });
  const n = pixelmatch(A.data, B.data, d.data, A.width, A.height, { threshold: 0.1 });
  return { ratio: n / (A.width * A.height), diff: d };
}

/** Elements without ids that differ, most specific first-in-document, up to 20. */
function bodyPaths(baseEls, headEls) {
  const differing = [];
  for (const [path, h] of headEls) if (baseEls.get(path) !== h) differing.push(path);
  for (const path of baseEls.keys()) if (!headEls.has(path)) differing.push(path);
  // Keep the most specific: drop a path when one of its descendants differs.
  const ancestors = new Set();
  for (const q of differing) {
    for (let i = q.indexOf(" > "); i >= 0; i = q.indexOf(" > ", i + 3)) ancestors.add(q.slice(0, i));
  }
  return differing.filter((p) => !ancestors.has(p)).slice(0, 20);
}

/**
 * Compares one step: base records from each run against the head record.
 * Returns diffs [{key, base, head, detail?, known?}].
 */
export function compareStep(baseRecs, headRec, { known, prefix, reportDir }) {
  const diffs = [];
  const add = (key, base, head, detail) => {
    const full = `${prefix}${key}`;
    const entry = known?.(full);
    diffs.push({ key: full, base, head, ...(detail ? { detail } : {}), ...(entry ? { known: entry.reason ?? true } : {}) });
  };
  const errs = baseRecs.map((r) => r.error ?? null);
  if (!errs.includes(headRec.error ?? null)) add("step-error", errs[0], headRec.error ?? null);
  const vals = baseRecs.map((r) => r.value ?? null);
  if (!vals.includes(headRec.value ?? null)) add("evaluate", vals[0], headRec.value ?? null);
  if (!headRec.snap || baseRecs.some((r) => !r.snap)) return diffs;

  const keys = new Set([headRec.flat.keys(), ...baseRecs.map((r) => r.flat.keys())].flatMap((it) => [...it]));
  for (const key of keys) {
    const hv = headRec.flat.get(key);
    const bvs = baseRecs.map((r) => r.flat.get(key));
    if (key.startsWith("requests:")) {
      const max = Math.max(...bvs.map((v) => Number(v ?? 0)));
      if (Number(hv ?? 0) > max) add(key, String(max), hv);
      continue;
    }
    if (bvs.includes(hv)) continue;
    let detail;
    if (key === "text" && hv !== undefined && bvs[0] !== undefined) detail = lineDiff(bvs[0], hv);
    if (key === "body") detail = { paths: bodyPaths(baseRecs[0].els, headRec.els) };
    if (key === "console" && hv !== undefined && bvs[0] !== undefined) detail = lineDiff(bvs[0], hv);
    add(key, key === "text" ? "(text)" : bvs[0] ?? null, key === "text" ? "(text)" : hv ?? null, detail);
  }
  if (headRec.png && baseRecs.every((r) => r.png)) {
    const results = baseRecs.map((r) => pixelDiff(r.png, headRec.png));
    const best = results.reduce((x, y) => (y.ratio < x.ratio ? y : x));
    if (best.ratio > PIXEL_LIMIT) {
      let file = null;
      if (reportDir && best.diff) {
        mkdirSync(reportDir, { recursive: true });
        file = join(reportDir, `${prefix.replace(/[^\w.-]+/g, "_")}pixels.png`);
        writeFileSync(file, PNG.sync.write(best.diff));
      }
      add("pixels", "", `${(best.ratio * 100).toFixed(3)}% of pixels`, file ? { file } : undefined);
    }
  }
  return diffs;
}

/** Evaluate functions: scenario module exports, then scenarios/<page>/lib.mjs, then built-ins. */
export function functionsFor(scenarioModule, pageLib) {
  return { ...builtins, ...pageLib, ...scenarioModule };
}

export const REPORT_DIR = join(HERE, "reports");
