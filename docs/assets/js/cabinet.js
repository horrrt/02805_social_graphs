import { predictionScore } from "./arcade-core.mjs";
import { liveWeeks, weekLabel, FREE_PLAY_PREDICTIONS } from "./weeks.js";

// Scripts, data and fonts always live under docs/assets/, so ASSETS is docs/.
// A page served from another root (the v2 theme under docs/v2/) declares
// <meta name="site-root" content="../"> so navigation links resolve there.
export const ASSETS = new URL("../../", import.meta.url);
const rootMeta =
  typeof document !== "undefined"
    ? document.querySelector('meta[name="site-root"]')
    : null;
export const ROOT = rootMeta
  ? new URL(rootMeta.content, document.baseURI)
  : ASSETS;
export const url = (path) => new URL(path, ROOT).href;
export const asset = (path) => new URL(path, ASSETS).href;
// Canvas colours are CSS custom properties named --cv-<area>-<role>. They are
// read from body so the per-page theme-* palettes apply. The fallback is the
// classic value, used when the token is missing or there is no document.
export function tone(name, fallback) {
  try {
    const value = getComputedStyle(document.body)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [
  ...root.querySelectorAll(selector),
];
export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const shortName = (n) => n.name.replace(/\s*\(.*\)/, "");
export const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
const cache = new Map();
export function load(name = "arcade_graph.json") {
  if (!cache.has(name))
    cache.set(
      name,
      fetch(asset("assets/data/" + name)).then((r) => {
        if (!r.ok)
          throw new Error(
            "The snapshot could not load. Reload the page to try again.",
          );
        return r.json();
      }),
    );
  return cache.get(name);
}
export function errorMessage(error, target = $("#app-status")) {
  if (target?.id === "app-status") document.body.classList.add("unlocked");
  if (target) {
    target.hidden = false;
    target.textContent = error.message || String(error);
    target.setAttribute("role", "alert");
  }
}

const KEY = "loglog-arcade-v1-20260826";
let memory = { attempts: {} };
function read() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    if (p && p.attempts && typeof p.attempts === "object") memory = p;
  } catch {}
  migrate(memory.attempts);
  return memory;
}
// Guesses recorded before the schedule manifest existed were filed under
// invented weeks 3–8. They keep their ids (the first-guess key) and move to
// free play, so they never count towards a course week that later goes live.
export function migrate(attempts) {
  for (const a of Object.values(attempts))
    if (a && FREE_PLAY_PREDICTIONS.has(a.id)) a.week = null;
  return attempts;
}
function write(state) {
  memory = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    const n = $("#storage-note");
    if (n)
      n.textContent =
        "This browser blocks storage. Scores last for this visit only.";
  }
  updateProgress();
}
export function summarise(attempts, liveWeekNumbers) {
  const live = new Set(liveWeekNumbers);
  const valid = attempts.filter((a) => a && Number.isFinite(a.score));
  const rows = [...live].map((week) => ({
    week,
    attempts: valid.filter((a) => a.week === week),
  }));
  return {
    attempts: valid,
    rows,
    free: valid.filter((a) => !live.has(a.week)),
    weeks: rows.filter((r) => r.attempts.length).length,
    total: live.size,
    score: valid.length
      ? Math.round(valid.reduce((s, a) => s + a.score, 0) / valid.length)
      : 0,
  };
}
export function progress() {
  return summarise(
    Object.values(read().attempts),
    liveWeeks().map((w) => w.n),
  );
}
export function updateProgress() {
  const p = progress();
  $$("[data-progress]").forEach(
    (n) => (n.textContent = `LOGBOOK ${p.weeks}/${p.total}`),
  );
  const list = $("#score-list");
  const row = (label, rows) =>
    `<li><span>${label}</span><strong>${rows.length ? Math.round(rows.reduce((s, a) => s + a.score, 0) / rows.length) + "/100" : "Not played"}</strong><small>${rows.length} first ${rows.length === 1 ? "guess" : "guesses"}</small></li>`;
  if (list)
    list.innerHTML = [
      ...liveWeeks().map((w) =>
        row(
          `${weekLabel(w.n)} · ${w.cabinet.name}`,
          p.rows.find((r) => r.week === w.n).attempts,
        ),
      ),
      row("FREE PLAY", p.free),
    ].join("");
  const mean = $("#score-mean");
  if (mean)
    mean.textContent = p.attempts.length
      ? `${p.score}/100 across ${p.attempts.length} first guesses`
      : "Your first guess starts the story.";
}

