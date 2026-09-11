import {
  setupChrome,
  $,
  load,
  canvasStage,
  drawNetwork,
  tone,
  errorMessage,
} from "./cabinet.js";
import { WEEKS, shortDate } from "./weeks.js";
setupChrome();
document.body.classList.add("unlocked");
const canvas = $("#lobby-canvas");
// data-scene="network" on the canvas swaps the painted arcade room for the
// bare graph. The classic lobby leaves the attribute off.
if (canvas.dataset.scene === "network") networkScene();
else arcadeScene();

function networkScene() {
  load()
    .then((data) => {
      // The five most linked-to articles are lit; the isolates are rings.
      const active = new Set(
        [...data.nodes]
          .sort((a, b) => b.kin - a.kin)
          .slice(0, 5)
          .map((n) => n.id),
      );
      const hollow = new Set(
        data.nodes.filter((n) => n.degree === 0).map((n) => n.id),
      );
      canvasStage(canvas, (c, w, h) =>
        drawNetwork(c, w, h, data, { active, hollow }),
      );
      $("#app-status").hidden = true;
    })
    .catch(errorMessage);
}

function arcadeScene() {
  // One cabinet per course week; the schedule manifest decides which are lit.
  const slots = WEEKS;
  let boxes = [];
  canvasStage(canvas, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const floor = h * 0.91;
    c.strokeStyle = tone("--cv-lobby-line", "#465144");
    c.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      c.beginPath();
      c.moveTo(w / 2, h * 0.3);
      c.lineTo(((i - 4) * w) / 7, h);
      c.stroke();
    }
    for (let y = floor - 20; y < h; y += 19) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    const n = slots.length,
      cw = Math.min(130, (w - 36) / n - 10),
      gap = (w - cw * n) / (n + 1);
    boxes = [];
    for (let i = 0; i < n; i++) {
      const wk = slots[i],
        live = wk.status === "live",
        x = gap + (cw + gap) * i,
        ch = Math.min(285, h * 0.82),
        y = floor - ch;
      boxes.push({ x, y, w: cw, h: ch });
      c.fillStyle = live
        ? tone("--cv-lobby-fill-live", "#233728")
        : tone("--cv-lobby-fill", "#1b221d");
      c.strokeStyle = live
        ? tone("--cv-lobby-stroke-live", "#c2ff63")
        : tone("--cv-lobby-stroke", "#566154");
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 8, y);
      c.lineTo(x + cw - 8, y);
      c.lineTo(x + cw, y + ch * 0.2);
      c.lineTo(x + cw - 7, y + ch * 0.4);
      c.lineTo(x + cw, y + ch * 0.6);
      c.lineTo(x + cw, y + ch);
      c.lineTo(x, y + ch);
      c.lineTo(x, y + ch * 0.6);
      c.lineTo(x + 7, y + ch * 0.4);
      c.lineTo(x, y + ch * 0.2);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = live
        ? tone("--cv-lobby-marquee-live", "#c2ff63")
        : tone("--cv-lobby-marquee", "#72846e");
      c.fillRect(x + 7, y + 10, cw - 14, 24);
      c.fillStyle = live
        ? tone("--cv-lobby-marquee-text-live", "#112018")
        : tone("--cv-lobby-marquee-text", "#112018");
      c.font = `bold ${Math.max(6, cw * 0.087)}px monospace`;
      c.textAlign = "center";
      c.fillText(
        live ? wk.cabinet.marquee || wk.cabinet.name.toUpperCase() : wk.short,
        x + cw / 2,
        y + 26,
        cw - 15,
      );
      c.fillStyle = tone("--cv-lobby-screen", "#0c120e");
      c.fillRect(x + 9, y + 46, cw - 18, ch * 0.36);
      c.strokeStyle = live
        ? tone("--cv-lobby-number-stroke-live", "#c2ff63")
        : tone("--cv-lobby-number-stroke", "#778571");
      c.font = `bold ${cw * 0.4}px monospace`;
      c.fillStyle = live
        ? tone("--cv-lobby-number-live", "#c2ff63")
        : tone("--cv-lobby-number", "#687460");
      c.fillText(String(wk.n).padStart(2, "0"), x + cw / 2, y + ch * 0.41);
      c.fillStyle = tone("--cv-lobby-dot", "#b7c2a8");
      c.beginPath();
      c.arc(x + cw * 0.3, y + ch * 0.58, 3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = live
        ? tone("--cv-lobby-button-live", "#ff937c")
        : tone("--cv-lobby-button", "#6b7263");
      c.beginPath();
      c.arc(x + cw * 0.72, y + ch * 0.59, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = live
        ? tone("--cv-lobby-status-live", "#c2ff63")
        : tone("--cv-lobby-status", "#8b9784");
      c.font = `${Math.max(6, cw * 0.075)}px monospace`;
      c.fillText(
        live ? "READY TO PLAY" : `COMING ${shortDate(wk.date)}`,
        x + cw / 2,
        y + ch * 0.8,
        cw - 15,
      );
      if (!live) {
        c.fillStyle = tone("--cv-lobby-sheet", "#acb99b16");
        c.beginPath();
        c.moveTo(x - 3, y - 4);
        c.lineTo(x + cw + 2, y - 4);
        c.lineTo(x + cw + 5, y + ch * 0.94);
        c.lineTo(x + cw * 0.6, y + ch * 0.88);
        c.lineTo(x - 4, y + ch * 0.94);
        c.closePath();
        c.fill();
      }
    }
    c.textAlign = "left";
  });
  const hit = (e) => {
    const r = e.currentTarget.getBoundingClientRect(),
      x = e.clientX - r.left,
      y = e.clientY - r.top;
    const i = boxes.findIndex(
      (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
    );
    return i >= 0 ? slots[i] : null;
  };
  canvas.addEventListener("click", (e) => {
    const wk = hit(e);
    if (wk?.cabinet) location.href = wk.cabinet.href;
  });
  canvas.addEventListener("mousemove", (e) => {
    e.currentTarget.style.cursor = hit(e)?.cabinet ? "pointer" : "default";
  });
  load()
    .then(() => {
      $("#app-status").hidden = true;
    })
    .catch(errorMessage);
}