export function setupChrome() {
  const host = $("#arcade-chrome");
  if (host)
    host.innerHTML = `<a class="arcade-wordmark" href="${url("")}">LOG–LOG <b>ARCADE</b></a><nav aria-label="Arcade navigation"><a href="${url("os/")}">MARVEL-OS</a><button class="quiet" data-progress id="open-logbook">LOGBOOK 0/${liveWeeks().length}</button><a class="back-link" href="${url("")}">Back to arcade</a></nav>`;
  if (!$("#logbook"))
    document.body.insertAdjacentHTML(
      "beforeend",
      `<dialog id="logbook" aria-labelledby="logbook-title"><div class="dialog-top"><h2 id="logbook-title">Your calibration log</h2><button id="close-logbook">Close</button></div><p id="score-mean"></p><ol class="score-list" id="score-list"></ol><p class="fine">Scores reward numerical prediction accuracy. This is a game score, not a formal measure of calibration. Only your first guess per challenge counts; practice replays cannot overwrite it.</p><p class="fine" id="storage-note">Saved only in this browser. No account, public leaderboard or data upload.</p><button class="quiet" id="export-logbook">Download my log</button><button class="quiet" id="reset-logbook">Reset my log</button></dialog>`,
    );
  $("#open-logbook")?.addEventListener("click", () => {
    updateProgress();
    $("#logbook").showModal();
  });
  $("#close-logbook").addEventListener("click", () => $("#logbook").close());
  $("#reset-logbook").addEventListener("click", () => {
    if (confirm("Reset all first guesses saved in this browser?")) {
      write({ attempts: {} });
      location.reload();
    }
  });
  $("#export-logbook").addEventListener("click", () =>
    download(
      "log-log-predictions.json",
      JSON.stringify(read(), null, 2),
      "application/json",
    ),
  );
  updateProgress();
  window.addEventListener("storage", updateProgress);
}

export function prediction(host, config) {
  const {
    id,
    week,
    prompt,
    min = 0,
    max = 100,
    step = 1,
    answer,
    unit = "",
    explain = "",
    onReveal = () => {},
  } = config;
  const previous = read().attempts[id];
  let revealed = false;
  host.innerHTML = `<div class="prediction-label">PREDICT → REVEAL → LEARN <span>${weekLabel(week)}</span></div><h2>${esc(prompt)}</h2><form class="guess-form"><label for="guess-${esc(id)}">Your estimate ${esc(unit)} <span>${min}–${max}</span></label><div class="guess-row"><input id="guess-${esc(id)}" name="guess" type="number" min="${min}" max="${max}" step="${step}" value="${previous?.guess ?? Math.round((max + min) / 2 / step) * step}" required><input class="guess-range" type="range" aria-label="Adjust your estimate" min="${min}" max="${max}" step="${step}" value="${previous?.guess ?? Math.round((max + min) / 2 / step) * step}"><button type="submit">${previous ? "Replay reveal" : "Lock my guess"}</button></div></form><p class="guess-feedback" role="status" aria-live="polite"></p>`;
  const form = $("form", host),
    number = $("input[type=number]", host),
    range = $("input[type=range]", host),
    feedback = $(".guess-feedback", host);
  number.addEventListener("input", () => {
    range.value = number.value;
  });
  range.addEventListener("input", () => {
    number.value = range.value;
  });
  const reveal = (attempt) => {
    revealed = true;
    host.classList.add("revealed");
    document.body.classList.add("unlocked");
    feedback.textContent = `You guessed ${attempt.guess}${unit ? " " + unit : ""}. Result: ${answer}${unit ? " " + unit : ""}. ${attempt.score}/100. ${explain}`;
    form.hidden = true;
    onReveal(attempt);
    updateProgress();
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const guess = Number(number.value);
      if (number.value === "") return;
      const score = predictionScore(guess, answer, min, max);
      const state = read();
      const attempt = state.attempts[id] || {
        id,
        week: week ?? null,
        prompt,
        guess,
        answer,
        score,
        date: new Date().toISOString(),
      };
      if (!state.attempts[id]) {
        state.attempts[id] = attempt;
        write(state);
      }
      reveal(attempt);
    } catch (error) {
      feedback.textContent = error.message;
    }
  });
  if (previous && previous.answer === answer) reveal(previous);
  return {
    get revealed() {
      return revealed;
    },
  };
}

export function articleOptions(select, data, selected, filter = () => true) {
  select.innerHTML = data.nodes
    .filter(filter)
    .map(
      (n) =>
        `<option value="${esc(n.id)}"${n.id === selected ? " selected" : ""}>${esc(shortName(n))}</option>`,
    )
    .join("");
}

export function download(name, content, type = "text/plain") {
  const objectURL = URL.createObjectURL(
    content instanceof Blob ? content : new Blob([content], { type }),
  );
  const a = document.createElement("a");
  a.href = objectURL;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
}

export function canvasStage(canvas, paint) {
  let width = 0,
    height = 0;
  const draw = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(c, width, height);
  };
  new ResizeObserver(draw).observe(canvas);
  draw();
  return draw;
}

export function drawNetwork(
  c,
  w,
  h,
  data,
  {
    active = new Set(),
    removed = new Set(),
    hollow = new Set(),
    links = data.links,
    color = tone("--cv-net-active", "#baff5b"),
    label = "",
  } = {},
) {
  const positions = new Map(
    data.nodes.map((n) => [
      n.id,
      [(n.x / 930) * (w - 28) + 14, (n.y / 630) * (h - 50) + 20],
    ]),
  );
  c.clearRect(0, 0, w, h);
  c.lineWidth = 0.6;
  c.strokeStyle = tone("--cv-net-edge", "#53625850");
  for (const [a, b] of links) {
    if (
      removed.has(a) ||
      removed.has(b) ||
      !positions.has(a) ||
      !positions.has(b)
    )
      continue;
    const p = positions.get(a),
      q = positions.get(b);
    c.beginPath();
    c.moveTo(...p);
    c.lineTo(...q);
    c.stroke();
  }
  const node = tone("--cv-net-node", "#637167");
  for (const n of data.nodes) {
    if (removed.has(n.id) || hollow.has(n.id)) continue;
    const [x, y] = positions.get(n.id);
    c.fillStyle = active.has(n.id) ? color : node;
    c.beginPath();
    c.arc(x, y, active.has(n.id) ? 4 : 2, 0, Math.PI * 2);
    c.fill();
  }
  if (hollow.size) {
    // Hollow nodes (the isolates) are rings drawn over the filled dots.
    c.lineWidth = 1.5;
    c.strokeStyle = tone("--cv-net-hollow", "#ff937c");
    for (const n of data.nodes) {
      if (!hollow.has(n.id) || removed.has(n.id)) continue;
      const [x, y] = positions.get(n.id);
      c.beginPath();
      c.arc(x, y, 4, 0, Math.PI * 2);
      c.stroke();
    }
  }
  if (label) {
    c.fillStyle = color;
    c.font = "12px monospace";
    c.fillText(label, 16, h - 12);
  }
}
